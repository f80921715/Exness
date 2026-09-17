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

    function landingInitials(user) {
        const name = user.user_metadata?.full_name || user.user_metadata?.username || user.email || 'IN';
        return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'IN';
    }

    function updateLandingAuth(user) {
        const authenticated = Boolean(user);
        document.querySelectorAll('[data-landing-guest-auth], [data-landing-guest-mobile]').forEach((element) => {
            element.hidden = authenticated;
        });
        document.querySelectorAll('[data-landing-user-auth], [data-landing-user-mobile]').forEach((element) => {
            element.hidden = !authenticated;
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
        document.documentElement.classList.toggle('has-auth-session', Boolean(data.session));
        updateLandingAuth(data.session?.user || null);
    }).catch(() => {});
    client.auth.onAuthStateChange((_event, session) => updateLandingAuth(session?.user || null));

    document.addEventListener('DOMContentLoaded', async () => {
        const { data } = await client.auth.getSession();
        updateLandingAuth(data.session?.user || null);
    });

    window.setTimeout(async () => {
        const { data } = await client.auth.getSession();
        updateLandingAuth(data.session?.user || null);
    }, 250);

    function setStatus(form, message, type) {
        let status = form.querySelector('[data-auth-status]');
        if (!status) {
            status = document.createElement('p');
            status.setAttribute('data-auth-status', '');
            status.setAttribute('role', 'status');
            status.className = 'mt-4 rounded-xl border px-4 py-3 text-sm font-medium';
            form.prepend(status);
        }

        status.textContent = message;
        status.className = `mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${
            type === 'success'
                ? 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-300'
                : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300'
        }`;
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
            const { data, error } = await client.auth.signInWithPassword({ email, password });

            if (error) {
                setStatus(form, error.message, 'error');
                setLoading(form, false);
                return;
            }

            await redirectToDashboard(data?.user);
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

            const { data, error } = await client.auth.signUp({
                email: form.email.value.trim(),
                password,
                options: {
                    data: {
                        username: form.username.value.trim(),
                        full_name: form.name.value.trim(),
                        phone: form.phone.value.trim()
                    }
                }
            });

            if (error) {
                setStatus(form, error.message, 'error');
                setLoading(form, false);
                return;
            }

            if (data.session) {
                redirectToDashboard();
                return;
            }

            setStatus(form, 'Account created. Check your email to confirm your account before signing in.', 'success');
            setLoading(form, false);
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        setupLogin();
        setupRegistration();
    });
})();
