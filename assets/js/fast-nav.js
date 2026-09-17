// Instant Page Navigation & Link Prefetching Engine
(function() {
    // Global Dashboard Circular View Transition Engine
    window.toggleDashboardTheme = function(trigger) {
        if (document.documentElement.dataset.themeVt === 'active') return;

        var button = null;
        if (trigger) {
            if (trigger.nodeType === 1) button = trigger;
            else if (trigger.currentTarget && trigger.currentTarget.nodeType === 1) button = trigger.currentTarget;
            else if (trigger.target && trigger.target.nodeType === 1) button = trigger.target;
        }
        if (!button && window.event && window.event.target) {
            button = window.event.target.closest ? window.event.target.closest('button') : null;
        }

        var bounds = button && button.getBoundingClientRect ? button.getBoundingClientRect() : null;
        var viewportWidth = window.innerWidth;
        var viewportHeight = window.innerHeight;
        var x = bounds ? bounds.left + bounds.width / 2 : viewportWidth / 2;
        var y = bounds ? bounds.top + bounds.height / 2 : viewportHeight / 2;
        var radius = Math.hypot(Math.max(x, viewportWidth - x), Math.max(y, viewportHeight - y));
        var clipFrom = 'circle(0% at ' + ((x / viewportWidth) * 100) + '% ' + ((y / viewportHeight) * 100) + '%)';
        var clipTo = 'circle(' + ((radius / (Math.hypot(viewportWidth, viewportHeight) / Math.SQRT2)) * 100) + '% at ' + ((x / viewportWidth) * 100) + '% ' + ((y / viewportHeight) * 100) + '%)';
        
        var isCurrentlyDark = document.documentElement.classList.contains('dark');
        var nextDark = !isCurrentlyDark;

        var applyTheme = function() {
            document.documentElement.classList.toggle('dark', nextDark);
            if (window.Alpine && window.Alpine.store('theme')) {
                window.Alpine.store('theme').dark = nextDark;
            }
            localStorage.setItem('theme', nextDark ? 'dark' : 'light');
        };

        if (typeof document.startViewTransition !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            applyTheme();
            if (window.renderStockCharts) window.renderStockCharts();
            if (window.renderDashboardChart) window.renderDashboardChart();
            return;
        }

        var root = document.documentElement;
        root.dataset.themeVt = 'active';
        root.style.setProperty('--theme-clip-from', clipFrom);
        root.style.setProperty('--theme-clip-to', clipTo);
        var transition = document.startViewTransition(function() {
            applyTheme();
        });

        transition.ready.then(function() {
            root.animate({ clipPath: [clipFrom, clipTo] }, {
                duration: 400,
                easing: 'ease-in-out',
                fill: 'forwards',
                pseudoElement: '::view-transition-new(root)'
            });
        }).catch(function() {});

        transition.finished.finally(function() {
            delete root.dataset.themeVt;
            root.style.removeProperty('--theme-clip-from');
            root.style.removeProperty('--theme-clip-to');
            if (window.renderStockCharts) window.renderStockCharts();
            if (window.renderDashboardChart) window.renderDashboardChart();
        }).catch(function() {});
    };

    // Ensure Alpine theme store is hooked into the dashboard view transition
    function registerAlpineTheme() {
        if (window.Alpine) {
            var store = window.Alpine.store('theme');
            if (!store || !store._hasDashboardVt) {
                window.Alpine.store('theme', {
                    _hasDashboardVt: true,
                    dark: localStorage.getItem('theme') === 'dark',
                    init: function() {
                        if (this.dark) {
                            document.documentElement.classList.add('dark');
                        } else {
                            document.documentElement.classList.remove('dark');
                        }
                    },
                    toggle: function(trigger) {
                        window.toggleDashboardTheme(trigger);
                    }
                });
            } else {
                store.toggle = function(trigger) {
                    window.toggleDashboardTheme(trigger);
                };
            }
        }
    }

    document.addEventListener('alpine:init', registerAlpineTheme);
    if (window.Alpine) registerAlpineTheme();

    // Fallback click listener for any theme buttons
    document.addEventListener('click', function(event) {
        var button = event.target.closest ? event.target.closest('button') : null;
        if (!button) return;
        var expression = button.getAttribute('@click') || '';
        if (expression.indexOf('$store.theme.toggle') === -1 && !button.hasAttribute('data-theme-toggle') && button.getAttribute('aria-label') !== 'Toggle theme') return;
        
        // If not handled by Alpine, execute toggle with button context
        if (!window.Alpine || !window.Alpine.store('theme')) {
            window.toggleDashboardTheme(button);
        }
    }, true);

    // CRITICAL: fetch() is forbidden on file:// protocol - stop only prefetching.
    if (location.protocol === 'file:') return;

    // Only run on standard browsers supporting fetch and history
    if (!window.fetch || !window.history) return;

    const cache = new Map();

    // Prefetch a URL into memory
    function prefetch(url) {
        if (!url || url.startsWith('#') || url.startsWith('javascript:') || url.startsWith('mailto:') || url.startsWith('tel:')) return;
        if (url.startsWith('http')) return; // Skip external links
        const cleanUrl = url.split('#')[0];
        if (cache.has(cleanUrl)) return;

        try {
            fetch(cleanUrl, { priority: 'low' })
                .then(function(res) {
                    if (res.ok) return res.text();
                })
                .then(function(html) {
                    if (html) cache.set(cleanUrl, html);
                })
                .catch(function() {});
        } catch(e) {
            // Silently fail
        }
    }

    // Prefetch all visible internal links after page load
    window.addEventListener('load', function() {
        var links = document.querySelectorAll('a[href]');
        links.forEach(function(link) {
            var href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
                link.addEventListener('mouseenter', function() { prefetch(href); }, { passive: true });
                link.addEventListener('touchstart', function() { prefetch(href); }, { passive: true });
            }
        });
    });

    // Also prefetch when hovering any newly added links
    document.addEventListener('mouseover', function(e) {
        var link = e.target.closest ? e.target.closest('a[href]') : null;
        if (link) {
            var href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
                prefetch(href);
            }
        }
    }, { passive: true });
})();
