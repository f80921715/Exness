(function () {
    'use strict';

    const startTradingLink = document.querySelector('[data-start-trading]');
    if (!startTradingLink) return;

    startTradingLink.addEventListener('click', async (event) => {
        event.preventDefault();
        if (startTradingLink.dataset.redirectPending === 'true') return;

        startTradingLink.dataset.redirectPending = 'true';
        startTradingLink.setAttribute('aria-busy', 'true');

        try {
            const client = window.supabaseClient;
            if (!client?.auth?.getSession) throw new Error('Supabase authentication is unavailable.');

            const { data, error } = await client.auth.getSession();
            if (error) throw error;

            const authenticated = Boolean(data.session?.user)
                || document.documentElement.classList.contains('has-auth-session');
            window.location.assign(authenticated ? 'dashboard/index.html' : 'register.html');
        } catch (error) {
            console.error('Could not check the current sign-in state:', error);
            const authenticated = document.documentElement.classList.contains('has-auth-session');
            window.location.assign(authenticated ? 'dashboard/index.html' : 'register.html');
        }
    });
})();
