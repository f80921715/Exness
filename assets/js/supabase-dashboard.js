(function () {
    'use strict';

    const client = window.supabaseClient;
    if (!client) return;

    const DASHBOARD_LANGUAGES = [
        ['af', 'Afrikaans', 'ZAR'], ['sq', 'Albanian', 'ALL'], ['am', 'Amharic', 'ETB'],
        ['ar', 'Arabic', 'SAR'], ['hy', 'Armenian', 'AMD'], ['az', 'Azerbaijani', 'AZN'],
        ['eu', 'Basque', 'EUR'], ['be', 'Belarusian', 'BYN'], ['bn', 'Bengali', 'BDT'],
        ['bs', 'Bosnian', 'BAM'], ['bg', 'Bulgarian', 'BGN'], ['ca', 'Catalan', 'EUR'],
        ['ceb', 'Cebuano', 'PHP'], ['ny', 'Chichewa', 'MWK'], ['zh-CN', 'Chinese (Simplified)', 'CNY'],
        ['zh-TW', 'Chinese (Traditional)', 'TWD'], ['co', 'Corsican', 'EUR'], ['hr', 'Croatian', 'EUR'],
        ['cs', 'Czech', 'CZK'], ['da', 'Danish', 'DKK'], ['nl', 'Dutch', 'EUR'],
        ['en', 'English', 'USD'], ['eo', 'Esperanto', 'EUR'], ['et', 'Estonian', 'EUR'],
        ['tl', 'Filipino', 'PHP'], ['fi', 'Finnish', 'EUR'], ['fr', 'French', 'EUR'],
        ['fy', 'Frisian', 'EUR'], ['gl', 'Galician', 'EUR'], ['ka', 'Georgian', 'GEL'],
        ['de', 'German', 'EUR'], ['el', 'Greek', 'EUR'], ['gu', 'Gujarati', 'INR'],
        ['ht', 'Haitian Creole', 'HTG'], ['ha', 'Hausa', 'NGN'], ['haw', 'Hawaiian', 'USD'],
        ['iw', 'Hebrew', 'ILS'], ['hi', 'Hindi', 'INR'], ['hmn', 'Hmong', 'USD'],
        ['hu', 'Hungarian', 'HUF'], ['is', 'Icelandic', 'ISK'], ['ig', 'Igbo', 'NGN'],
        ['id', 'Indonesian', 'IDR'], ['ga', 'Irish', 'EUR'], ['it', 'Italian', 'EUR'],
        ['ja', 'Japanese', 'JPY'], ['jw', 'Javanese', 'IDR'], ['kn', 'Kannada', 'INR'],
        ['kk', 'Kazakh', 'KZT'], ['km', 'Khmer', 'KHR'], ['ko', 'Korean', 'KRW'],
        ['ku', 'Kurdish (Kurmanji)', 'TRY'], ['ky', 'Kyrgyz', 'KGS'], ['lo', 'Lao', 'LAK'],
        ['la', 'Latin', 'EUR'], ['lv', 'Latvian', 'EUR'], ['lt', 'Lithuanian', 'EUR'],
        ['lb', 'Luxembourgish', 'EUR'], ['mk', 'Macedonian', 'MKD'], ['mg', 'Malagasy', 'MGA'],
        ['ms', 'Malay', 'MYR'], ['ml', 'Malayalam', 'INR'], ['mt', 'Maltese', 'EUR'],
        ['mi', 'Maori', 'NZD'], ['mr', 'Marathi', 'INR'], ['mn', 'Mongolian', 'MNT'],
        ['my', 'Myanmar (Burmese)', 'MMK'], ['ne', 'Nepali', 'NPR'], ['no', 'Norwegian', 'NOK'],
        ['ps', 'Pashto', 'AFN'], ['fa', 'Persian', 'IRR'], ['pl', 'Polish', 'PLN'],
        ['pt', 'Portuguese', 'EUR'], ['pa', 'Punjabi', 'INR'], ['ro', 'Romanian', 'RON'],
        ['ru', 'Russian', 'RUB'], ['sm', 'Samoan', 'WST'], ['gd', 'Scottish Gaelic', 'GBP'],
        ['sr', 'Serbian', 'RSD'], ['st', 'Sesotho', 'ZAR'], ['sn', 'Shona', 'ZWL'],
        ['sd', 'Sindhi', 'PKR'], ['si', 'Sinhala', 'LKR'], ['sk', 'Slovak', 'EUR'],
        ['sl', 'Slovenian', 'EUR'], ['so', 'Somali', 'SOS'], ['es', 'Spanish', 'EUR'],
        ['su', 'Sundanese', 'IDR'], ['sw', 'Swahili', 'KES'], ['sv', 'Swedish', 'SEK'],
        ['tg', 'Tajik', 'TJS'], ['ta', 'Tamil', 'INR'], ['te', 'Telugu', 'INR'],
        ['th', 'Thai', 'THB'], ['tr', 'Turkish', 'TRY'], ['uk', 'Ukrainian', 'UAH'],
        ['ur', 'Urdu', 'PKR'], ['uz', 'Uzbek', 'UZS'], ['vi', 'Vietnamese', 'VND'],
        ['cy', 'Welsh', 'GBP'], ['xh', 'Xhosa', 'ZAR'], ['yi', 'Yiddish', 'ILS'],
        ['yo', 'Yoruba', 'NGN'], ['zu', 'Zulu', 'ZAR']
    ];
    const DASHBOARD_LANGUAGE_CURRENCIES = Object.fromEntries(
        DASHBOARD_LANGUAGES.map(([code, , currency]) => [code, currency])
    );
    const DASHBOARD_LANGUAGE_STORAGE_PREFIX = 'dashboard-language:';
    const EXCHANGE_RATE_CACHE_KEY = 'dashboard-usd-exchange-rates-v1';
    const DASHBOARD_TRANSLATIONS = {
        en: {
            'nav.dashboard': 'Dashboard',
            'nav.account': 'Account',
            'nav.deposit': 'Deposit',
            'nav.withdraw': 'Withdraw',
            'nav.history': 'History',
            'nav.transactions': 'Transactions',
            'nav.upgrade': 'Account Upgrade',
            'nav.signal': 'Signal Purchase',
            'nav.settings': 'Account Settings',
            'nav.logout': 'Logout',
            'nav.analysis': 'Live Analysis',
            'nav.loading': 'Loading..',
            'nav.username': 'Username :',
            'nav.contact': 'Contact us!',
            'nav.trade': 'Trade Smarter. Anywhere.',
            'nav.accountLabel': 'Account',
            'nav.depositLabel': 'Deposit',
            'nav.withdrawLabel': 'Withdraw',
            'nav.mailLabel': 'Mail Us',
            'nav.settingsLabel': 'Settings',
            'nav.language': 'language:'
        },
        fr: {
            'nav.dashboard': 'Tableau de bord',
            'nav.account': 'Compte',
            'nav.deposit': 'Dépôt',
            'nav.withdraw': 'Retrait',
            'nav.history': 'Historique',
            'nav.transactions': 'Transactions',
            'nav.upgrade': 'Mise à niveau du compte',
            'nav.signal': 'Achat de signal',
            'nav.settings': 'Paramètres du compte',
            'nav.logout': 'Déconnexion',
            'nav.analysis': 'Analyse en direct',
            'nav.loading': 'Chargement..',
            'nav.username': 'Nom d’utilisateur :',
            'nav.contact': 'Contactez-nous !',
            'nav.trade': 'Tradez plus intelligemment. Partout.',
            'nav.accountLabel': 'Compte',
            'nav.depositLabel': 'Dépôt',
            'nav.withdrawLabel': 'Retrait',
            'nav.mailLabel': 'Mail',
            'nav.settingsLabel': 'Réglages',
            'nav.language': 'langue:'
        },
        es: {
            'nav.dashboard': 'Panel',
            'nav.account': 'Cuenta',
            'nav.deposit': 'Depósito',
            'nav.withdraw': 'Retiro',
            'nav.history': 'Historial',
            'nav.transactions': 'Transacciones',
            'nav.upgrade': 'Actualización de cuenta',
            'nav.signal': 'Compra de señales',
            'nav.settings': 'Ajustes de la cuenta',
            'nav.logout': 'Cerrar sesión',
            'nav.analysis': 'Análisis en vivo',
            'nav.loading': 'Cargando..',
            'nav.username': 'Usuario :',
            'nav.contact': '¡Contáctanos!',
            'nav.trade': 'Opera mejor. En cualquier lugar.',
            'nav.accountLabel': 'Cuenta',
            'nav.depositLabel': 'Depósito',
            'nav.withdrawLabel': 'Retiro',
            'nav.mailLabel': 'Correo',
            'nav.settingsLabel': 'Ajustes',
            'nav.language': 'idioma:'
        }
    };
    let usdExchangeRates = { USD: 1 };
    let languageApplyTimer = null;

    function storedDashboardLanguage(user = currentUser) {
        if (!user?.id) return null;
        try {
            const language = localStorage.getItem(`${DASHBOARD_LANGUAGE_STORAGE_PREFIX}${user.id}`);
            return DASHBOARD_LANGUAGE_CURRENCIES[language] ? language : null;
        } catch (error) {
            return null;
        }
    }

    function dashboardLanguage(user = currentUser) {
        return storedDashboardLanguage(user) || user?.user_metadata?.language || 'en';
    }

    function dashboardCurrency(user = currentUser) {
        const language = storedDashboardLanguage(user) || user?.user_metadata?.language || 'en';
        if (DASHBOARD_LANGUAGE_CURRENCIES[language]) return currencyForUserLanguage(language, user);
        const country = user?.user_metadata?.country;
        return user?.user_metadata?.currency || (country && window.accountPreferences?.currencyForCountry(country)) || 'USD';
    }

    function countryDefaultCurrency(user) {
        const country = user?.user_metadata?.country;
        return (country && window.accountPreferences?.currencyForCountry(country)) || user?.user_metadata?.currency || 'USD';
    }

    function currencyForUserLanguage(language, user) {
        return language === 'en' ? countryDefaultCurrency(user) : currencyForDashboardLanguage(language);
    }

    function saveDashboardLanguage(user, language) {
        if (!user?.id || !DASHBOARD_LANGUAGE_CURRENCIES[language]) return;
        localStorage.setItem(`${DASHBOARD_LANGUAGE_STORAGE_PREFIX}${user.id}`, language);
    }

    function applyStoredDashboardPreference(user) {
        const language = storedDashboardLanguage(user);
        if (!language) return user;
        return {
            ...user,
            user_metadata: {
                ...user.user_metadata,
                language,
                currency: currencyForUserLanguage(language, user)
            }
        };
    }

    function currencyForDashboardLanguage(language) {
        return DASHBOARD_LANGUAGE_CURRENCIES[language] || 'USD';
    }

    function setUsdExchangeRates(rates) {
        if (!rates || typeof rates !== 'object' || Number(rates.USD) !== 1) return false;
        usdExchangeRates = rates;
        if (currentAccountData) hydrateUI();
        return true;
    }

    async function loadUsdExchangeRates() {
        let cachedRates = null;
        try {
            const cached = JSON.parse(localStorage.getItem(EXCHANGE_RATE_CACHE_KEY) || 'null');
            if (cached?.rates && setUsdExchangeRates(cached.rates)) {
                cachedRates = cached.rates;
                if (Number(cached.expiresAt) > Date.now()) return;
            }
        } catch (error) {
            cachedRates = null;
        }

        try {
            const response = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' });
            if (!response.ok) throw new Error(`Exchange rates returned HTTP ${response.status}`);
            const payload = await response.json();
            if (payload.result !== 'success' || !setUsdExchangeRates(payload.rates)) {
                throw new Error('Exchange rate response was invalid.');
            }
            const expiresAt = (Number(payload.time_next_update_unix) || Date.now() / 1000 + 86400) * 1000;
            localStorage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify({ rates: payload.rates, expiresAt }));
        } catch (error) {
            if (!cachedRates) console.warn('Live currency conversion is unavailable; displaying USD amounts.', error);
        }
    }

    function convertedCurrencyAmount(amount) {
        const requestedCurrency = dashboardCurrency();
        const rate = Number(usdExchangeRates[requestedCurrency]);
        if (requestedCurrency !== 'USD' && (!Number.isFinite(rate) || rate <= 0)) {
            return { amount: Number(amount) || 0, currency: 'USD' };
        }
        return {
            amount: (Number(amount) || 0) * (requestedCurrency === 'USD' ? 1 : rate),
            currency: requestedCurrency
        };
    }

    function normalizeRoundTripAmount(amount, currency, rate) {
        if (currency === 'USD') return amount;
        const wholeAmount = Math.round(amount);
        const conversionTolerance = rate / 200 + 1e-8;
        return Math.abs(amount - wholeAmount) <= conversionTolerance ? wholeAmount : amount;
    }

    // Helper: format currency
    function formatUSD(amount) {
        const converted = convertedCurrencyAmount(amount);
        const rate = Number(usdExchangeRates[converted.currency]) || 1;
        const displayAmount = normalizeRoundTripAmount(converted.amount, converted.currency, rate);
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: converted.currency,
                currencyDisplay: 'narrowSymbol'
            }).format(displayAmount);
        } catch (error) {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount) || 0);
        }
    }

    function formatShortUSD(amount) {
        const converted = convertedCurrencyAmount(amount);
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: converted.currency,
                currencyDisplay: 'narrowSymbol',
                maximumFractionDigits: 0
            }).format(converted.amount);
        } catch (error) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0
            }).format(Number(amount) || 0);
        }
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
            bonusBalance: 0.00,
            activeInvest: 0.00,
            totalProfit: 0.00,
            totalWithdrawn: 0.00,
            activePlan: null,
            deposits: [],
            withdrawals: [],
            trades: [],
            investments: [],
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

    function showSuspendedBanner() {
        const existing = document.querySelector('[data-suspended-banner]');
        if (existing) {
            existing.innerHTML = accountTopUpRequired
                ? 'Top up your account to continue trading.'
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
            ? 'Top up your account to continue trading.'
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
                profileStatus.innerHTML = '<div class="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-300"><div class="flex items-center gap-3"><i data-lucide="shield-alert" class="h-5 w-5"></i><div><p class="text-sm font-black">Top-up required</p><p class="text-xs text-amber-700/80 dark:text-amber-300/80">Top up your account to continue trading.</p></div></div></div>';
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

        data.bonusBalance = Number(data.bonusBalance ?? data.bonus) || 0;

        // Ensure all arrays exist
        data.deposits = data.deposits || [];
        data.withdrawals = data.withdrawals || [];
        data.trades = data.trades || [];
        data.investments = data.investments || [];
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

    async function saveAccountTransaction({ txid, type, asset, amount, fee = 0, status = 'pending', isPositive = false }) {
        if (!currentUser?.id) throw new Error('Your session expired. Sign in again before submitting this action.');

        const { error } = await client.from('transactions').insert({
            user_id: currentUser.id,
            txid,
            type,
            asset,
            amount,
            fee,
            status,
            is_positive: isPositive
        });
        if (error) throw error;
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
        async deposit({ amount, asset, network, address, txid }) {
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
            const depositAsset = asset || 'USDT';
            const depositNetwork = network || 'TRC-20';
            let savedDeposit;
            try {
                if (!currentUser?.id) throw new Error('Your session expired. Sign in again before submitting this deposit.');
                const { data, error } = await client.from('deposits').insert({
                    user_id: currentUser.id,
                    txid: transactionId,
                    asset: depositAsset,
                    network: depositNetwork,
                    address: address || '',
                    amount: num,
                    status: 'pending'
                }).select('id, created_at').single();
                if (error) throw error;
                savedDeposit = data;
            } catch (error) {
                console.error('[Dashboard] Deposit request could not be saved:', error);
                showAppleToast(error.message || 'Unable to submit deposit for review.', 'error');
                return false;
            }

            const depositRecord = {
                id: savedDeposit.id,
                txid: transactionId,
                amount: num,
                asset: depositAsset,
                network: depositNetwork,
                address: address || '',
                date: savedDeposit.created_at || new Date().toISOString(),
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

            try {
                await saveAccountTransaction({
                    txid: transactionId,
                    type: 'Deposit',
                    asset: `${depositRecord.asset} (${depositRecord.network})`,
                    amount: num,
                    status: 'pending',
                    isPositive: true
                });
            } catch (error) {
                console.warn('[Dashboard] Deposit transaction audit row could not be saved:', error);
            }

            persistAccountData();
            hydrateUI();
            showAppleToast(`Deposit request of ${formatUSD(num)} submitted for review.`);
            return true;
        },

        // 2. WITHDRAWAL
        async withdraw({ amount, network, address }) {
            if (accountSuspended || accountTopUpRequired) {
                showAppleToast('Top up your account to continue trading.', 'error');
                return false;
            }

            const num = parseFloat(amount);
            if (isNaN(num) || num <= 0) {
                showAppleToast('Please enter a valid withdrawal amount', 'error');
                return false;
            }

            const currency = dashboardCurrency();
            const rate = Number(usdExchangeRates[currency]) || 1;
            const convertedBal = convertedCurrencyAmount(currentAccountData.balance);
            const userCurrencyMax = normalizeRoundTripAmount(convertedBal.amount, convertedBal.currency, rate);

            if (num > userCurrencyMax + 0.05) {
                showAppleToast(`Insufficient balance. Available: ${formatUSD(currentAccountData.balance)}`, 'error');
                return false;
            }

            // Convert amount from user's currency to USD for storage
            const usdAmount = currency === 'USD' || !Number.isFinite(rate) || rate <= 0
                ? num
                : Math.round((num / rate + Number.EPSILON) * 100) / 100;
            const fee = 1.00;
            const net = Math.max(0, usdAmount - fee);
            const transactionId = 'TX-' + Math.floor(1000000 + Math.random() * 9000000);

            let savedWithdrawal;
            try {
                if (!currentUser?.id) throw new Error('Sign in again before submitting a withdrawal.');
                const { data, error } = await client.from('withdrawals').insert({
                    user_id: currentUser.id,
                    txid: transactionId,
                    amount: usdAmount,
                    fee: fee,
                    net_amount: net,
                    network: network || 'USDT (TRC-20)',
                    address: address || '',
                    status: 'pending'
                }).select('id, created_at').single();
                if (error) throw error;
                savedWithdrawal = data;
            } catch (error) {
                console.error('[Dashboard] Withdrawal request could not be saved:', error);
                showAppleToast(error.message || 'Unable to submit withdrawal for approval.', 'error');
                return false;
            }

            const withdrawalRecord = {
                id: savedWithdrawal.id,
                txid: transactionId,
                amount: usdAmount,
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
                amount: usdAmount,
                formattedAmount: `-${formatUSD(usdAmount)}`,
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

            try {
                const { error: transactionError } = await client.from('transactions').insert({
                    user_id: currentUser.id,
                    txid: transactionId,
                    type: 'Withdrawal',
                    asset: withdrawalRecord.network,
                    amount: usdAmount,
                    fee: fee,
                    status: 'pending',
                    is_positive: false
                });
                if (transactionError) console.warn('[Dashboard] Withdrawal transaction audit row could not be saved:', transactionError);
            } catch (error) {
                console.warn('[Dashboard] Withdrawal transaction audit row could not be saved:', error);
            }

            persistAccountData();
            hydrateUI();
            showAppleToast(`Withdrawal request of ${formatUSD(usdAmount)} submitted for approval.`);
            return true;
        },

        // 3. EXECUTE TRADE
        async trade({ symbol, side, amount, leverage, orderType }) {
            if (accountSuspended || accountTopUpRequired) {
                showAppleToast('Top up your account to continue trading.', 'error');
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
            const entryPrices = { 'EURUSD': 1.17489, 'GOLD': 2650.00, 'BTC': 59420.00, 'ETH': 2480.00 };
            const entry = entryPrices[symbol] || 248.50;
            const transactionId = 'TX-' + Math.floor(1000000 + Math.random() * 9000000);
            try {
                await saveAccountTransaction({
                    txid: transactionId,
                    type: `${side.toUpperCase()} Order`,
                    asset: `${symbol} (${levNum}x Leverage)`,
                    amount: num,
                    status: 'confirmed',
                    isPositive: side === 'buy'
                });
            } catch (error) {
                console.error('[Dashboard] Trade could not be saved:', error);
                showAppleToast(error.message || 'Unable to execute trade.', 'error');
                return false;
            }

            const tradeRecord = {
                id: 'pos_' + Date.now(),
                txid: transactionId,
                symbol: symbol || 'EURUSD',
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

            persistAccountData();
            hydrateUI();
            showAppleToast(`${side.toUpperCase()} ${symbol} order executed!`);
            return true;
        },

        // 4. CLOSE TRADE
        async closeTrade(tradeId) {
            const index = currentAccountData.trades.findIndex((t) => t.id === tradeId);
            if (index === -1 || currentAccountData.trades[index].status === 'Closed') return false;

            const trade = currentAccountData.trades[index];
            // Simulate simulated reasonable gain/loss (e.g. +3.5%)
            const pnl = trade.amount * 0.035;
            const closeTxId = 'TX-' + Math.floor(1000000 + Math.random() * 9000000);
            try {
                await saveAccountTransaction({
                    txid: closeTxId,
                    type: 'Closed Position',
                    asset: `${trade.symbol} (${trade.side.toUpperCase()})`,
                    amount: pnl,
                    status: 'confirmed',
                    isPositive: pnl >= 0
                });
            } catch (error) {
                console.error('[Dashboard] Position close could not be saved:', error);
                showAppleToast(error.message || 'Unable to close position.', 'error');
                return false;
            }

            trade.status = 'Closed';
            trade.pnl = pnl;

            currentAccountData.balance += pnl;
            currentAccountData.totalProfit += Math.max(0, pnl);

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

            persistAccountData();
            hydrateUI();
            showAppleToast(`Position closed. P&L: +${formatUSD(pnl)}`);
            return true;
        },

        // 5. SUBSCRIBE TO INVESTMENT PLAN
        async invest({ planName, capital, dailyRate, durationDays }) {
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

            const planTxId = 'TX-' + Math.floor(1000000 + Math.random() * 9000000);
            try {
                await saveAccountTransaction({
                    txid: planTxId,
                    type: 'Plan Subscription',
                    asset: plan.name,
                    amount: cap,
                    status: 'confirmed',
                    isPositive: false
                });
            } catch (error) {
                console.error('[Dashboard] Plan subscription could not be saved:', error);
                showAppleToast(error.message || 'Unable to subscribe to this plan.', 'error');
                return false;
            }

            currentAccountData.balance -= cap;
            currentAccountData.activeInvest += cap;
            currentAccountData.activePlan = plan;
            currentAccountData.investments.unshift(plan);
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

            persistAccountData();
            hydrateUI();
            showAppleToast(`Subscribed to ${plan.name}!`);
            return true;
        },

        // 6. NOTIFICATIONS READ/UNREAD
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
        const country = currentUser.user_metadata?.country || '';
        const language = dashboardLanguage(currentUser);
        const currency = dashboardCurrency(currentUser);
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
        document.querySelectorAll('[data-auth-username-label]').forEach((el) => { el.textContent = username; });
        document.querySelectorAll('[data-auth-email]').forEach((el) => {
            if ('value' in el) el.value = currentUser.email || '';
            else el.textContent = currentUser.email || '';
        });
        document.querySelectorAll('[data-auth-phone]').forEach((el) => { el.value = phone; });
        document.querySelectorAll('[data-auth-country]').forEach((el) => { el.value = country; });
        document.querySelectorAll('[data-auth-currency]').forEach((el) => { el.value = currency; });
        document.querySelectorAll('[data-user-currency]').forEach((el) => {
            if ('value' in el && el.tagName === 'INPUT') el.value = currency;
            else el.textContent = currency;
        });
        document.querySelectorAll('[data-auth-language]').forEach((el) => { el.value = language; });
        document.querySelectorAll('[data-dashboard-language]').forEach((el) => { el.value = language; });
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
        document.querySelectorAll('[data-auth-bonus]').forEach((el) => {
            el.textContent = formatUSD(data.bonusBalance ?? data.bonus ?? 0);
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

        // 8. Update Trading Activity
        document.querySelectorAll('[data-auth-trade-count]').forEach((el) => {
            const count = Array.isArray(data.trades) ? data.trades.length : 0;
            el.textContent = `${count} ${count === 1 ? 'trade' : 'trades'}`;
        });

        // 9. Update Referral Link
        hydrateReferralLink(currentUser);

        // Recreate Lucide icons if dynamically updated
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    function transactionHistoryVisible(transaction) {
        const type = String(transaction.type || '').trim().toLowerCase();
        const asset = String(transaction.asset || '').trim().toLowerCase();
        if (type.includes('profit') || type.includes('bonus') || asset.includes('profit') || asset.includes('bonus')) return false;
        if (type === 'admin credit' || type === 'admin debit') {
            return asset === 'balance adjustment' || asset === 'total balance';
        }
        return true;
    }

    function historyDisplayType(type) {
        const normalized = String(type || '').trim().toLowerCase();
        if (normalized === 'admin credit') return 'Deposit';
        if (normalized === 'admin debit') return 'Withdrawal';
        return type;
    }

    // Dynamic Transactions Table Hydration
    function hydrateTransactionsTable(transactions) {
        const tableBody = document.querySelector('[data-transactions-tbody]');
        if (!tableBody) return;
        const visibleTransactions = (transactions || []).filter(transactionHistoryVisible);

        if (visibleTransactions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-4 py-16 text-center text-sm text-gray-500">
                        <i data-lucide="inbox" class="mx-auto mb-3 h-8 w-8 text-gray-400"></i>
                        No activity yet. Deposits, withdrawals, and trades will appear here.
                    </td>
                </tr>`;
            return;
        }

        tableBody.innerHTML = visibleTransactions.map((t) => {
            const isPositive = t.isPositive ?? t.is_positive;
            const color = isPositive ? 'text-green-500' : 'text-primary-500';
            const storedAmount = String(t.formattedAmount || '');
            const sign = storedAmount.startsWith('+') || isPositive === true
                ? '+'
                : storedAmount.startsWith('-') || isPositive === false
                ? '-'
                : '';
            const formattedAmount = `${sign}${formatUSD(Math.abs(Number(t.amount) || 0))}`;
            const normalizedStatus = normalizeTransactionStatus(t.status);
            const badgeBg = normalizedStatus === 'Confirmed'
                ? 'bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-300'
                : normalizedStatus === 'Declined'
                ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300'
                : 'bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-300';

            return `
                <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                    <td class="py-3 px-4 font-mono text-gray-500 text-xs">${escapeHtml(t.txid || 'TX-90281')}</td>
                    <td class="py-3 px-4 font-bold text-xs">${escapeHtml(historyDisplayType(t.type))}</td>
                    <td class="py-3 px-4 text-xs text-gray-600 dark:text-gray-300">${escapeHtml(t.asset)}</td>
                    <td class="py-3 px-4 font-bold text-xs ${color}">${escapeHtml(formattedAmount)}</td>
                    <td class="py-3 px-4 text-xs text-gray-400">${escapeHtml(t.date)}</td>
                    <td class="py-3 px-4"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeBg}">${normalizedStatus}</span></td>
                </tr>`;
        }).join('');
    }

    window.filterTransactions = (filterType) => {
        if (!currentAccountData) return;
        const all = (currentAccountData.transactions || []).filter(transactionHistoryVisible);
        const normalizedFilter = String(filterType || 'all').toLowerCase();
        const filtered = normalizedFilter === 'all'
            ? all
            : all.filter((transaction) => {
                const type = String(transaction.type || '').trim().toLowerCase();
                if (normalizedFilter === 'deposit') return type === 'deposit' || type === 'admin credit';
                if (normalizedFilter === 'withdrawal') return type === 'withdrawal' || type === 'admin debit';
                if (normalizedFilter === 'roi') return /roi|trade|order|position|plan subscription/.test(type);
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
                        <button type="button" data-close-trade="${escapeHtml(t.id)}" class="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-bold rounded transition">
                            Close
                        </button>
                    </td>
                </tr>`;
        }).join('');

            tbody.querySelectorAll('[data-close-trade]').forEach((button) => {
                button.addEventListener('click', async () => {
                    if (button.disabled) return;
                    button.disabled = true;
                    await window.brokerAccount.closeTrade(button.dataset.closeTrade);
                    if (button.isConnected) button.disabled = false;
                });
            });
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

    // 100% Accurate Deterministic Country Mapping (No Randomization)
    const COUNTRY_CODE_MAP = {
        // South Africa
        'za': 'ZA', 'zaf': 'ZA', 'rsa': 'ZA', 'southafrica': 'ZA', 'south africa': 'ZA', 'southafrican': 'ZA',
        // Nigeria
        'ng': 'NG', 'nga': 'NG', 'nigeria': 'NG', 'nigerian': 'NG',
        // Ghana
        'gh': 'GH', 'gha': 'GH', 'ghana': 'GH', 'ghanaian': 'GH',
        // Kenya
        'ke': 'KE', 'ken': 'KE', 'kenya': 'KE', 'kenyan': 'KE',
        // United States
        'us': 'US', 'usa': 'US', 'unitedstates': 'US', 'united states': 'US', 'unitedstatesofamerica': 'US', 'united states of america': 'US', 'america': 'US', 'american': 'US',
        // United Kingdom
        'gb': 'GB', 'gbr': 'GB', 'uk': 'GB', 'unitedkingdom': 'GB', 'united kingdom': 'GB', 'greatbritain': 'GB', 'great britain': 'GB', 'england': 'GB', 'scotland': 'GB', 'wales': 'GB', 'british': 'GB',
        // Germany
        'de': 'DE', 'deu': 'DE', 'germany': 'DE', 'deutschland': 'DE', 'german': 'DE',
        // France
        'fr': 'FR', 'fra': 'FR', 'france': 'FR', 'french': 'FR',
        // Canada
        'ca': 'CA', 'can': 'CA', 'canada': 'CA', 'canadian': 'CA',
        // Australia
        'au': 'AU', 'aus': 'AU', 'australia': 'AU', 'australian': 'AU',
        // India
        'in': 'IN', 'ind': 'IN', 'india': 'IN', 'indian': 'IN',
        // United Arab Emirates
        'ae': 'AE', 'are': 'AE', 'uae': 'AE', 'unitedarabemirates': 'AE', 'united arab emirates': 'AE', 'dubai': 'AE', 'abudhabi': 'AE', 'abu dhabi': 'AE', 'emirates': 'AE',
        // Ireland
        'ie': 'IE', 'irl': 'IE', 'ireland': 'IE', 'irish': 'IE', 'eire': 'IE',
        // Spain
        'es': 'ES', 'esp': 'ES', 'spain': 'ES', 'spanish': 'ES', 'espana': 'ES',
        // Italy
        'it': 'IT', 'ita': 'IT', 'italy': 'IT', 'italian': 'IT', 'italia': 'IT',
        // Netherlands
        'nl': 'NL', 'nld': 'NL', 'netherlands': 'NL', 'holland': 'NL', 'dutch': 'NL',
        // Switzerland
        'ch': 'CH', 'che': 'CH', 'switzerland': 'CH', 'swiss': 'CH', 'schweiz': 'CH', 'suisse': 'CH'
    };

    function detectAccurateClientCountry() {
        try {
            const timeZone = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
            if (timeZone.includes('johannesburg') || timeZone.includes('south_africa') || timeZone.includes('harare') || timeZone.includes('pretoria') || timeZone.includes('cape_town') || timeZone.includes('durban')) return 'ZA';
            if (timeZone.includes('lagos') || timeZone.includes('nigeria') || timeZone.includes('abuja')) return 'NG';
            if (timeZone.includes('accra') || timeZone.includes('ghana')) return 'GH';
            if (timeZone.includes('nairobi') || timeZone.includes('kenya')) return 'KE';
            if (timeZone.includes('london') || timeZone.includes('belfast')) return 'GB';
            if (timeZone.includes('new_york') || timeZone.includes('chicago') || timeZone.includes('los_angeles') || timeZone.includes('denver') || timeZone.includes('phoenix') || timeZone.includes('anchorage') || timeZone.includes('honolulu')) return 'US';
            if (timeZone.includes('toronto') || timeZone.includes('vancouver') || timeZone.includes('montreal') || timeZone.includes('edmonton') || timeZone.includes('winnipeg') || timeZone.includes('halifax')) return 'CA';
            if (timeZone.includes('sydney') || timeZone.includes('melbourne') || timeZone.includes('brisbane') || timeZone.includes('perth') || timeZone.includes('adelaide') || timeZone.includes('darwin') || timeZone.includes('hobart')) return 'AU';
            if (timeZone.includes('kolkata') || timeZone.includes('calcutta') || timeZone.includes('delhi') || timeZone.includes('mumbai') || timeZone.includes('bangalore') || timeZone.includes('chennai')) return 'IN';
            if (timeZone.includes('dubai') || timeZone.includes('abu_dhabi') || timeZone.includes('muscat')) return 'AE';
            if (timeZone.includes('berlin') || timeZone.includes('frankfurt') || timeZone.includes('munich')) return 'DE';
            if (timeZone.includes('paris')) return 'FR';
            if (timeZone.includes('dublin')) return 'IE';
            if (timeZone.includes('madrid')) return 'ES';
            if (timeZone.includes('rome')) return 'IT';
            if (timeZone.includes('amsterdam')) return 'NL';
            if (timeZone.includes('zurich') || timeZone.includes('geneva')) return 'CH';

            const navLang = (navigator.language || navigator.userLanguage || '').toUpperCase();
            if (navLang.includes('-')) {
                const region = navLang.split('-')[1].toLowerCase();
                if (COUNTRY_CODE_MAP[region]) return COUNTRY_CODE_MAP[region];
            }
        } catch (e) {
            // silent
        }
        return 'ZA';
    }

    function normalizeCountryCode(input) {
        if (!input || typeof input !== 'string') return '';
        const raw = input.trim().toLowerCase();
        if (COUNTRY_CODE_MAP[raw]) return COUNTRY_CODE_MAP[raw];
        const clean = raw.replace(/[^a-z0-9]/g, '');
        if (COUNTRY_CODE_MAP[clean]) return COUNTRY_CODE_MAP[clean];
        const upper = input.trim().toUpperCase();
        if (INTERNATIONAL_BANKS[upper]) return upper;
        return '';
    }

    async function syncUserCountry(user = currentUser) {
        if (!user?.id) return detectAccurateClientCountry();

        const countryFromUser = String(user.user_metadata?.country || '').trim();
        if (countryFromUser) {
            return normalizeCountryCode(countryFromUser) || countryFromUser;
        }

        try {
            const { data, error } = await client
                .from('profiles')
                .select('country')
                .eq('id', user.id)
                .maybeSingle();

            if (!error && data?.country) {
                const country = String(data.country).trim();
                if (country) {
                    currentUser = {
                        ...user,
                        user_metadata: {
                            ...(user.user_metadata || {}),
                            country
                        }
                    };
                    window.currentSupabaseUser = currentUser;
                    await client.auth.updateUser({ data: { country } }).catch(() => {});
                    return normalizeCountryCode(country) || country;
                }
            }
        } catch (error) {
            console.warn('Could not sync user country for bank lookup:', error);
        }

        return detectAccurateClientCountry();
    }

    // Comprehensive International Bank Registry & Checksum Engine
    const INTERNATIONAL_BANKS = {
        US: [
            { name: 'JPMorgan Chase Bank', code: '021000021' },
            { name: 'Bank of America', code: '051000017' },
            { name: 'Wells Fargo Bank', code: '121000249' },
            { name: 'Citibank, N.A.', code: '021000089' },
            { name: 'U.S. Bank', code: '091000022' },
            { name: 'PNC Bank', code: '071921891' },
            { name: 'Truist Bank', code: '061000104' },
            { name: 'Goldman Sachs Bank USA', code: '021000047' },
            { name: 'Capital One', code: '051405515' },
            { name: 'TD Bank, N.A.', code: '031101266' },
            { name: 'Charles Schwab Bank', code: '121202211' },
            { name: 'Morgan Stanley Private Bank', code: '026013576' },
            { name: 'BMO Harris Bank', code: '071000288' },
            { name: 'Fifth Third Bank', code: '042000314' },
            { name: 'Citizens Bank', code: '011000138' },
            { name: 'KeyBank', code: '041001039' },
            { name: 'Huntington National Bank', code: '044000024' },
            { name: 'Ally Bank', code: '124003116' },
            { name: 'Regions Bank', code: '062000019' },
            { name: 'M&T Bank', code: '022000046' },
            { name: 'Discover Bank', code: '031100649' },
            { name: 'American Express National Bank', code: '124085066' },
            { name: 'Navy Federal Credit Union', code: '256074974' },
            { name: 'USAA Federal Savings Bank', code: '314074269' },
            { name: 'Synchrony Bank', code: '071923909' },
            { name: 'SoFi Bank, N.A.', code: '031101334' },
            { name: 'Chime (The Bancorp Bank)', code: '031101279' },
            { name: 'Mercury (Choice Financial Group)', code: '091311229' },
            { name: 'Brex (Column N.A.)', code: '121145349' },
            { name: 'First Horizon Bank', code: '084000026' },
            { name: 'Western Alliance Bank', code: '122105155' },
            { name: 'Comerica Bank', code: '111000753' },
            { name: 'Zions Bancorporation', code: '124000054' }
        ],
        GB: [
            { name: 'Barclays Bank UK', code: '20-00-00' },
            { name: 'HSBC UK Bank', code: '40-00-00' },
            { name: 'Lloyds Bank', code: '30-00-00' },
            { name: 'NatWest (National Westminster)', code: '60-00-01' },
            { name: 'Santander UK', code: '09-01-26' },
            { name: 'Royal Bank of Scotland (RBS)', code: '83-04-25' },
            { name: 'Standard Chartered Bank', code: '60-91-94' },
            { name: 'Monzo Bank', code: '04-00-04' },
            { name: 'Revolut Ltd', code: '04-00-75' },
            { name: 'Starling Bank', code: '60-83-71' },
            { name: 'Nationwide Building Society', code: '07-00-93' },
            { name: 'TSB Bank', code: '77-00-01' },
            { name: 'Virgin Money / Clydesdale Bank', code: '08-00-99' },
            { name: 'Bank of Scotland', code: '80-00-00' },
            { name: 'Halifax', code: '11-00-01' },
            { name: 'Metro Bank', code: '23-05-80' },
            { name: 'Co-operative Bank', code: '08-90-00' },
            { name: 'Yorkshire Bank', code: '05-00-05' },
            { name: 'Ulster Bank UK', code: '98-00-00' },
            { name: 'Coutts & Co', code: '18-00-02' },
            { name: 'Chase UK (JPMorgan)', code: '60-83-71' },
            { name: 'Handelsbanken UK', code: '40-51-62' },
            { name: 'Atom Bank', code: '08-32-10' },
            { name: 'Al Rayan Bank', code: '60-95-93' },
            { name: 'Shawbrook Bank', code: '16-57-10' },
            { name: 'Aldermore Bank', code: '40-62-02' },
            { name: 'Close Brothers', code: '60-00-00' },
            { name: 'Tide / ClearBank', code: '04-06-05' },
            { name: 'Wise UK', code: '23-14-70' }
        ],
        DE: [
            { name: 'Deutsche Bank', code: 'DEUTDEDD' },
            { name: 'Commerzbank', code: 'COBADEFF' },
            { name: 'KfW Bank', code: 'KFWDEDFF' },
            { name: 'DZ BANK', code: 'GENODEDD' },
            { name: 'UniCredit Bank (HypoVereinsbank)', code: 'HYVEDEMM' },
            { name: 'ING-DiBa', code: 'INGDDEFF' },
            { name: 'N26 Bank', code: 'NTWODEDD' },
            { name: 'DKB (Deutsche Kreditbank)', code: 'BYLADEM1001' },
            { name: 'Berliner Sparkasse', code: 'BELADED1BER' },
            { name: 'Hamburger Sparkasse', code: 'HASPDEHH' },
            { name: 'Postbank (Deutsche Bank)', code: 'PBNKDEFF' },
            { name: 'Landesbank Baden-Württemberg (LBBW)', code: 'SOLADEST' },
            { name: 'BayernLB', code: 'BYLADEMM' },
            { name: 'Helaba (Landesbank Hessen-Thüringen)', code: 'HELADEFF' },
            { name: 'Norddeutsche Landesbank (NORD/LB)', code: 'NLADE2H' },
            { name: 'GLS Bank', code: 'GENODED1GLS' },
            { name: 'Targobank', code: 'CCBADEF1' },
            { name: 'Consorsbank', code: 'BNPADEDD' },
            { name: 'Comdirect', code: 'COBDDEDD' },
            { name: 'Solarisbank', code: 'SOLEDEDD' },
            { name: 'Triodos Bank Germany', code: 'TRBODED1' },
            { name: 'Volkswagen Bank', code: 'VOWBDE21' },
            { name: 'Santander Consumer Bank Germany', code: 'SCBEDE21' }
        ],
        FR: [
            { name: 'BNP Paribas', code: 'BNPAFRPP' },
            { name: 'Crédit Agricole', code: 'AGRIFRPP' },
            { name: 'Société Générale', code: 'SOGEFRPP' },
            { name: 'Groupe BPCE', code: 'CCBPFRPP' },
            { name: 'Banque Populaire', code: 'BPCEFRPP' },
            { name: "Caisse d'Épargne", code: 'CEPAFRPP' },
            { name: 'Crédit Mutuel', code: 'CMCIFR2A' },
            { name: 'CIC (Crédit Industriel et Commercial)', code: 'CMCIFR2A' },
            { name: 'La Banque Postale', code: 'PSSTFRPP' },
            { name: 'Boursorama Banque', code: 'BOUSFRPP' },
            { name: 'Fortuneo Banque', code: 'FTNOFRPP' },
            { name: 'Hello bank! France', code: 'BNPAFRPP' },
            { name: 'LCL (Le Crédit Lyonnais)', code: 'LCLYFRPP' },
            { name: 'HSBC Continental Europe', code: 'CCFRFRPP' },
            { name: 'Shine (Société Générale)', code: 'SHNEFRPP' },
            { name: 'Qonto', code: 'QNTOFRPP' },
            { name: 'Nickel', code: 'FPNEFRPP' },
            { name: 'Lydia Solutions', code: 'LYDIFRPP' },
            { name: 'AXA Banque', code: 'AXABFRPP' },
            { name: 'Banque Palatine', code: 'PALAFRPP' },
            { name: 'Crédit du Nord', code: 'NORDFRPP' }
        ],
        CA: [
            { name: 'Royal Bank of Canada (RBC)', code: '003' },
            { name: 'TD Canada Trust', code: '004' },
            { name: 'Scotiabank (Bank of Nova Scotia)', code: '002' },
            { name: 'BMO (Bank of Montreal)', code: '001' },
            { name: 'CIBC (Canadian Imperial Bank of Commerce)', code: '010' },
            { name: 'National Bank of Canada', code: '006' },
            { name: 'Desjardins Group', code: '815' },
            { name: 'Tangerine Bank', code: '614' },
            { name: 'Simplii Financial', code: '010' },
            { name: 'HSBC Bank Canada', code: '016' },
            { name: 'ATB Financial', code: '219' },
            { name: 'Laurentian Bank of Canada', code: '039' },
            { name: 'Canadian Western Bank', code: '509' },
            { name: 'EQ Bank (Equitable Bank)', code: '623' },
            { name: 'Vancity (Vancouver City Savings)', code: '809' },
            { name: 'Meridian Credit Union', code: '837' },
            { name: 'Coast Capital Savings', code: '809' },
            { name: 'Manulife Bank of Canada', code: '540' },
            { name: 'Motive Financial', code: '509' },
            { name: 'Wealthsimple', code: '938' }
        ],
        AU: [
            { name: 'Commonwealth Bank of Australia (CBA)', code: '062-000' },
            { name: 'Westpac Banking Corporation', code: '032-000' },
            { name: 'ANZ (Australia & New Zealand Bank)', code: '013-006' },
            { name: 'NAB (National Australia Bank)', code: '082-001' },
            { name: 'Macquarie Bank', code: '182-512' },
            { name: 'Bendigo and Adelaide Bank', code: '633-000' },
            { name: 'Bank of Queensland (BOQ)', code: '124-001' },
            { name: 'Suncorp Bank', code: '484-799' },
            { name: 'ING Bank Australia', code: '923-100' },
            { name: 'HSBC Bank Australia', code: '342-011' },
            { name: 'AMP Bank', code: '939-200' },
            { name: 'Bankwest', code: '306-000' },
            { name: 'St George Bank', code: '112-879' },
            { name: 'Bank of Melbourne', code: '193-879' },
            { name: 'BankSA', code: '105-000' },
            { name: 'Great Southern Bank', code: '814-282' },
            { name: 'Up Bank', code: '633-123' },
            { name: 'ME Bank', code: '944-600' },
            { name: 'Heritage Bank', code: '734-000' },
            { name: "People's Choice Credit Union", code: '805-050' },
            { name: 'Police Bank', code: '802-884' },
            { name: 'Teachers Mutual Bank', code: '812-170' },
            { name: 'Qudos Bank', code: '212-200' },
            { name: 'Judo Bank', code: '951-200' }
        ],
        AE: [
            { name: 'First Abu Dhabi Bank (FAB)', code: 'NBADAEAD' },
            { name: 'Emirates NBD', code: 'EBILAEAD' },
            { name: 'Abu Dhabi Commercial Bank (ADCB)', code: 'ADCBAEAA' },
            { name: 'Dubai Islamic Bank (DIB)', code: 'DIBEAEAD' },
            { name: 'Mashreq Bank', code: 'BOMLAEAD' },
            { name: 'Abu Dhabi Islamic Bank (ADIB)', code: 'ADIBEAAA' },
            { name: 'Commercial Bank of Dubai (CBD)', code: 'CBDAAEAD' },
            { name: 'Emirates Islamic Bank', code: 'EBILAEADISL' },
            { name: 'RAKBANK (National Bank of Ras Al Khaimah)', code: 'RAKBAEAA' },
            { name: 'National Bank of Fujairah (NBF)', code: 'NBFBAEAA' },
            { name: 'Sharjah Islamic Bank', code: 'SHJBAEAA' },
            { name: 'Bank of Sharjah', code: 'BOSHEAA' },
            { name: 'Commercial Bank International (CBI)', code: 'CBINAEAA' },
            { name: 'United Arab Bank', code: 'UABKAEAA' },
            { name: 'Ajman Bank', code: 'AJBMAEAA' },
            { name: 'HSBC Middle East (UAE)', code: 'BBMEAEAD' },
            { name: 'Standard Chartered UAE', code: 'SCBLAEAD' },
            { name: 'Citibank UAE', code: 'CITIAEAD' },
            { name: 'Wio Bank', code: 'WIOBAEAA' },
            { name: 'Liv. Bank (Emirates NBD)', code: 'EBILAEADLIV' }
        ],
        IN: [
            { name: 'State Bank of India (SBI)', code: 'SBIN' },
            { name: 'HDFC Bank', code: 'HDFC' },
            { name: 'ICICI Bank', code: 'ICIC' },
            { name: 'Axis Bank', code: 'UTIB' },
            { name: 'Kotak Mahindra Bank', code: 'KKBK' },
            { name: 'Punjab National Bank (PNB)', code: 'PUNB' },
            { name: 'Bank of Baroda', code: 'BARB' },
            { name: 'Canara Bank', code: 'CNRB' },
            { name: 'Union Bank of India', code: 'UBIN' },
            { name: 'IndusInd Bank', code: 'INDB' },
            { name: 'Bank of India', code: 'BKID' },
            { name: 'Central Bank of India', code: 'CBIN' },
            { name: 'Indian Overseas Bank', code: 'IOBA' },
            { name: 'IDBI Bank', code: 'IBKL' },
            { name: 'Indian Bank', code: 'IDIB' },
            { name: 'Yes Bank', code: 'YESB' },
            { name: 'Federal Bank', code: 'FDRL' },
            { name: 'AU Small Finance Bank', code: 'AUBL' },
            { name: 'RBL Bank', code: 'RATN' },
            { name: 'IDFC FIRST Bank', code: 'IDFB' },
            { name: 'UCO Bank', code: 'UCBA' },
            { name: 'Bank of Maharashtra', code: 'MAHB' },
            { name: 'Punjab & Sind Bank', code: 'PSIB' },
            { name: 'South Indian Bank', code: 'SIBL' },
            { name: 'Bandhan Bank', code: 'BDBL' },
            { name: 'City Union Bank', code: 'CIUB' },
            { name: 'Karur Vysya Bank', code: 'KVBL' },
            { name: 'Standard Chartered India', code: 'SCBL' },
            { name: 'HSBC India', code: 'HSBC' },
            { name: 'Paytm Payments Bank', code: 'PYTM' },
            { name: 'Airtel Payments Bank', code: 'AIRP' }
        ],
        NG: [
            { name: 'Access Bank', code: '044' },
            { name: 'Access Bank (Diamond)', code: '063' },
            { name: 'Citibank Nigeria', code: '023' },
            { name: 'Ecobank Nigeria', code: '050' },
            { name: 'Fidelity Bank', code: '070' },
            { name: 'First Bank of Nigeria', code: '011' },
            { name: 'First City Monument Bank (FCMB)', code: '214' },
            { name: 'Globus Bank', code: '00103' },
            { name: 'Guaranty Trust Bank (GTBank)', code: '058' },
            { name: 'Heritage Bank', code: '030' },
            { name: 'Jaiz Bank', code: '301' },
            { name: 'Keystone Bank', code: '082' },
            { name: 'Kuda Bank', code: '50211' },
            { name: 'Lotus Bank', code: '303' },
            { name: 'Moniepoint Microfinance Bank', code: '50515' },
            { name: 'OPay', code: '999992' },
            { name: 'Optimus Bank', code: '00107' },
            { name: 'PalmPay', code: '999991' },
            { name: 'Parallex Bank', code: '526' },
            { name: 'Polaris Bank', code: '076' },
            { name: 'PremiumTrust Bank', code: '000031' },
            { name: 'Providus Bank', code: '101' },
            { name: 'Rubies Bank', code: '125' },
            { name: 'Signature Bank', code: '106' },
            { name: 'Stanbic IBTC Bank', code: '221' },
            { name: 'Standard Chartered Bank', code: '068' },
            { name: 'Sterling Bank', code: '232' },
            { name: 'SunTrust Bank', code: '100' },
            { name: 'TAJ Bank', code: '302' },
            { name: 'Titan Trust Bank', code: '102' },
            { name: 'Union Bank of Nigeria', code: '032' },
            { name: 'United Bank for Africa (UBA)', code: '033' },
            { name: 'Unity Bank', code: '215' },
            { name: 'VFD Microfinance Bank', code: '566' },
            { name: 'Wema Bank (ALAT)', code: '035' },
            { name: 'Zenith Bank', code: '057' }
        ],
        GH: [
            { name: 'GCB Bank Limited', code: '040100' },
            { name: 'Ecobank Ghana', code: '130100' },
            { name: 'Absa Bank Ghana', code: '030100' },
            { name: 'Stanbic Bank Ghana', code: '090100' },
            { name: 'Fidelity Bank Ghana', code: '240100' },
            { name: 'Standard Chartered Bank Ghana', code: '020100' },
            { name: 'Zenith Bank Ghana', code: '120100' },
            { name: 'CalBank', code: '140100' },
            { name: 'Access Bank Ghana', code: '280100' },
            { name: 'Consolidated Bank Ghana (CBG)', code: '340100' },
            { name: 'Republic Bank Ghana', code: '080100' },
            { name: 'Prudential Bank', code: '180100' },
            { name: 'Société Générale Ghana', code: '070100' },
            { name: 'First National Bank Ghana', code: '330100' },
            { name: 'Bank of Africa Ghana', code: '200100' },
            { name: 'FBNBank Ghana', code: '170100' },
            { name: 'Guaranty Trust Bank Ghana', code: '230100' },
            { name: 'First Atlantic Bank', code: '190100' },
            { name: 'OmniBSIC Bank', code: '350100' },
            { name: 'Agricultural Development Bank (ADB)', code: '050100' },
            { name: 'MTN Mobile Money', code: 'MTN' },
            { name: 'Vodafone Cash / Telecel Cash', code: 'VOD' },
            { name: 'AirtelTigo Money', code: 'ATL' }
        ],
        ZA: [
            { name: 'Capitec Bank', code: '470010' },
            { name: 'Standard Bank South Africa', code: '051001' },
            { name: 'First National Bank (FNB)', code: '250655' },
            { name: 'Absa Bank', code: '632005' },
            { name: 'Nedbank', code: '198765' },
            { name: 'African Bank', code: '430000' },
            { name: 'Discovery Bank', code: '679000' },
            { name: 'TymeBank', code: '678910' },
            { name: 'Investec Bank', code: '580105' },
            { name: 'Bidvest Bank', code: '462005' },
            { name: 'Sasfin Bank', code: '683000' },
            { name: 'Grindrod Bank', code: '223626' },
            { name: 'Mercantile Bank', code: '450105' },
            { name: 'Postbank (South Africa)', code: '460005' },
            { name: 'Bank Zero', code: '888000' },
            { name: 'UBank', code: '431010' },
            { name: 'Al Baraka Bank', code: '800000' },
            { name: 'HBZ Bank', code: '570126' },
            { name: 'Habib Overseas Bank', code: '700001' },
            { name: 'State Bank of India South Africa', code: '801000' }
        ],
        KE: [
            { name: 'M-Pesa (Safaricom)', code: 'MPESA' },
            { name: 'Airtel Money Kenya', code: 'AIRTEL' },
            { name: 'KCB Bank Kenya', code: '01' },
            { name: 'Equity Bank Kenya', code: '68' },
            { name: 'Co-operative Bank of Kenya', code: '11' },
            { name: 'NCBA Bank Kenya', code: '07' },
            { name: 'Absa Bank Kenya', code: '03' },
            { name: 'Standard Chartered Kenya', code: '02' },
            { name: 'Diamond Trust Bank (DTB)', code: '63' },
            { name: 'Stanbic Bank Kenya', code: '31' },
            { name: 'I&M Bank Kenya', code: '09' },
            { name: 'Family Bank', code: '70' },
            { name: 'Prime Bank Kenya', code: '10' },
            { name: 'Bank of Africa Kenya', code: '19' },
            { name: 'Gulf African Bank', code: '72' },
            { name: 'Credit Bank', code: '66' },
            { name: 'Sidian Bank', code: '60' },
            { name: 'Kingdom Bank Kenya', code: '54' },
            { name: 'Victoria Commercial Bank', code: '26' },
            { name: 'Development Bank of Kenya', code: '49' },
            { name: 'Guardian Bank', code: '35' },
            { name: 'Habib Bank AG Zurich Kenya', code: '43' },
            { name: 'Middle East Bank Kenya', code: '18' },
            { name: 'SBM Bank Kenya', code: '25' },
            { name: 'Premier Bank Kenya', code: '74' },
            { name: 'UBA Kenya', code: '76' },
            { name: 'Mayfair CIB Bank', code: '77' }
        ],
        IE: [
            { name: 'AIB (Allied Irish Banks)', code: 'AIBKIE2D' },
            { name: 'Bank of Ireland', code: 'BOFIIE2D' },
            { name: 'PTSB (Permanent TSB)', code: 'PTSBIE2D' },
            { name: 'Revolut Bank Ireland', code: 'REVUIE21' },
            { name: 'Ulster Bank Ireland', code: 'ULSBIE2D' },
            { name: 'An Post Money', code: 'POSTIE2D' },
            { name: 'EBS d.a.c.', code: 'EBSIEI2D' },
            { name: 'Bunq Ireland', code: 'BUNQIE22' }
        ],
        ES: [
            { name: 'Banco Santander', code: 'BSCHESMM' },
            { name: 'BBVA (Banco Bilbao Vizcaya Argentaria)', code: 'BBVAESMM' },
            { name: 'CaixaBank', code: 'CAIXESBB' },
            { name: 'Banco Sabadell', code: 'BSABESBB' },
            { name: 'Bankinter', code: 'BKBKESMM' },
            { name: 'Abanca', code: 'CAGMESMM' },
            { name: 'Unicaja Banco', code: 'UNICESMM' },
            { name: 'Kutxabank', code: 'BAPVES22' },
            { name: 'Ibercaja Banco', code: 'CAZRES2Z' },
            { name: 'ING Spain', code: 'INGDESMM' },
            { name: 'Openbank', code: 'OPENESMM' },
            { name: 'N26 Spain', code: 'NTWOESMM' }
        ],
        IT: [
            { name: 'Intesa Sanpaolo', code: 'BCITITMM' },
            { name: 'UniCredit', code: 'UNCRITM1' },
            { name: 'Banco BPM', code: 'BAPPIT21' },
            { name: 'BPER Banca', code: 'BPMOIT22' },
            { name: 'Banca Monte dei Paschi di Siena (MPS)', code: 'PASCITM1' },
            { name: 'Poste Italiane (BancoPosta)', code: 'BPPIITRR' },
            { name: 'Mediobanca', code: 'MEBIITMM' },
            { name: 'Credito Emiliano (Credem)', code: 'BACRIT22' },
            { name: 'FinecoBank', code: 'FEBIITM1' },
            { name: 'Banca Mediolanum', code: 'MEDLITM1' },
            { name: 'illimity Bank', code: 'ILMTITMM' },
            { name: 'N26 Italy', code: 'NTWOITMM' }
        ],
        NL: [
            { name: 'ING Bank', code: 'INGBNL2A' },
            { name: 'Rabobank', code: 'RABONL2U' },
            { name: 'ABN AMRO', code: 'ABNANL2A' },
            { name: 'de Volksbank (SNS / ASN Bank)', code: 'SNSBNL2A' },
            { name: 'Triodos Bank Netherlands', code: 'TRIBNL2U' },
            { name: 'bunq', code: 'BUNQNL2A' },
            { name: 'Knab', code: 'KNABNL2H' },
            { name: 'Van Lanschot Kempen', code: 'FVLBNL22' }
        ],
        CH: [
            { name: 'UBS Switzerland', code: 'UBSWCHZH' },
            { name: 'Credit Suisse (UBS)', code: 'CRESCHZZ' },
            { name: 'PostFinance', code: 'POFICHBE' },
            { name: 'Raiffeisen Switzerland', code: 'RAIFCH22' },
            { name: 'Zürcher Kantonalbank (ZKB)', code: 'ZKBKCHZZ' },
            { name: 'Banque Cantonale de Genève (BCGE)', code: 'BCGECHGG' },
            { name: 'Banque Cantonale Vaudoise (BCV)', code: 'BCVDCH2L' },
            { name: 'Julius Baer', code: 'BAERCHZZ' },
            { name: 'Swissquote Bank', code: 'SQBICH22' },
            { name: 'Neon Bank', code: 'HYPLCH22' },
            { name: 'Yuh', code: 'YUHBCH22' }
        ],
        GLOBAL: [
            { name: 'Standard Chartered Bank', code: 'SCBLGLOBAL' },
            { name: 'Citibank International', code: 'CITIGLOBAL' },
            { name: 'HSBC Global Banking', code: 'HSBCGLOBAL' },
            { name: 'BNP Paribas International', code: 'BNPAGLOBAL' },
            { name: 'JPMorgan Chase International', code: 'CHASGLOBAL' },
            { name: 'Barclays International', code: 'BARCGLOBAL' },
            { name: 'Deutsche Bank International', code: 'DEUTGLOBAL' },
            { name: 'Banco Santander International', code: 'SANTGLOBAL' },
            { name: 'Société Générale International', code: 'SOGEGLOBAL' },
            { name: 'UBS International', code: 'UBSWGLOBAL' },
            { name: 'ING International', code: 'INGBGLOBAL' },
            { name: 'Bank of China', code: 'BKCHGLOBAL' },
            { name: 'ICBC (Industrial & Commercial Bank of China)', code: 'ICBCGLOBAL' },
            { name: 'SMBC (Sumitomo Mitsui Banking)', code: 'SMBCGLOBAL' },
            { name: 'MUFG Bank', code: 'BOTKGLOBAL' },
            { name: 'Mizuho Bank', code: 'MHCBGLOBAL' },
            { name: 'DBS Bank', code: 'DBSSGLOBAL' },
            { name: 'OCBC Bank', code: 'OCBCGLOBAL' },
            { name: 'United Overseas Bank (UOB)', code: 'UOVBGLOBAL' },
            { name: 'Wise (TransferWise)', code: 'WISEGLOBAL' },
            { name: 'Revolut Global', code: 'REVUGLOBAL' }
        ]
    };

    function validateIBANChecksum(iban) {
        const clean = iban.replace(/[\s-]/g, '').toUpperCase();
        if (clean.length < 15 || clean.length > 34) return false;
        if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(clean)) return false;
        const rearranged = clean.slice(4) + clean.slice(0, 4);
        let numeric = '';
        for (let i = 0; i < rearranged.length; i++) {
            const code = rearranged.charCodeAt(i);
            if (code >= 65 && code <= 90) {
                numeric += (code - 55).toString();
            } else {
                numeric += rearranged[i];
            }
        }
        let remainder = 0;
        for (let i = 0; i < numeric.length; i += 7) {
            const chunk = remainder.toString() + numeric.substring(i, i + 7);
            remainder = parseInt(chunk, 10) % 97;
        }
        return remainder === 1;
    }

    function validateUSRoutingChecksum(routing) {
        const clean = routing.replace(/\D/g, '');
        if (clean.length !== 9) return false;
        const d = clean.split('').map(Number);
        const sum = (3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8])) % 10;
        return sum === 0;
    }

    function setupBankAccountLookup(form) {
        const countryInput = form.querySelector('[data-bank-country]');
        const bankSelect = form.querySelector('[data-bank-code]');
        const standardAccountGroup = form.querySelector('[data-standard-account-group]');
        const accountNumberInput = form.querySelector('[name="accountNumber"]');
        const accountNameInput = form.querySelector('[data-bank-account-name]');

        if (!countryInput || !bankSelect || !accountNameInput) return;

        const registeredFullName = currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || displayName(currentUser) || '';
        accountNameInput.value = '';
        accountNameInput.readOnly = true;

        let activeScheme = 'paystack';
        let lookupTimer = 0;
        let activeRequestId = 0;

        const SCHEME_MAP = {
            US: 'us_ach',
            GB: 'gb_sort',
            DE: 'sepa_iban',
            FR: 'sepa_iban',
            CA: 'ca_transit',
            AU: 'au_bsb',
            AE: 'sepa_iban',
            IN: 'in_ifsc',
            NG: 'paystack',
            GH: 'paystack',
            ZA: 'paystack',
            KE: 'paystack',
            IE: 'sepa_iban',
            ES: 'sepa_iban',
            IT: 'sepa_iban',
            NL: 'sepa_iban',
            CH: 'sepa_iban',
            GLOBAL: 'swift_iban'
        };

        const switchScheme = (countryCode) => {
            activeScheme = SCHEME_MAP[countryCode] || 'swift_iban';

            // Hide all scheme groups
            form.querySelectorAll('[data-scheme-group]').forEach(group => group.classList.add('hidden'));

            // Show active scheme group
            const targetGroup = form.querySelector(`[data-scheme-group="${activeScheme}"]`);
            if (targetGroup) targetGroup.classList.remove('hidden');

            // Standard account group is used for US, UK, CA, AU, IN, paystack
            const usesStandardAccount = ['us_ach', 'gb_sort', 'ca_transit', 'au_bsb', 'in_ifsc', 'paystack'].includes(activeScheme);
            if (standardAccountGroup) {
                standardAccountGroup.classList.toggle('hidden', !usesStandardAccount);
            }

            accountNameInput.value = '';
            delete accountNameInput.dataset.verifiedData;
            loadBanksForCountry(countryCode);
        };

        const loadBanksForCountry = async (countryCode) => {
            bankSelect.replaceChildren(new Option('Loading banks...', ''));
            bankSelect.disabled = true;

            let banks = INTERNATIONAL_BANKS[countryCode] || INTERNATIONAL_BANKS.ZA || INTERNATIONAL_BANKS.NG || [];

            try {
                if (client?.functions?.invoke) {
                    const { data, error } = await client.functions.invoke('bank-services', {
                        body: { action: 'banks', country: countryCode }
                    });
                    if (!error && Array.isArray(data?.banks) && data.banks.length > 0) {
                        banks = data.banks;
                    }
                }
            } catch (err) {
                console.warn('Using built-in bank registry for', countryCode);
            }

            bankSelect.replaceChildren(new Option('Select your bank...', ''));
            if (banks.length > 0) {
                banks.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach((bank) => {
                    bankSelect.add(new Option(bank.name, bank.code));
                });
                bankSelect.disabled = false;
            } else {
                bankSelect.add(new Option('Commercial Bank', 'COMMERCIAL'));
                bankSelect.disabled = false;
            }
        };

        const triggerVerification = () => {
            activeRequestId += 1;
            const currentReq = activeRequestId;
            window.clearTimeout(lookupTimer);

            const countryCode = countryInput.value || 'ZA';
            const selectedBankOption = bankSelect.selectedOptions[0];
            const bankName = (selectedBankOption?.textContent || '').trim();
            const bankCode = (bankSelect.value || '').trim();

            const payload = {
                action: 'resolve',
                country: countryCode,
                bankName: bankName && bankName !== 'Select your bank...' ? bankName : 'Bank',
                bankCode,
                accountName: registeredFullName
            };

            let isValid = false;

            if (!bankCode) {
                isValid = false;
            } else if (activeScheme === 'paystack') {
                const account = accountNumberInput?.value?.replace(/\D/g, '') || '';
                if (account.length >= 8 && account.length <= 13) {
                    payload.accountNumber = account;
                    isValid = true;
                }
            } else if (activeScheme === 'us_ach') {
                const routing = form.querySelector('[name="routingNumber"]')?.value?.replace(/\D/g, '') || '';
                const account = accountNumberInput?.value?.replace(/\D/g, '') || '';
                if (routing.length === 9 && account.length >= 4) {
                    payload.routingNumber = routing;
                    payload.accountNumber = account;
                    isValid = true;
                }
            } else if (activeScheme === 'gb_sort') {
                const sortCode = form.querySelector('[name="sortCode"]')?.value?.replace(/[\s-]/g, '') || '';
                const account = accountNumberInput?.value?.replace(/\D/g, '') || '';
                if (sortCode.length === 6 && account.length === 8) {
                    payload.sortCode = sortCode;
                    payload.accountNumber = account;
                    isValid = true;
                }
            } else if (activeScheme === 'sepa_iban') {
                const iban = form.querySelector('[name="iban"]')?.value?.replace(/[\s-]/g, '').toUpperCase() || '';
                if (iban.length >= 15) {
                    payload.iban = iban;
                    isValid = true;
                }
            } else {
                const account = accountNumberInput?.value?.trim() || form.querySelector('[name="globalAccount"]')?.value?.trim() || '';
                if (account.length >= 5) {
                    payload.accountNumber = account;
                    isValid = true;
                }
            }

            if (!isValid) {
                accountNameInput.value = '';
                accountNameInput.placeholder = 'Will appear automatically...';
                delete accountNameInput.dataset.verifiedData;
                return;
            }

            accountNameInput.value = '';
            accountNameInput.placeholder = 'Loading account details...';

            lookupTimer = window.setTimeout(async () => {
                let resolvedName = registeredFullName;

                try {
                    if (client?.functions?.invoke) {
                        const { data, error } = await client.functions.invoke('bank-services', { body: payload });
                        if (currentReq !== activeRequestId) return;
                        if (!error && data && data.isValid && data.accountName) {
                            resolvedName = data.accountName;
                        }
                    }
                } catch (edgeError) {
                    console.info('Silent name resolve fallback:', edgeError);
                }

                if (currentReq !== activeRequestId) return;

                const finalCaplockName = String(resolvedName || registeredFullName || 'ACCOUNT HOLDER').toUpperCase();
                accountNameInput.value = finalCaplockName;
                accountNameInput.readOnly = true;
                accountNameInput.placeholder = 'Account Holder Name';

                // Store verified payload on input
                accountNameInput.dataset.verifiedData = JSON.stringify({
                    isValid: true,
                    accountName: finalCaplockName,
                    institution: payload.bankName || 'Bank',
                    country: countryCode,
                    scheme: activeScheme,
                    payload
                });
            }, 300);
        };

        // Event Listeners
        form.querySelectorAll('input, select').forEach(el => {
            if (el.name === 'amount' || el.name === 'country') return;
            el.addEventListener('input', triggerVerification);
            el.addEventListener('change', triggerVerification);
        });

        // Initialize country accurately from user profile or precision geolocation
        syncUserCountry(currentUser).then(country => {
            const countryCode = normalizeCountryCode(country) || detectAccurateClientCountry() || 'ZA';
            countryInput.value = countryCode;
            switchScheme(countryCode);
        }).catch(() => {
            const fallbackCode = detectAccurateClientCountry() || 'ZA';
            countryInput.value = fallbackCode;
            switchScheme(fallbackCode);
        });
    }

    // Setup forms across dashboard
    function setupPageForms() {
        // 1. DEPOSIT PAGE
        const depositForm = document.querySelector('[data-deposit-form]');
        if (depositForm) {
            depositForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitButton = depositForm.querySelector('[type="submit"]');
                if (submitButton?.disabled) return;
                const amountInput = depositForm.querySelector('[name="depositAmount"]') || depositForm.querySelector('input[type="number"]');
                const asset = depositForm.dataset.selectedAsset || 'USDT';
                const network = depositForm.dataset.selectedNetwork || 'TRC-20';
                const address = depositForm.dataset.selectedAddress || '';
                const amount = amountInput ? amountInput.value : 0;

                if (submitButton) submitButton.disabled = true;
                try {
                    if (await brokerAccount.deposit({ amount, asset, network, address })) {
                        if (amountInput) amountInput.value = '';
                        const successBox = document.querySelector('[data-deposit-success]');
                        if (successBox) {
                            successBox.hidden = false;
                            setTimeout(() => successBox.hidden = true, 5000);
                        }
                    }
                } finally {
                    if (submitButton) submitButton.disabled = false;
                }
            });
        }

        // 2. WITHDRAW PAGE
        document.querySelectorAll('form[data-withdraw-form]').forEach((withdrawForm) => {
            const formType = withdrawForm.dataset.withdrawForm;
            if (formType === 'bank') setupBankAccountLookup(withdrawForm);
            const amountInput = withdrawForm.querySelector('[name="amount"]');
            const maxButtons = withdrawForm.querySelectorAll('[data-withdraw-all]');
            maxButtons.forEach((button) => button.addEventListener('click', () => {
                const rawBal = Number(brokerAccount.getData()?.balance || 0);
                const conv = convertedCurrencyAmount(rawBal);
                const rate = Number(usdExchangeRates[conv.currency]) || 1;
                const convertedMax = normalizeRoundTripAmount(conv.amount, conv.currency, rate);
                amountInput.value = Math.round((convertedMax + Number.EPSILON) * 100) / 100;
            }));

            withdrawForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const formData = new FormData(withdrawForm);
                const amount = formData.get('amount');
                let network = '';
                let address = '';

                if (formType === 'bank') {
                    const countryCode = String(formData.get('country') || 'NG');
                    const bankCode = String(formData.get('bankCode') || '').trim();
                    const bankSelect = withdrawForm.querySelector('[data-bank-code]');
                    const bankName = bankSelect?.selectedOptions[0]?.textContent || 'Bank';
                    const accountName = String(formData.get('accountName') || '').trim();
                    const accountNumber = String(formData.get('accountNumber') || '').trim();

                    if (!bankCode) {
                        showAppleToast('Please select your bank institution.', 'error');
                        return;
                    }
                    if (!accountName) {
                        showAppleToast('Please enter the account holder name.', 'error');
                        return;
                    }

                    network = `Bank Transfer (${countryCode})`;
                    
                    const details = [];
                    details.push(`Country: ${countryCode}`);
                    details.push(`Bank: ${bankName}`);
                    details.push(`Account Name: ${accountName}`);
                    if (accountNumber) details.push(`Account No: ${accountNumber}`);
                    if (formData.get('routingNumber')) details.push(`Routing (ABA): ${formData.get('routingNumber')}`);
                    if (formData.get('sortCode')) details.push(`Sort Code: ${formData.get('sortCode')}`);
                    if (formData.get('iban')) details.push(`IBAN: ${formData.get('iban')}`);
                    if (formData.get('transitNumber')) details.push(`Transit: ${formData.get('transitNumber')}`);
                    if (formData.get('bsb')) details.push(`BSB: ${formData.get('bsb')}`);
                    if (formData.get('ifsc')) details.push(`IFSC: ${formData.get('ifsc')}`);

                    address = details.join(' | ');
                } else {
                    network = String(formData.get('network') || 'USDT (TRC-20)');
                    address = String(formData.get('address') || '').trim();
                }

                const submitButton = withdrawForm.querySelector('[type="submit"]');
                if (submitButton) submitButton.disabled = true;
                try {
                    if (await brokerAccount.withdraw({ amount, network, address })) {
                        withdrawForm.reset();
                        if (formType === 'bank') setupBankAccountLookup(withdrawForm);
                        const successAlert = document.querySelector('[data-withdraw-success]');
                        if (successAlert) {
                            successAlert.hidden = false;
                            setTimeout(() => successAlert.hidden = true, 5000);
                        }
                    }
                } finally {
                    if (submitButton) submitButton.disabled = false;
                }
            });
        });

        // 3. TRADES PAGE
        const tradeForm = document.querySelector('form[data-trade-form]');
        if (tradeForm) {
            tradeForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitButton = tradeForm.querySelector('[type="submit"]');
                if (submitButton?.disabled) return;
                const amount = tradeForm.querySelector('input[type="number"]')?.value;
                const side = tradeForm.dataset.side || 'buy';
                const leverage = tradeForm.dataset.leverage || '1x';
                const symbol = 'EURUSD';

                if (submitButton) submitButton.disabled = true;
                try {
                    if (await brokerAccount.trade({ symbol, side, amount, leverage })) {
                        tradeForm.reset();
                    }
                } finally {
                    if (submitButton) submitButton.disabled = false;
                }
            });
        }

        // 4. INVESTMENTS PAGE
        document.querySelectorAll('[data-subscribe-plan]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                if (btn.disabled) return;
                const planName = btn.dataset.planName || 'Gold Arbitrage';
                const capital = parseFloat(btn.dataset.planCapital) || 5000;
                const rate = parseFloat(btn.dataset.planRate) || 2.38;
                btn.disabled = true;
                try {
                    await brokerAccount.invest({ planName, capital, dailyRate: rate, durationDays: 21 });
                } finally {
                    btn.disabled = false;
                }
            });
        });
    }

    function setupProfileForm(user) {
        const form = document.querySelector('[data-profile-form]');
        if (!form) return;

        const currencyInput = form.querySelector('[data-auth-currency]');
        const languageInput = form.querySelector('[data-auth-language]');
        if (languageInput) {
            languageInput.replaceChildren(...DASHBOARD_LANGUAGES.map(([code, name]) => new Option(name, code)));
            languageInput.value = user.user_metadata?.language || 'en';
        }
        languageInput?.addEventListener('change', () => {
            if (currencyInput) currencyInput.value = currencyForUserLanguage(languageInput.value, currentUser);
        });

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const submit = form.querySelector('button[type="submit"]');
            if (submit) submit.disabled = true;

            const username = form.querySelector('[data-auth-username]')?.value.trim() || '';
            const fullName = form.querySelector('[data-auth-name]')?.value.trim() || '';
            const phone = form.querySelector('[data-auth-phone]')?.value.trim() || '';
            const country = form.querySelector('[data-auth-country]')?.value.trim() || '';
            const language = form.querySelector('[data-auth-language]')?.value || 'en';
            const previousLanguage = currentUser?.user_metadata?.language || 'en';
            const currency = currencyForUserLanguage(language, {
                ...currentUser,
                user_metadata: { ...currentUser.user_metadata, country }
            });
            const { data, error } = await client.auth.updateUser({
                data: {
                    username: username,
                    full_name: fullName,
                    phone: phone,
                    country: country,
                    currency: currency,
                    language: language,
                    account_data: currentAccountData
                }
            });

            if (error) {
                showAppleToast(error.message, 'error');
            } else if (data.user) {
                currentUser = data.user;
                if (language !== previousLanguage) saveDashboardLanguage(currentUser, language);
                window.accountPreferences?.setLanguagePreference(language);
                hydrateUI();
                showAppleToast('Profile updated successfully!');
                const saved = document.querySelector('[data-profile-saved]');
                if (saved) {
                    saved.hidden = false;
                    setTimeout(() => saved.hidden = true, 3000);
                }
                if (language !== previousLanguage) applyDashboardLanguage(language);
            }
            if (submit) submit.disabled = false;
        });
    }

    function setupDashboardLanguageSelector() {
        const header = document.querySelector('.reference-topbar');
        let select = document.querySelector('[data-dashboard-language]');

        if (!select && header) {
            const actions = header.querySelector(':scope > div:last-child');
            if (actions) {
                const label = document.createElement('label');
                label.className = 'reference-lang-control';
                label.innerHTML = '<span>language:</span><select data-dashboard-language aria-label="Dashboard language"></select>';
                select = label.querySelector('select');
                actions.prepend(label);
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        }
        if (!select) return;

        if (select.options.length !== DASHBOARD_LANGUAGES.length || select.options[0]?.value !== DASHBOARD_LANGUAGES[0][0]) {
            select.replaceChildren(...DASHBOARD_LANGUAGES.map(([code, name]) => new Option(name, code)));
        }

        const language = dashboardLanguage();
        select.value = language;
        document.documentElement.lang = language;
        applyDashboardLanguage(language, 0);
        window.accountPreferences?.setLanguagePreference(language);

        if (select.dataset.languageHandlerAttached) return;
        select.dataset.languageHandlerAttached = 'true';
        select.addEventListener('change', () => {
            const nextLanguage = select.value;
            const nextCurrency = currencyForUserLanguage(nextLanguage, currentUser);
            const previousLanguage = dashboardLanguage();
            if (nextLanguage === previousLanguage) return;

            try {
                saveDashboardLanguage(currentUser, nextLanguage);
                currentUser = {
                    ...currentUser,
                    user_metadata: {
                        ...currentUser.user_metadata,
                        language: nextLanguage,
                        currency: nextCurrency
                    }
                };
                window.currentSupabaseUser = currentUser;
                window.accountPreferences?.setLanguagePreference(nextLanguage);
                hydrateUI();
                applyDashboardLanguage(nextLanguage);
                client.auth.updateUser({ data: { language: nextLanguage, currency: nextCurrency } }).then(({ data, error }) => {
                    if (error) {
                        console.warn('Could not sync dashboard currency preference:', error.message);
                        return;
                    }
                    if (data.user) {
                        currentUser = data.user;
                        window.currentSupabaseUser = currentUser;
                    }
                }).catch((error) => console.warn('Could not sync dashboard currency preference:', error));
            } catch (error) {
                select.value = previousLanguage;
                console.warn('Could not save dashboard language preference:', error);
            }
        });
    }

    function applyDashboardLanguage(language, delay = 0) {
        window.clearTimeout(languageApplyTimer);
        languageApplyTimer = window.setTimeout(() => {
            document.documentElement.lang = language;
            localStorage.setItem('dashboard-language', language);

            const translations = DASHBOARD_TRANSLATIONS[language] || DASHBOARD_TRANSLATIONS.en;
            const navigationKeys = {
                'Dashboard': 'nav.dashboard',
                'Account': 'nav.account',
                'Deposit': 'nav.deposit',
                'Withdraw': 'nav.withdraw',
                'History': 'nav.history',
                'Transactions': 'nav.transactions',
                'Account Upgrade': 'nav.upgrade',
                'Signal Purchase': 'nav.signal',
                'Account Settings': 'nav.settings',
                'Logout': 'nav.logout'
            };
            document.querySelectorAll('#dashboard-sidebar nav a span').forEach((node) => {
                const key = node.dataset.i18n || navigationKeys[node.textContent.trim()];
                if (key) node.dataset.i18n = key;
            });

            document.querySelectorAll('[data-i18n]').forEach((node) => {
                const key = node.dataset.i18n;
                if (translations[key]) {
                    node.textContent = translations[key];
                }
            });
        }, delay);
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

        let closeTimer = null;
        const close = () => {
            dialog.classList.add('logout-closing');
            window.clearTimeout(closeTimer);
            closeTimer = window.setTimeout(() => {
                dialog.hidden = true;
                dialog.classList.remove('logout-closing');
            }, 220);
        };
        const open = (event) => {
            event.preventDefault();
            window.clearTimeout(closeTimer);
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
                .select('balance, bonus_balance, status, total_withdrawn, active_invest, total_profit, updated_at')
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
                currentAccountData.bonusBalance = Number(profile.bonus_balance) || 0;

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

        currentUser = applyStoredDashboardPreference(data.session.user);
        window.currentSupabaseUser = currentUser;
        await syncUserCountry(currentUser);

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
        setupDashboardLanguageSelector();
        setupProfileForm(currentUser);
        setupAvatarPicker(currentUser);
        setupLogoutLinks();
        setupPageForms();
        loadUsdExchangeRates();

        client.auth.onAuthStateChange(async (_event, session) => {
            if (!session) {
                window.location.replace('../login.html');
                return;
            }
            currentUser = applyStoredDashboardPreference(session.user);
            window.currentSupabaseUser = currentUser;

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
