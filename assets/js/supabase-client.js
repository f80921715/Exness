(function () {
    'use strict';

    const SUPABASE_URL = 'https://pevioptoprclqpzooniv.supabase.co';
    const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_T0GfBIifcVR9ZmDIe64LtA_l7xUXS5M';

    if (!window.supabase || !window.supabase.createClient) {
        console.error('Supabase client library is unavailable.');
        return;
    }

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    window.supabaseClient = client;

    const countryCurrencyGroups = {
        AED: ['united arab emirates', 'united arab erimates'],
        AFN: ['afghanistan', 'afganistan'],
        ALL: ['albania'],
        AOA: ['angola'],
        AMD: ['armenia'],
        AWG: ['aruba'],
        ARS: ['argentina'],
        AUD: ['australia', 'christmas island', 'cocos island', 'norfolk island', 'kiribati', 'nauru', 'tuvalu'],
        BYN: ['belarus'],
        BBD: ['barbados'],
        BIF: ['burundi'],
        BMD: ['bermuda'],
        BND: ['brunei'],
        BOB: ['bolivia'],
        BSD: ['bahamas'],
        BTN: ['bhutan'],
        BWP: ['botswana'],
        BZD: ['belize'],
        BAM: ['bosnia & herzegovina'],
        AZN: ['azerbaijan'],
        BDT: ['bangladesh'],
        BGN: ['bulgaria'],
        BHD: ['bahrain'],
        BRL: ['brazil'],
        CAD: ['canada'],
        CDF: ['zaire'],
        CHF: ['switzerland', 'liechtenstein'],
        CLP: ['chile'],
        CNY: ['china'],
        CUP: ['cuba'],
        COP: ['colombia'],
        CRC: ['costa rica'],
        CVE: ['cape verde'],
        KYD: ['cayman islands'],
        KMF: ['comoros'],
        KHR: ['cambodia'],
        CZK: ['czech republic'],
        DJF: ['djibouti'],
        DKK: ['denmark', 'faroe islands', 'greenland'],
        DZD: ['algeria'],
        DOP: ['dominican republic'],
        ERN: ['eritrea'],
        ETB: ['ethiopia'],
        EGP: ['egypt'],
        EUR: ['andorra', 'austria', 'belgium', 'croatia', 'cyprus', 'estonia', 'finland', 'france', 'french guiana', 'french polynesia', 'germany', 'greece', 'ireland', 'italy', 'latvia', 'lithuania', 'luxembourg', 'malta', 'monaco', 'montenegro', 'netherlands', 'netherlands (holland, europe)', 'portugal', 'san marino', 'slovakia', 'slovenia', 'spain', 'vatican city state', 'canary islands', 'french southern ter', 'guadeloupe', 'martinique', 'mayotte', 'reunion', 'st barthelemy', 'st pierre & miquelon', 'republic of montenegro'],
        FKP: ['falkland islands'],
        FJD: ['fiji'],
        GBP: ['great britain', 'united kingdom', 'isle of man', 'channel islands'],
        GEL: ['georgia'],
        GHS: ['ghana'],
        GIP: ['gibraltar'],
        GMD: ['gambia'],
        GNF: ['guinea'],
        GTQ: ['guatemala'],
        GYD: ['guyana'],
        HKD: ['hong kong'],
        HNL: ['honduras'],
        HTG: ['haiti'],
        HUF: ['hungary'],
        ISK: ['iceland'],
        IDR: ['indonesia'],
        ILS: ['israel', 'palestine'],
        INR: ['india'],
        IQD: ['iraq'],
        IRR: ['iran'],
        JOD: ['jordan'],
        JPY: ['japan'],
        JMD: ['jamaica'],
        KES: ['kenya'],
        KPW: ['korea north'],
        KGS: ['kyrgyzstan'],
        KRW: ['korea sout', 'korea south'],
        KWD: ['kuwait'],
        KZT: ['kazakhstan'],
        LKR: ['sri lanka'],
        LAK: ['laos'],
        LBP: ['lebanon'],
        LRD: ['liberia'],
        LYD: ['libya'],
        MAD: ['morocco'],
        MDL: ['moldova'],
        MGA: ['madagascar'],
        MKD: ['macedonia'],
        MMK: ['myanmar'],
        MNT: ['mongolia'],
        MOP: ['macau'],
        MRU: ['mauritania'],
        MVR: ['maldives'],
        MWK: ['malawi'],
        MZN: ['mozambique'],
        MUR: ['mauritius'],
        MXN: ['mexico'],
        MYR: ['malaysia'],
        NAD: ['nambia', 'namibia'],
        NGN: ['nigeria'],
        NIO: ['nicaragua'],
        NOK: ['norway'],
        NPR: ['nepal'],
        ANG: ['netherland antilles', 'curaco', 'curacao', 'st maarten'],
        NZD: ['new zealand', 'cook islands', 'niue', 'pitcairn island', 'tokelau'],
        XPF: ['new caledonia', 'tahiti', 'wallis & futana is'],
        OMR: ['oman'],
        PAB: ['panama'],
        PEN: ['peru'],
        PGK: ['papua new guinea'],
        PHP: ['phillipines', 'philippines'],
        PKR: ['pakistan'],
        PLN: ['poland'],
        PYG: ['paraguay'],
        QAR: ['qatar'],
        RSD: ['republic of serbia', 'serbia'],
        RWF: ['rwanda'],
        RON: ['romania'],
        RUB: ['russia'],
        SAR: ['saudi arabia'],
        SEK: ['sweden'],
        SCR: ['seychelles'],
        SGD: ['singapore'],
        SLE: ['sierra leone'],
        SBD: ['solomon islands'],
        SOS: ['somalia'],
        SDG: ['sudan'],
        SRD: ['suriname'],
        SYP: ['syria'],
        STN: ['sao tome & principe'],
        WST: ['samoa'],
        TOP: ['tonga'],
        THB: ['thailand'],
        TND: ['tunisia'],
        TTD: ['trinidad & tobago'],
        TRY: ['turkey'],
        TJS: ['tajikistan'],
        TMT: ['turkmenistan'],
        TWD: ['taiwan'],
        TZS: ['tanzania'],
        UZS: ['uzbekistan'],
        UAH: ['ukraine'],
        UGX: ['uganda'],
        VES: ['venezuela'],
        VUV: ['vanuatu'],
        USD: ['united states of america', 'united states', 'american samoa', 'guam', 'puerto rico', 'virgin islands (usa)', 'wake island', 'midway islands', 'hawaii', 'bonaire', 'british indian ocean ter', 'east timor', 'ecuador', 'el salvador', 'marshall islands', 'palau island', 'saipan', 'samoa american', 'st eustatius', 'turks & caicos is', 'zimbabwe'],
        UYU: ['uraguay', 'uruguay'],
        YER: ['yemen'],
        VND: ['vietnam'],
        XAF: ['cameroon', 'central african republic', 'chad', 'congo', 'equatorial guinea', 'gabon'],
        XCD: ['anguilla', 'antigua & barbuda', 'dominica', 'grenada', 'montserrat', 'nevis', 'st kitts-nevis', 'st lucia', 'st vincent & grenadines'],
        XOF: ['benin', 'burkina faso', 'cote divoire', 'cote d ivoire', 'guinea-bissau', 'mali', 'niger', 'senegal', 'togo'],
        ZAR: ['south africa', 'lesotho', 'swaziland'],
        ZMW: ['zambia'],
        SHP: ['st helena']
    };
    const countryCurrencies = Object.fromEntries(
        Object.entries(countryCurrencyGroups).flatMap(([currency, countries]) => countries.map((country) => [country, currency]))
    );

    function currencyForCountry(country) {
        const normalizedCountry = String(country || '').trim().toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ');
        return countryCurrencies[normalizedCountry] || 'USD';
    }

    function setCurrency(select, currency) {
        if (!select || !currency) return;
        const code = String(currency).toUpperCase();
        if (!select.querySelector(`option[value="${code}"]`)) {
            select.add(new Option(`${code} - ${code}`, code));
        }
        select.value = code;
    }

    function setLanguagePreference(language) {
        const code = String(language || '').toLowerCase();
        if (!/^[a-z]{2,3}(?:-[a-z]{2,4})?$/.test(code)) return;
        const value = `/en/${code}`;
        document.cookie = `googtrans=${value};path=/;max-age=31536000;SameSite=Lax`;
        document.cookie = `googtrans=${value};path=/;domain=${location.hostname};max-age=31536000;SameSite=Lax`;
    }

    window.accountPreferences = { currencyForCountry, setCurrency, setLanguagePreference };

    function landingInitials(user) {
        const name = user.user_metadata?.full_name || user.user_metadata?.username || user.email || 'IN';
        return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'IN';
    }

    function updateLandingAuth(user) {
        const authenticated = Boolean(user);
        document.documentElement.classList.toggle('has-auth-session', authenticated);
        document.querySelectorAll('[data-start-trading]').forEach((link) => {
            link.href = authenticated ? 'dashboard/index.html' : 'register.html';
        });
        document.querySelectorAll('[data-landing-guest-auth], [data-landing-guest-mobile]').forEach((element) => {
            element.hidden = authenticated;
        });
        document.querySelectorAll('[data-landing-user-auth], [data-landing-user-mobile]').forEach((element) => {
            element.hidden = !authenticated;
        });
        document.querySelectorAll('[data-landing-guest-content]').forEach((element) => {
            element.hidden = authenticated;
        });
        if (!authenticated) return;

        document.querySelectorAll('[data-landing-initials]').forEach((element) => { element.textContent = landingInitials(user); });
        const avatar = localStorage.getItem(`profile-avatar:${user.id}`);
        document.querySelectorAll('[data-landing-avatar]').forEach((element) => {
            element.hidden = !avatar;
            if (avatar) element.src = avatar;
        });
        document.querySelectorAll('[data-landing-logout]').forEach((button) => {
            button.onclick = async () => {
                button.disabled = true;
                await client.auth.signOut();
                window.location.reload();
            };
        });
    }

    window.updateLandingAuth = updateLandingAuth;

    client.auth.getSession().then(({ data }) => {
        if (data.session?.user?.user_metadata?.language) {
            setLanguagePreference(data.session.user.user_metadata.language);
        }
        document.documentElement.classList.toggle('has-auth-session', Boolean(data.session));
        updateLandingAuth(data.session?.user || null);
    }).catch(() => {});
    client.auth.onAuthStateChange((_event, session) => {
        if (session?.user?.user_metadata?.language) setLanguagePreference(session.user.user_metadata.language);
        updateLandingAuth(session?.user || null);
    });

    document.addEventListener('DOMContentLoaded', async () => {
        const { data } = await client.auth.getSession();
        updateLandingAuth(data.session?.user || null);
    });

    window.setTimeout(async () => {
        const { data } = await client.auth.getSession();
        updateLandingAuth(data.session?.user || null);
    }, 250);

    function setStatus(form, message, type, options = {}) {
        const previous = document.querySelector('[data-auth-result]');
        if (previous) previous.remove();

        const action = options.onAction;
        const actionLabel = options.actionLabel || (action ? 'Continue' : 'Close');
        const overlay = document.createElement('div');
        overlay.className = 'auth-result-backdrop';
        overlay.dataset.authResult = '';
        overlay.dataset.type = type;
        overlay.innerHTML = `
            <section class="auth-result__panel" role="dialog" aria-modal="true" aria-labelledby="auth-result-title">
                <button class="auth-result__dismiss" type="button" data-auth-dismiss aria-label="Close">&times;</button>
                <div class="auth-result__mark" aria-hidden="true"></div>
                <h2 class="auth-result__title" id="auth-result-title"></h2>
                <p class="auth-result__message"></p>
                <button class="auth-result__action" type="button" data-auth-action></button>
            </section>`;

        const isLogin = form.id === 'login';
        overlay.querySelector('.auth-result__title').textContent = `${isLogin ? 'Login' : 'Sign up'} ${type === 'success' ? 'successful' : 'failed'}`;
        overlay.querySelector('.auth-result__message').textContent = message;
        overlay.querySelector('[data-auth-action]').textContent = actionLabel;

        const dismiss = (runAction = false) => {
            document.removeEventListener('keydown', onKeyDown);
            overlay.remove();
            if (runAction && action) action();
            else form.querySelector('button[type="submit"]')?.focus();
        };
        const onKeyDown = (event) => {
            if (event.key === 'Escape') dismiss();
        };

        overlay.querySelector('[data-auth-dismiss]').addEventListener('click', () => dismiss());
        overlay.querySelector('[data-auth-action]').addEventListener('click', () => dismiss(true));
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) dismiss();
        });
        document.addEventListener('keydown', onKeyDown);
        document.body.append(overlay);
        requestAnimationFrame(() => overlay.classList.add('auth-result-backdrop--visible'));
        overlay.querySelector('[data-auth-action]').focus();
    }

    function setLoading(form, loading, label) {
        const submit = form.querySelector('button[type="submit"]');
        if (!submit) return;
        submit.disabled = loading;
        if (loading) {
            submit.dataset.originalLabel = submit.innerHTML;
            submit.textContent = label;
        } else if (submit.dataset.originalLabel) {
            submit.innerHTML = submit.dataset.originalLabel;
            delete submit.dataset.originalLabel;
        }
    }

    async function redirectToDashboard(user) {
        if (user) {
            try {
                const { data, error } = await client.from('profiles').select('role').eq('id', user.id).maybeSingle();
                if (!error && data && data.role === 'admin') {
                    window.location.assign('admin/index.html');
                    return;
                }
            } catch (e) {
                console.warn('Role check error:', e);
            }
        }
        window.location.assign('dashboard/index.html');
    }

    function setupLogin() {
        const form = document.getElementById('login');
        if (!form) return;

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            setLoading(form, true, 'Signing in...');

            const email = form.email.value.trim();
            const password = form.password.value;
            try {
                const { data, error } = await client.auth.signInWithPassword({ email, password });
                setLoading(form, false);
                if (error) {
                    setStatus(form, error.message, 'error');
                    return;
                }

                setStatus(form, 'You are now signed in.', 'success', {
                    onAction: () => redirectToDashboard(data?.user)
                });
            } catch (error) {
                setLoading(form, false);
                setStatus(form, error.message || 'Please check your connection and try again.', 'error');
            }
        });
    }

    function setupRegistration() {
        const form = document.getElementById('register');
        if (!form) return;

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            setLoading(form, true, 'Creating account...');

            const password = form.password.value;
            const confirmation = form.password_confirmation.value;
            if (password !== confirmation) {
                setStatus(form, 'Passwords do not match.', 'error');
                setLoading(form, false);
                return;
            }

            try {
                const { data, error } = await client.auth.signUp({
                    email: form.email.value.trim(),
                    password,
                    options: {
                        data: {
                            username: form.username.value.trim(),
                            full_name: form.name.value.trim(),
                            phone: form.phone.value.trim(),
                            country: form.country.value,
                            currency: form.currency.value,
                            language: form.language.value
                        }
                    }
                });

                setLoading(form, false);
                if (error) {
                    setStatus(form, error.message, 'error');
                    return;
                }

                if (data.session) {
                    setStatus(form, 'Your account is ready.', 'success', {
                        onAction: () => redirectToDashboard(data.user)
                    });
                    return;
                }

                setStatus(form, 'Check your email to confirm your account before signing in.', 'success');
            } catch (error) {
                setLoading(form, false);
                setStatus(form, error.message || 'Please check your connection and try again.', 'error');
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        setupLogin();
        setupRegistration();
    });
})();
