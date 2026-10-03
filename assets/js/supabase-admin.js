(function () {
    'use strict';

    const client = window.supabaseClient;
    if (!client) {
        console.error('Supabase client is not initialized.');
        return;
    }

    // State Store for Admin Dashboard
    const adminState = {
        currentUser: null,
        currentProfile: null,
        users: [],
        transactions: [],
        deposits: [],
        withdrawals: [],
        selectedUserId: null,
        selectedUser: null,
        selectedUserTransactions: [],
        metrics: {
            totalUsers: 0,
            activeUsers: 0,
            suspendedUsers: 0,
            topupRequiredUsers: 0,
            pendingWithdrawals: 0
        },
        searchQuery: '',
        activeTab: 'all'
    };

    function formatUSD(amount) {
        const num = Number(amount) || 0;
        return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatDate(d) {
        if (!d) return '—';
        const date = new Date(d);
        return isNaN(date.getTime()) ? d : date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    }

    function formatDateTime(d) {
        if (!d) return '—';
        const date = new Date(d);
        return isNaN(date.getTime()) ? d : `${date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} · ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getUserDisplayName(user) {
        if (!user) return 'Unknown user';
        return user.full_name || user.username || user.email || 'User';
    }

    function getUserStatusLabel(status) {
        const normalized = String(status || 'active').toLowerCase();
        return normalized === 'suspended' ? 'Suspended' : normalized === 'pending' ? 'Pending' : 'Active';
    }

    function getRoleBadgeHTML(role) {
        if (role === 'admin') {
            return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-500/20">Admin</span>';
        }
        return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">User</span>';
    }

    function getStatusBadgeHTML(status) {
        const normalized = String(status || 'active').toLowerCase();
        if (normalized === 'suspended') {
            return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300">Suspended</span>';
        }
        if (normalized === 'pending') {
            return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300">Pending</span>';
        }
        return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-300">Active</span>';
    }

    function sanitizeStatusLabel(status) {
        const normalized = String(status || '').toLowerCase();
        if (normalized === 'confirmed' || normalized === 'processed') return 'Confirmed';
        if (normalized === 'pending') return 'Pending';
        if (normalized === 'rejected') return 'Rejected';
        return 'Active';
    }

    function getFinancialStatusBadge(status) {
        const normalized = String(status || '').toLowerCase();
        if (normalized === 'pending') {
            return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300">Pending</span>';
        }
        if (normalized === 'rejected') {
            return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300">Rejected</span>';
        }
        return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-300">Confirmed</span>';
    }

    function normalizeTransactionStatus(status) {
        const normalized = String(status || '').toLowerCase();
        if (['confirmed', 'processed', 'completed', 'settled', 'active'].includes(normalized)) return 'Confirmed';
        if (['rejected', 'declined', 'failed', 'cancelled', 'canceled'].includes(normalized)) return 'Declined';
        return 'Pending';
    }

    function normalizeTransactionType(type) {
        const normalized = String(type || '').trim().toLowerCase();
        if (normalized === 'deposit') return 'Deposit';
        if (normalized === 'withdrawal') return 'Withdrawal';
        if (normalized === 'admin credit') return 'Admin Credit';
        if (normalized === 'admin debit') return 'Admin Debit';
        return String(type || 'Transaction').trim() || 'Transaction';
    }

    // Apple Toast Notification
    function showAdminToast(message, type = 'success') {
        let toast = document.querySelector('[data-admin-toast]');
        let backdrop = document.querySelector('[data-broker-toast-backdrop]');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.setAttribute('data-broker-toast-backdrop', '');
            backdrop.className = 'broker-toast-backdrop';
            document.body.appendChild(backdrop);
        }
        if (!toast) {
            toast = document.createElement('div');
            toast.setAttribute('data-admin-toast', '');
            toast.className = 'broker-toast';
            document.body.appendChild(toast);
        }

        const isSuccess = type === 'success';
        const iconHtml = isSuccess
            ? '<span class="broker-toast__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 9.2 17 19 7"></path></svg></span>'
            : '<span class="broker-toast__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round"><path d="m7 7 10 10M17 7 7 17"></path></svg></span>';

        toast.className = `broker-toast broker-toast--${isSuccess ? 'success' : 'error'} is-visible`;
        toast.innerHTML = `${iconHtml}<span class="broker-toast__message"></span>`;
        toast.querySelector('.broker-toast__message').textContent = String(message ?? '');
        backdrop.classList.add('is-visible');
        toast.style.pointerEvents = 'auto';

        if (toast.__hideTimer) clearTimeout(toast.__hideTimer);

        toast.__hideTimer = setTimeout(() => {
            toast.classList.remove('is-visible');
            toast.classList.add('is-hiding');
            backdrop.classList.remove('is-visible');
            toast.style.pointerEvents = 'none';
            setTimeout(() => toast.classList.remove('is-hiding'), 240);
        }, 1000);
    }

    // Unauthorized / 404 Shield Renderer
    function renderUnauthorizedView(customMessage) {
        window.location.replace('../404.html');
    }

    // Core Authorization Guard: Queries PostgreSQL database for role = 'admin'
    async function verifyAdminRole() {
        const { data: sessionData, error: sessionErr } = await client.auth.getSession();
        if (sessionErr || !sessionData?.session?.user) {
            renderUnauthorizedView('You are not currently logged in. Please sign in to your administrator account.');
            return false;
        }

        const user = sessionData.session.user;
        adminState.currentUser = user;

        // Query the public.profiles table for the user's role
        const { data: profile, error: profileErr } = await client
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        if (profileErr) {
            console.error('[Admin Security] Database query error:', profileErr);
        }

        // Check if database profile has admin role
        const role = profile?.role;

        if (role !== 'admin') {
            console.warn('[Admin Security] Access denied. Current role in database:', role);
            renderUnauthorizedView(`Access denied. The account (${user.email}) does not have administrative clearance.`);
            return false;
        }

        adminState.currentProfile = profile;
        return true;
    }

    // Fetch live data from Supabase
    async function fetchAdminData() {
        try {
            // 1. Fetch all profiles (RLS allows only admins to select all profiles)
            const { data: profiles, error: pErr } = await client
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (!pErr && profiles) {
                adminState.users = profiles;
            } else {
                // If table is empty or just initialized, include current admin
                adminState.users = [
                    {
                        id: adminState.currentUser.id,
                        email: adminState.currentUser.email,
                        full_name: adminState.currentUser.user_metadata?.full_name || 'System Admin',
                        role: 'admin',
                        status: 'active',
                        balance: 0.00,
                        created_at: adminState.currentUser.created_at || new Date().toISOString()
                    }
                ];
            }

            const { data: withdrawals, error: withdrawalsError } = await client
                .from('withdrawals')
                .select('id, user_id, amount, network, address, created_at, status, profiles(full_name, email, username)')
                .eq('status', 'pending')
                .order('created_at', { ascending: true });

            if (withdrawalsError) {
                console.error('[Admin] Pending withdrawals could not be loaded:', withdrawalsError);
                adminState.withdrawals = [];
                showAdminToast('Unable to load pending withdrawals: ' + withdrawalsError.message, 'error');
            } else {
                adminState.withdrawals = withdrawals || [];
            }

            calculateMetrics();
            renderAdminDashboard();

        } catch (err) {
            console.error('[Admin] Data fetch exception:', err);
            showAdminToast('Failed to sync live data: ' + err.message, 'error');
        }
    }

    function calculateMetrics() {
        adminState.metrics = {
            totalUsers: adminState.users.length,
            activeUsers: adminState.users.filter((user) => String(user.status || 'active').toLowerCase() === 'active').length,
            suspendedUsers: adminState.users.filter((user) => String(user.status || '').toLowerCase() === 'suspended').length,
            topupRequiredUsers: adminState.users.filter((user) => String(user.status || '').toLowerCase() === 'topup_required').length,
            pendingWithdrawals: adminState.withdrawals.length
        };
    }

    function refreshSelectedUserView() {
        if (!adminState.selectedUserId) return;
        const refreshedUser = adminState.users.find((user) => user.id === adminState.selectedUserId) || null;
        adminState.selectedUser = refreshedUser;
        if (refreshedUser) {
            loadUserDetails(refreshedUser.id);
        } else {
            adminState.selectedUserTransactions = [];
            renderUserDetailsPanel();
        }
    }

    function renderAdminDashboard() {
        const adminAvatar = document.querySelector('[data-admin-avatar]');
        if (adminAvatar) {
            const displayName = adminState.currentProfile?.full_name || adminState.currentUser.email || 'Admin';
            adminAvatar.textContent = displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
        }

        const metrics = {
            'data-metric-users': adminState.metrics.totalUsers,
            'data-metric-active-users': adminState.metrics.activeUsers,
            'data-metric-suspended-users': adminState.metrics.suspendedUsers,
            'data-metric-topup-users': adminState.metrics.topupRequiredUsers
        };
        Object.entries(metrics).forEach(([attribute, value]) => {
            const element = document.querySelector(`[${attribute}]`);
            if (element) element.textContent = value.toLocaleString();
        });

        const pendingWithdrawalCount = document.querySelector('[data-metric-pending-withdrawals]');
        if (pendingWithdrawalCount) pendingWithdrawalCount.textContent = `${adminState.metrics.pendingWithdrawals} pending`;
        renderPendingWithdrawals();
        populateActionUserSelects();

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    function renderPendingWithdrawals() {
        const container = document.querySelector('[data-admin-pending-withdrawals]');
        if (!container) return;

        if (adminState.withdrawals.length === 0) {
            container.innerHTML = '<p class="admin-withdrawal-empty">No pending withdrawals.</p>';
            return;
        }

        container.innerHTML = adminState.withdrawals.map((withdrawal) => {
            const userName = withdrawal.profiles?.full_name || withdrawal.profiles?.email || 'Account holder';
            return `
                <article class="admin-withdrawal-row">
                    <div class="admin-withdrawal-copy">
                        <div class="admin-withdrawal-heading">
                            <strong>${escapeHtml(userName)}</strong>
                            <time datetime="${escapeHtml(withdrawal.created_at || '')}">${escapeHtml(formatDateTime(withdrawal.created_at))}</time>
                        </div>
                        <p><span>${escapeHtml(withdrawal.network || 'Withdrawal')}</span><span aria-hidden="true">·</span><span>${escapeHtml(withdrawal.address || 'No destination provided')}</span></p>
                    </div>
                    <strong class="admin-withdrawal-amount">${formatUSD(withdrawal.amount)}</strong>
                    <div class="admin-withdrawal-actions">
                        <button type="button" data-approve-withdrawal="${escapeHtml(withdrawal.id)}">Approve</button>
                        <button type="button" data-reject-withdrawal="${escapeHtml(withdrawal.id)}">Reject</button>
                    </div>
                </article>`;
        }).join('');

        container.querySelectorAll('[data-approve-withdrawal]').forEach((button) => {
            button.addEventListener('click', () => window.brokerAdmin.approveWithdrawal(button.dataset.approveWithdrawal));
        });
        container.querySelectorAll('[data-reject-withdrawal]').forEach((button) => {
            button.addEventListener('click', () => window.brokerAdmin.rejectWithdrawal(button.dataset.rejectWithdrawal));
        });
    }

    function renderUserDetailsPanel() {
        const panel = document.querySelector('[data-user-details-panel]');
        const resetButton = document.querySelector('[data-user-detail-reset]');
        if (!panel) return;

        if (!adminState.selectedUser) {
            panel.innerHTML = '<p class="text-xs text-gray-500">Select a user from the directory to view their profile, account status, and recent transaction activity.</p>';
            if (resetButton) resetButton.classList.add('hidden');
            return;
        }

        if (resetButton) resetButton.classList.remove('hidden');

        const user = adminState.selectedUser;
        const isSuspended = String(user.status || 'active').toLowerCase() === 'suspended';
        const recentTransactions = adminState.selectedUserTransactions.length
            ? adminState.selectedUserTransactions.slice(0, 6).map((tx) => `
                <div class="flex items-center justify-between gap-3 border-b border-gray-100 py-2 last:border-b-0 dark:border-gray-800">
                    <div>
                        <p class="text-[11px] font-bold uppercase tracking-wider text-gray-500">${escapeHtml(tx.type || 'transaction')}</p>
                        <p class="text-[10px] text-gray-400">${formatDateTime(tx.created_at)}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs font-bold ${tx.is_positive || tx.type === 'deposit' || tx.type === 'Deposit' ? 'text-green-500' : 'text-primary-500'}">
                            ${tx.is_positive || tx.type === 'deposit' || tx.type === 'Deposit' ? '+' : '-'}${formatUSD(tx.amount || 0)}
                        </p>
                        <p class="text-[10px] text-gray-500">${escapeHtml(tx.status || 'confirmed')}</p>
                    </div>
                </div>
            `).join('')
            : '<p class="text-xs text-gray-500">No recent transactions available for this user.</p>';

        const actionText = isSuspended ? 'Activate user' : 'Suspend user';
        const actionClass = isSuspended ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600';

        panel.innerHTML = `
            <div class="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
                <div class="space-y-4">
                    <div class="flex items-center gap-3">
                        <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/10 text-sm font-black text-primary-500 border border-primary-500/20">
                            ${escapeHtml((getUserDisplayName(user).trim().charAt(0) || 'U').toUpperCase())}
                        </div>
                        <div>
                            <h3 class="text-base font-black text-gray-900 dark:text-white">${escapeHtml(getUserDisplayName(user))}</h3>
                            <p class="text-[11px] text-gray-500">${escapeHtml(user.email || 'No email on file')}</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3 text-xs">
                        <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-900/50">
                            <p class="text-gray-400">Account status</p>
                            <p class="mt-1 font-bold text-gray-900 dark:text-white">${getStatusBadgeHTML(user.status)}</p>
                        </div>
                        <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-900/50">
                            <p class="text-gray-400">Role</p>
                            <p class="mt-1 font-bold text-gray-900 dark:text-white">${getRoleBadgeHTML(user.role)}</p>
                        </div>
                        <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-900/50">
                            <p class="text-gray-400">Total Balance</p>
                            <p class="mt-1 font-bold text-gray-900 dark:text-white font-mono">${formatUSD(user.balance)}</p>
                        </div>
                        <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-900/50">
                            <p class="text-gray-400">Investment</p>
                            <p class="mt-1 font-bold text-gray-900 dark:text-white font-mono">${formatUSD(user.active_invest)}</p>
                        </div>
                        <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-900/50">
                            <p class="text-gray-400">Total Bonus</p>
                            <p class="mt-1 font-bold text-gray-900 dark:text-white font-mono">${formatUSD(user.bonus_balance)}</p>
                        </div>
                        <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-900/50">
                            <p class="text-gray-400">Profit Earned</p>
                            <p class="mt-1 font-bold text-gray-900 dark:text-white font-mono">${formatUSD(user.total_profit)}</p>
                        </div>
                        <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-900/50">
                            <p class="text-gray-400">Registered</p>
                            <p class="mt-1 font-bold text-gray-900 dark:text-white">${formatDate(user.created_at)}</p>
                        </div>
                    </div>

                    <div class="space-y-2 rounded-2xl border border-gray-200 p-3 dark:border-gray-700">
                        <p class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Profile information</p>
                        <div class="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                            <div class="flex justify-between gap-3 border-b border-gray-100 pb-2 dark:border-gray-800"><span>Name</span><span class="font-semibold text-gray-900 dark:text-white">${escapeHtml(user.full_name || 'Not provided')}</span></div>
                            <div class="flex justify-between gap-3 border-b border-gray-100 pb-2 dark:border-gray-800"><span>Email</span><span class="font-semibold text-gray-900 dark:text-white break-all">${escapeHtml(user.email || 'Not provided')}</span></div>
                            <div class="flex justify-between gap-3 border-b border-gray-100 pb-2 dark:border-gray-800"><span>Phone</span><span class="font-semibold text-gray-900 dark:text-white">${escapeHtml(user.phone || 'Not stored')}</span></div>
                            <div class="flex justify-between gap-3"><span>Account status</span><span class="font-semibold text-gray-900 dark:text-white">${escapeHtml(getUserStatusLabel(user.status))}</span></div>
                        </div>
                    </div>

                    <button type="button" data-user-status-toggle class="w-full rounded-xl ${actionClass} px-4 py-2.5 text-xs font-bold text-white transition">
                        ${actionText}
                    </button>
                    <button type="button" data-user-topup-toggle class="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-amber-600">
                        Require Top-up
                    </button>
                </div>

                <div class="space-y-4">
                    <div class="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                        <p class="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Recent Transactions</p>
                        <div class="space-y-1">${recentTransactions}</div>
                    </div>

                    <div class="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                        <p class="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Balance Adjustment</p>
                        <div class="space-y-3">
                            <input type="number" min="0.01" step="0.01" data-admin-balance-amount placeholder="Enter amount" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                            <div class="grid grid-cols-2 gap-2">
                                <button type="button" data-admin-balance-increase class="rounded-xl bg-green-500 px-3 py-2 text-[10px] font-bold text-white hover:bg-green-600">Increase Balance</button>
                                <button type="button" data-admin-balance-decrease class="rounded-xl bg-red-500 px-3 py-2 text-[10px] font-bold text-white hover:bg-red-600">Decrease Balance</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const balanceAmountInput = panel.querySelector('[data-admin-balance-amount]');
        const increaseButton = panel.querySelector('[data-admin-balance-increase]');
        const decreaseButton = panel.querySelector('[data-admin-balance-decrease]');

        if (increaseButton) {
            increaseButton.addEventListener('click', () => {
                const amount = Number(balanceAmountInput?.value || 0);
                if (!amount || amount <= 0) {
                    showAdminToast('Enter a valid amount greater than zero.', 'error');
                    return;
                }
                window.brokerAdmin.adjustBalance(user.id, amount, 'increase');
            });
        }

        if (decreaseButton) {
            decreaseButton.addEventListener('click', () => {
                const amount = Number(balanceAmountInput?.value || 0);
                if (!amount || amount <= 0) {
                    showAdminToast('Enter a valid amount greater than zero.', 'error');
                    return;
                }
                window.brokerAdmin.adjustBalance(user.id, amount, 'decrease');
            });
        }

        const toggleButton = panel.querySelector('[data-user-status-toggle]');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                if (isSuspended) {
                    openUserStatusConfirm(user, 'activate');
                } else {
                    openUserStatusConfirm(user, 'suspend');
                }
            });
        }

        const topUpButton = panel.querySelector('[data-user-topup-toggle]');
        if (topUpButton) {
            topUpButton.addEventListener('click', () => {
                setAdminView('topup-suspension');
                const topUpUserSelect = document.querySelector('#topup-suspension-user');
                if (topUpUserSelect) topUpUserSelect.value = user.id;
            });
        }
    }

    async function loadUserDetails(userId) {
        if (!userId) {
            adminState.selectedUser = null;
            adminState.selectedUserTransactions = [];
            renderUserDetailsPanel();
            return;
        }

        const selectedUser = adminState.users.find((user) => user.id === userId) || null;
        adminState.selectedUser = selectedUser;

        if (!selectedUser) {
            adminState.selectedUserTransactions = [];
            renderUserDetailsPanel();
            return;
        }

        const { data, error } = await client
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (!error && data) {
            adminState.selectedUserTransactions = data;
        } else {
            adminState.selectedUserTransactions = [];
        }

        renderUserDetailsPanel();
    }

    function openUserStatusConfirm(user, action) {
        const overlay = document.querySelector('[data-user-status-confirmation]');
        if (!overlay || !user) return;

        const title = overlay.querySelector('[data-user-status-title]');
        const message = overlay.querySelector('[data-user-status-message]');
        const confirmButton = overlay.querySelector('[data-user-status-confirm]');
        const cancelButton = overlay.querySelector('[data-user-status-cancel]');
        const iconWrap = overlay.querySelector('[data-user-status-icon]');

        const nextStatus = action === 'suspend' ? 'suspended' : action === 'topup_required' ? 'topup_required' : 'active';
        const confirmText = action === 'suspend' ? 'Suspend user' : action === 'activate' ? 'Activate user' : 'Restrict trading';

        if (action === 'topup_required') {
            title.textContent = 'Top-up restriction required?';
            message.textContent = 'This will block trading and withdrawals until the user tops up and the account is reactivated.';
            confirmButton.textContent = 'Restrict trading';
            confirmButton.dataset.userStatusAction = 'topup_required';
            confirmButton.dataset.userStatusTarget = user.id;
            confirmButton.className = 'rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-amber-600';
            iconWrap.className = 'flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500';

            confirmButton.onclick = async () => {
                overlay.hidden = true;
                await toggleUserAccountStatus(user.id, 'topup_required', 'topup_required');
            };
        } else {
            title.textContent = action === 'suspend' ? 'Suspend this user?' : 'Activate this user?';
            message.textContent = action === 'suspend'
                ? 'This will change the user\'s account status to suspended.'
                : 'This will change the user\'s account status back to active.';
            confirmButton.textContent = confirmText;
            confirmButton.dataset.userStatusAction = action;
            confirmButton.dataset.userStatusTarget = user.id;
            confirmButton.className = 'rounded-xl bg-red-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-600';
            iconWrap.className = 'flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500';

            confirmButton.onclick = async () => {
                overlay.hidden = true;
                await toggleUserAccountStatus(user.id, nextStatus, action);
            };
        }

        overlay.hidden = false;

        cancelButton.onclick = () => {
            overlay.hidden = true;
        };
    }

    async function recordAdminAction(adminId, action, targetUserId, details) {
        try {
            const { error } = await client.rpc('record_admin_action', {
                p_action: action,
                p_target_user_id: targetUserId,
                p_details: details
            });
            if (error) throw error;
        } catch (error) {
            console.warn('Admin audit table unavailable or not initialized:', error.message);
        }
    }

    async function toggleUserAccountStatus(userId, nextStatus, actionLabel, reason = '') {
        if (!userId || !nextStatus) return false;

        const record = adminState.users.find((user) => user.id === userId);
        if (!record) return false;

        try {
            let profileUpdate = client
                .from('profiles')
                .update({
                    status: nextStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (actionLabel === 'topup_release') {
                profileUpdate = profileUpdate.eq('status', 'topup_required');
            }

            const { data, error } = await profileUpdate.select();

            if (error) {
                throw error;
            }
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error(actionLabel === 'topup_release'
                    ? 'This account no longer requires a top-up, or its status could not be updated.'
                    : 'No account was updated. Refresh the admin page and try again.');
            }

            const updatedUser = data[0];
            adminState.users = adminState.users.map((user) => user.id === userId ? { ...user, ...updatedUser } : user);
            adminState.selectedUser = { ...adminState.selectedUser, ...updatedUser };

            const actionName = actionLabel === 'suspend'
                ? 'suspended user'
                : actionLabel === 'topup_required'
                ? 'restricted user trading'
                : actionLabel === 'topup_release'
                ? 'released top-up restriction'
                : 'activated user';
            await recordAdminAction(
                adminState.currentUser.id,
                actionName,
                userId,
                `Admin ${actionLabel === 'suspend' ? 'suspended' : actionLabel === 'topup_required' ? 'restricted trading for' : actionLabel === 'topup_release' ? 'released the top-up restriction for' : 'activated'} user ${record.email || 'account'} from ${record.status || 'active'} to ${nextStatus}.${reason ? ` Reason: ${reason}` : ''}`
            );

            showAdminToast(
                actionLabel === 'suspend'
                    ? 'User suspended successfully.'
                    : actionLabel === 'topup_required'
                    ? 'Trading restricted until the user tops up.'
                    : actionLabel === 'topup_release'
                    ? 'Top-up restriction released successfully.'
                    : 'User activated successfully.'
            );
            calculateMetrics();
            renderAdminDashboard();
            renderUsersTable();
            renderUserDetailsPanel();
            return true;
        } catch (err) {
            console.error('[Admin] Status update failed:', err);
            showAdminToast(err.message || 'Unable to update user status.', 'error');
            return false;
        }
    }

    // 1. Users Table
    function renderUsersTable() {
        const tbody = document.querySelector('[data-admin-users-tbody]');
        if (!tbody) return;

        let filtered = adminState.users;
        if (adminState.searchQuery) {
            const q = adminState.searchQuery.toLowerCase();
            filtered = filtered.filter((u) => 
                (u.email && u.email.toLowerCase().includes(q)) ||
                (u.full_name && u.full_name.toLowerCase().includes(q)) ||
                (u.username && u.username.toLowerCase().includes(q))
            );
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="py-12 text-center text-xs text-gray-500">
                        <i data-lucide="users" class="mx-auto mb-2 h-6 w-6 text-gray-400"></i>
                        No registered users found matching query.
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = filtered.map((u) => {
            const initial = (u.full_name || u.email || 'U')[0].toUpperCase();
            const isSuspended = String(u.status || 'active').toLowerCase() === 'suspended';
            const actionLabel = isSuspended ? 'Activate' : 'Suspend';

            return `
                <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition border-b border-gray-100 dark:border-gray-800/60">
                    <td class="py-3 px-4">
                        <button type="button" data-user-select="${u.id}" class="flex w-full items-center gap-3 text-left">
                            <div class="w-8 h-8 rounded-full bg-primary-500/10 text-primary-500 border border-primary-500/20 flex items-center justify-center font-bold text-xs">
                                ${initial}
                            </div>
                            <div>
                                <div class="font-bold text-xs text-gray-900 dark:text-white">${escapeHtml(u.full_name || 'Investor')}</div>
                                <div class="text-[11px] text-gray-400 font-mono">${escapeHtml(u.email || '—')}</div>
                            </div>
                        </button>
                    </td>
                    <td class="py-3 px-4">${getRoleBadgeHTML(u.role)}</td>
                    <td class="py-3 px-4">${getStatusBadgeHTML(u.status)}</td>
                    <td class="py-3 px-4 font-bold text-xs text-gray-900 dark:text-white font-mono">${formatUSD(u.balance)}</td>
                    <td class="py-3 px-4 text-xs text-gray-400">${formatDate(u.created_at)}</td>
                    <td class="py-3 px-4">
                        <div class="flex items-center gap-2">
                            <button type="button" data-user-select="${u.id}" class="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[10px] font-bold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800">View</button>
                            <button type="button" data-user-status="${u.id}" class="rounded-lg ${isSuspended ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500/10 hover:bg-red-500/20 text-red-500'} px-2 py-1 text-[10px] font-bold ${isSuspended ? 'text-white' : ''} transition">${actionLabel}</button>
                        </div>
                    </td>
                </tr>`;
        }).join('');

        const rowButtons = tbody.querySelectorAll('[data-user-select]');
        rowButtons.forEach((button) => {
            button.addEventListener('click', () => {
                adminState.selectedUserId = button.dataset.userSelect;
                loadUserDetails(adminState.selectedUserId);
            });
        });

        const statusButtons = tbody.querySelectorAll('[data-user-status]');
        statusButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const user = adminState.users.find((item) => item.id === button.dataset.userStatus);
                if (!user) return;
                const action = String(user.status || 'active').toLowerCase() === 'suspended' ? 'activate' : 'suspend';
                openUserStatusConfirm(user, action);
            });
        });
    }

    // 2. Transactions Table
    function renderTransactionsTable() {
        const tbody = document.querySelector('[data-admin-transactions-tbody]');
        if (!tbody) return;

        if (adminState.transactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="py-12 text-center text-xs text-gray-500">
                        <i data-lucide="inbox" class="mx-auto mb-2 h-6 w-6 text-gray-400"></i>
                        No transaction activity recorded yet.
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = adminState.transactions.slice(0, 50).map((t) => {
            const userName = t.profiles?.full_name || t.profiles?.email || 'User';
            const normalizedType = normalizeTransactionType(t.type);
            const normalizedStatus = normalizeTransactionStatus(t.status);
            const isPos = Boolean(t.is_positive) || normalizedType === 'Deposit' || normalizedType === 'ROI';
            const color = isPos ? 'text-green-500' : 'text-primary-500';
            const badgeBg = normalizedStatus === 'Confirmed'
                ? 'bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-300'
                : normalizedStatus === 'Declined'
                ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300'
                : 'bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-300';

            return `
                <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition border-b border-gray-100 dark:border-gray-800/60">
                    <td class="w-[18%] whitespace-nowrap py-3 px-4 font-mono text-gray-500 text-xs">${escapeHtml(t.txid || 'TX-90281')}</td>
                    <td class="w-[22%] py-3 px-4 text-xs font-semibold text-gray-800 dark:text-gray-200">${escapeHtml(userName)}</td>
                    <td class="w-[16%] whitespace-nowrap py-3 px-4 font-bold text-xs uppercase">${escapeHtml(normalizedType)}</td>
                    <td class="w-[14%] whitespace-nowrap py-3 px-4 font-bold text-xs ${color}">${isPos ? '+' : '-'}${formatUSD(t.amount)}</td>
                    <td class="w-[14%] whitespace-nowrap py-3 px-4"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeBg}">${normalizedStatus}</span></td>
                    <td class="w-[16%] whitespace-nowrap py-3 px-4 text-xs text-gray-400">${escapeHtml(formatDateTime(t.created_at))}</td>
                </tr>`;
        }).join('');
    }

    // 2. Deposits Table with Action Controls
    function renderDepositsTable() {
        const tbody = document.querySelector('[data-admin-deposits-tbody]');
        if (!tbody) return;

        if (adminState.deposits.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="py-12 text-center text-xs text-gray-500">
                        <i data-lucide="download" class="mx-auto mb-2 h-6 w-6 text-gray-400"></i>
                        No deposit requests recorded yet.
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = adminState.deposits.map((d) => {
            const userName = d.profiles?.full_name || d.profiles?.email || 'User';
            const isPending = d.status === 'pending' || d.status === 'Pending';
            const statusBadge = isPending
                ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300">Pending</span>'
                : d.status === 'rejected' || d.status === 'Rejected'
                ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300">Rejected</span>'
                : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-300">Confirmed</span>';

            const actionButtons = isPending ? `
                <div class="flex items-center gap-1.5">
                    <button type="button" onclick="window.brokerAdmin.approveDeposit('${escapeHtml(d.id)}')" class="px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold rounded-lg transition shadow-sm">
                        Approve
                    </button>
                    <button type="button" onclick="window.brokerAdmin.rejectDeposit('${escapeHtml(d.id)}')" class="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-bold rounded-lg transition">
                        Reject
                    </button>
                </div>
            ` : '<span class="text-[11px] text-gray-400">Complete</span>';

            return `
                <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition border-b border-gray-100 dark:border-gray-800/60">
                    <td class="py-3 px-4">
                        <div class="text-xs font-bold text-gray-900 dark:text-white">${escapeHtml(userName)}</div>
                        <div class="text-[10px] font-mono text-gray-400 truncate max-w-[140px]">${escapeHtml(d.txid || 'TX-000000')}</div>
                    </td>
                    <td class="py-3 px-4 font-bold text-xs text-green-500 font-mono">${formatUSD(d.amount)}</td>
                    <td class="py-3 px-4 text-xs text-gray-500 font-semibold">${escapeHtml(d.asset || 'USDT')} · ${escapeHtml(d.network || 'TRC-20')}</td>
                    <td class="py-3 px-4">${statusBadge}</td>
                    <td class="py-3 px-4 text-xs text-gray-400">${formatDateTime(d.created_at)}</td>
                    <td class="py-3 px-4">${actionButtons}</td>
                </tr>`;
        }).join('');
    }

    // 3. Withdrawals Table with Action Controls
    function renderWithdrawalsTable() {
        const tbody = document.querySelector('[data-admin-withdrawals-tbody]');
        if (!tbody) return;

        if (adminState.withdrawals.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="py-12 text-center text-xs text-gray-500">
                        <i data-lucide="upload" class="mx-auto mb-2 h-6 w-6 text-gray-400"></i>
                        No withdrawal requests recorded yet.
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = adminState.withdrawals.map((w) => {
            const userName = w.profiles?.full_name || w.profiles?.email || 'User';
            const isPending = w.status === 'pending' || w.status === 'Pending';
            const statusBadge = isPending
                ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300">Pending</span>'
                : w.status === 'processed' || w.status === 'Processed'
                ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-300">Processed</span>'
                : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300">Rejected</span>';

            const actionButtons = isPending ? `
                <div class="flex items-center gap-1.5">
                    <button type="button" onclick="window.brokerAdmin.approveWithdrawal('${escapeHtml(w.id)}')" class="px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold rounded-lg transition shadow-sm">
                        Approve
                    </button>
                    <button type="button" onclick="window.brokerAdmin.rejectWithdrawal('${escapeHtml(w.id)}')" class="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-bold rounded-lg transition">
                        Reject
                    </button>
                </div>
            ` : '<span class="text-[11px] text-gray-400">Complete</span>';

            return `
                <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition border-b border-gray-100 dark:border-gray-800/60">
                    <td class="py-3 px-4">
                        <div class="text-xs font-bold text-gray-900 dark:text-white">${escapeHtml(userName)}</div>
                        <div class="text-[10px] font-mono text-gray-400 truncate max-w-[140px]">${escapeHtml(w.address)}</div>
                    </td>
                    <td class="py-3 px-4 font-bold text-xs text-primary-500 font-mono">${formatUSD(w.amount)}</td>
                    <td class="py-3 px-4 text-xs text-gray-500 font-semibold">${escapeHtml(w.network || 'TRC-20')}</td>
                    <td class="py-3 px-4">${statusBadge}</td>
                    <td class="py-3 px-4 text-xs text-gray-400">${formatDateTime(w.created_at)}</td>
                    <td class="py-3 px-4">${actionButtons}</td>
                </tr>`;
        }).join('');
    }

    // Public Admin Interface
    window.brokerAdmin = {
        async refresh() {
            showAdminToast('Refreshing live system data...');
            await fetchAdminData();
        },

        async approveDeposit(depositId) {
            try {
                const { error } = await client.rpc('approve_deposit', { p_deposit_id: depositId });
                if (error) throw error;

                showAdminToast('Deposit approved and user balance updated.');
                await fetchAdminData();
                refreshSelectedUserView();
            } catch (error) {
                console.error('[Admin] Approve deposit failed:', error);
                showAdminToast(error.message || 'Unable to approve deposit.', 'error');
            }
        },

        async rejectDeposit(depositId) {
            try {
                const { error } = await client.rpc('reject_deposit', { p_deposit_id: depositId });
                if (error) throw error;

                showAdminToast('Deposit rejected.', 'error');
                await fetchAdminData();
            } catch (error) {
                console.error('[Admin] Reject deposit failed:', error);
                showAdminToast(error.message || 'Unable to reject deposit.', 'error');
            }
        },

        async approveWithdrawal(withdrawalId) {
            try {
                const { error } = await client.rpc('approve_withdrawal', { p_withdrawal_id: withdrawalId });
                if (error) throw error;

                showAdminToast('Withdrawal approved and balance updated.');
                await fetchAdminData();
                refreshSelectedUserView();
            } catch (error) {
                console.error('[Admin] Approve withdrawal failed:', error);
                showAdminToast(error.message || 'Unable to approve withdrawal.', 'error');
            }
        },

        async rejectWithdrawal(withdrawalId) {
            const { error } = await client.rpc('reject_withdrawal', { p_withdrawal_id: withdrawalId });

            if (error) {
                showAdminToast('Database update failed: ' + error.message, 'error');
                return;
            }

            showAdminToast('Withdrawal rejected.', 'error');
            await fetchAdminData();
        },

        async adjustBalance(userId, amount, direction, description = '') {
            try {
                const numericAmount = Number(amount);
                if (!userId || !numericAmount || numericAmount <= 0) {
                    throw new Error('Invalid adjustment amount.');
                }

                const { error } = await client.rpc('adjust_user_balance', {
                    p_user_id: userId,
                    p_amount: numericAmount,
                    p_direction: direction
                });
                if (error) throw error;

                if (description) {
                    await recordAdminAction(
                        adminState.currentUser.id,
                        'balance adjustment note',
                        userId,
                        description
                    );
                }

                showAdminToast(direction === 'increase' ? 'Balance increased successfully.' : 'Balance decreased successfully.');
                await fetchAdminData();
                refreshSelectedUserView();
                return true;
            } catch (error) {
                console.error('[Admin] Balance adjustment failed:', error);
                showAdminToast(error.message || 'Unable to adjust balance.', 'error');
                return false;
            }
        },

        async applyBalanceAction(userId, balanceType, action, amount, description = '') {
            try {
                const numericAmount = Number(amount);
                if (!userId || !balanceType || !action || !Number.isFinite(numericAmount) || numericAmount < 0 || (action !== 'static' && numericAmount === 0)) {
                    throw new Error('Enter a valid amount for this balance action.');
                }

                const { error } = await client.rpc('admin_apply_balance_action', {
                    p_user_id: userId,
                    p_balance_type: balanceType,
                    p_action: action,
                    p_amount: numericAmount,
                    p_description: description
                });
                if (error) throw error;

                showAdminToast('Balance updated successfully.');
                await fetchAdminData();
                refreshSelectedUserView();
                return true;
            } catch (error) {
                console.error('[Admin] Balance action failed:', error);
                showAdminToast(error.message || 'Unable to update balance.', 'error');
                return false;
            }
        },

        async suspendUser(userId, reason) {
            return toggleUserAccountStatus(userId, 'suspended', 'suspend', reason);
        },

        async unsuspendUser(userId, reason) {
            return toggleUserAccountStatus(userId, 'active', 'activate', reason);
        },

        async requireTopUp(userId, reason) {
            return toggleUserAccountStatus(userId, 'topup_required', 'topup_required', reason);
        },

        async releaseTopUp(userId, reason) {
            return toggleUserAccountStatus(userId, 'active', 'topup_release', reason);
        },

        filterUsers(query) {
            adminState.searchQuery = query;
            renderUsersTable();
            if (window.lucide) window.lucide.createIcons();
        }
    };

    // Apple-Style Logout Flow
    function setupAdminLogout() {
        const links = document.querySelectorAll('[data-logout-link]');
        if (!links.length) return;

        let dialog = document.querySelector('[data-logout-dialog]');
        if (!dialog) {
            dialog = document.createElement('div');
            dialog.setAttribute('data-logout-dialog', '');
            dialog.hidden = true;
            dialog.innerHTML = `
                <div class="logout-dialog-backdrop" data-logout-cancel></div>
                <div class="logout-dialog-sheet" role="dialog" aria-modal="true" aria-labelledby="logout-dialog-title">
                    <div class="logout-dialog-icon"><i data-lucide="log-out"></i></div>
                    <h2 id="logout-dialog-title">Log out of Admin Portal?</h2>
                    <p>Your administrative session will terminate immediately.</p>
                    <div class="logout-dialog-actions">
                        <button type="button" data-logout-confirm>Log out</button>
                        <button type="button" data-logout-cancel>Cancel</button>
                    </div>
                </div>`;
            document.body.appendChild(dialog);
            if (window.lucide) window.lucide.createIcons();
        }

        const close = () => {
            dialog.classList.add('logout-closing');
            dialog.addEventListener('animationend', function handler() {
                dialog.removeEventListener('animationend', handler);
                dialog.hidden = true;
                dialog.classList.remove('logout-closing');
            });
        };
        const open = (event) => {
            event.preventDefault();
            dialog.classList.remove('logout-closing');
            dialog.hidden = false;
        };

        links.forEach((link) => link.addEventListener('click', open));
        dialog.querySelectorAll('[data-logout-cancel]').forEach((button) => button.addEventListener('click', close));
        dialog.querySelector('[data-logout-confirm]')?.addEventListener('click', async (event) => {
            const button = event.currentTarget;
            button.disabled = true;
            button.textContent = 'Logging out...';
            await client.auth.signOut();
            window.location.assign('../login.html');
        });
    }

    function setAdminView(view) {
        const actionView = document.querySelector('.admin-action-view');
        const dashboardView = document.querySelector('.admin-dashboard-view');
        if (dashboardView) dashboardView.hidden = view !== 'dashboard';
        if (actionView) actionView.hidden = view === 'dashboard';
        document.querySelector('[data-action-panel="fund"]')?.toggleAttribute('hidden', view !== 'action');
        document.querySelector('[data-admin-view="plan"]')?.toggleAttribute('hidden', view !== 'plan');
        document.querySelector('[data-admin-view="wallet"]')?.toggleAttribute('hidden', view !== 'wallet');
        document.querySelector('[data-admin-view="suspend"]')?.toggleAttribute('hidden', view !== 'suspend');
        document.querySelector('[data-admin-view="unsuspend"]')?.toggleAttribute('hidden', view !== 'unsuspend');
        document.querySelector('[data-admin-view="topup-suspension"]')?.toggleAttribute('hidden', view !== 'topup-suspension');
        document.querySelector('[data-admin-view="topup-release"]')?.toggleAttribute('hidden', view !== 'topup-release');
        document.querySelectorAll('[data-admin-nav]').forEach((button) => {
            button.classList.toggle('is-active', button.dataset.adminNav === view);
        });
        closeAdminDrawer();
    }

    function closeAdminDrawer() {
        const sidebar = document.getElementById('admin-sidebar');
        const toggle = document.querySelector('[data-admin-menu-toggle]');
        const backdrop = document.querySelector('[data-admin-drawer-close]');
        sidebar?.classList.remove('is-open');
        sidebar?.setAttribute('aria-hidden', 'true');
        toggle?.setAttribute('aria-expanded', 'false');
        toggle?.setAttribute('aria-label', 'Open admin menu');
        if (backdrop) backdrop.hidden = true;
    }

    function setupAdminNavigation() {
        const sidebar = document.getElementById('admin-sidebar');
        const toggle = document.querySelector('[data-admin-menu-toggle]');
        const backdrop = document.querySelector('[data-admin-drawer-close]');
        toggle?.addEventListener('click', () => {
            const open = !sidebar?.classList.contains('is-open');
            sidebar?.classList.toggle('is-open', open);
            sidebar?.setAttribute('aria-hidden', String(!open));
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Close admin menu' : 'Open admin menu');
            if (backdrop) backdrop.hidden = !open;
        });
        backdrop?.addEventListener('click', closeAdminDrawer);
        document.querySelectorAll('[data-admin-nav]').forEach((button) => {
            button.addEventListener('click', () => setAdminView(button.dataset.adminNav));
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeAdminDrawer();
        });
    }

    function populateActionUserSelects() {
        document.querySelectorAll('[data-action-user]').forEach((select) => {
            const currentValue = select.value;
            select.replaceChildren(new Option('Select User', ''));
            adminState.users.forEach((user) => {
                const label = getUserDisplayName(user) + (user.email ? ` (${user.email})` : '');
                select.add(new Option(label, user.id));
            });
            select.value = currentValue;
        });
    }

    function setupActionForms() {
        const fundForm = document.querySelector('[data-admin-fund-form]');
        fundForm?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(fundForm);
            const userId = String(formData.get('user') || '');
            const type = String(formData.get('balanceType') || '');
            const amount = Number(formData.get('amount'));
            const actions = {
                'investment-add': ['investment', 'addition'],
                'investment-static': ['investment', 'static'],
                'investment-deduct': ['investment', 'deduction'],
                'total-balance-add': ['total_balance', 'addition'],
                'total-balance-static': ['total_balance', 'static'],
                'total-balance-deduct': ['total_balance', 'deduction'],
                'total-bonus-add': ['total_bonus', 'addition'],
                'total-bonus-static': ['total_bonus', 'static'],
                'total-bonus-deduct': ['total_bonus', 'deduction'],
                'profit-earned-add': ['profit_earned', 'addition'],
                'profit-earned-static': ['profit_earned', 'static'],
                'profit-earned-deduct': ['profit_earned', 'deduction']
            };
            const balanceAction = actions[type];
            if (!userId || !balanceAction || !Number.isFinite(amount) || amount < 0 || (balanceAction[1] !== 'static' && amount === 0)) {
                showAdminToast('Select a user and enter a valid amount.', 'error');
                return;
            }
            const saved = await window.brokerAdmin.applyBalanceAction(
                userId,
                balanceAction[0],
                balanceAction[1],
                amount,
                String(formData.get('description') || '').trim()
            );
            if (saved) fundForm.reset();
        });

        document.querySelector('[data-admin-plan-form]')?.addEventListener('submit', (event) => {
            event.preventDefault();
            showAdminToast('Plan updates are not configured in the database.', 'error');
        });

        document.querySelector('[data-admin-wallet-form]')?.addEventListener('submit', (event) => {
            event.preventDefault();
            showAdminToast('Wallet updates are not configured in the database.', 'error');
        });

        const suspendForm = document.querySelector('[data-admin-suspend-form]');
        suspendForm?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(suspendForm);
            const userId = String(formData.get('user') || '');
            const reason = String(formData.get('reason') || '').trim();
            if (!userId || !reason || !formData.get('confirm')) {
                showAdminToast('Select a user, enter a reason, and confirm suspension.', 'error');
                return;
            }
            const suspended = await window.brokerAdmin.suspendUser(userId, reason);
            if (suspended) suspendForm.reset();
        });

        const bindStatusActionForm = (selector, action, validationMessage) => {
            const form = document.querySelector(selector);
            form?.addEventListener('submit', async (event) => {
                event.preventDefault();
                const formData = new FormData(form);
                const userId = String(formData.get('user') || '');
                const reason = String(formData.get('reason') || '').trim();
                if (!userId || !reason || !formData.get('confirm')) {
                    showAdminToast(validationMessage, 'error');
                    return;
                }
                if (await action(userId, reason)) form.reset();
            });
        };

        bindStatusActionForm(
            '[data-admin-unsuspend-form]',
            (userId, reason) => window.brokerAdmin.unsuspendUser(userId, reason),
            'Select a user, enter a reason, and confirm unsuspension.'
        );
        bindStatusActionForm(
            '[data-admin-topup-suspension-form]',
            (userId, reason) => window.brokerAdmin.requireTopUp(userId, reason),
            'Select a user, enter a reason, and confirm the top-up restriction.'
        );
        bindStatusActionForm(
            '[data-admin-topup-release-form]',
            (userId, reason) => window.brokerAdmin.releaseTopUp(userId, reason),
            'Select a user, enter a reason, and confirm the release.'
        );
    }

    // Initialize Admin Module
    async function initAdmin() {
        const authorized = await verifyAdminRole();
        if (!authorized) return;

        // Hide loading and unauthorized shield
        const loadingEl = document.getElementById('admin-auth-loading');
        if (loadingEl) loadingEl.remove();

        const notFoundView = document.getElementById('admin-unauthorized-shield');
        if (notFoundView) notFoundView.remove();

        // Reveal dashboard
        const dashboard = document.getElementById('admin-dashboard-app');
        if (dashboard) {
            dashboard.hidden = false;
            dashboard.style.display = 'block';
        }

        document.title = 'Admin Portal | EXNESS Secure Console';

        setupAdminLogout();
        setupAdminNavigation();
        setupActionForms();
        const adminName = document.querySelector('[data-admin-name]');
        if (adminName) {
            adminName.textContent = adminState.currentProfile?.full_name
                || adminState.currentUser?.email?.split('@')[0]
                || 'Administrator';
        }
        setAdminView('dashboard');
        await fetchAdminData();

        // Attach search listener
        const searchInput = document.querySelector('[data-admin-user-search]');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                window.brokerAdmin.filterUsers(e.target.value);
            });
        }
    }

    document.addEventListener('DOMContentLoaded', initAdmin);
})();
