// Tesla Finance Trade Core Application Logic

// Stock Data Models
const stockData = {
    active: [
        { symbol: "ACVA", name: "ACV Auctions Inc.", price: 10.44, changePercent: "+44.53%", changeValue: "+3.22", isPositive: true, avatarBg: "#FFD100", avatarText: "ACV" },
        { symbol: "TNON", name: "Tenon Medical, Inc.", price: 5.82, changePercent: "+9.81%", changeValue: "+0.70", isPositive: true, avatarBg: "#374151", avatarText: "T" },
        { symbol: "SMR", name: "NuScale Power Corporation", price: 8.87, changePercent: "-13.17%", changeValue: "-1.35", isPositive: false, avatarBg: "#2563EB", avatarText: "SMR" },
        { symbol: "INTC", name: "Intel Corporation", price: 103.28, changePercent: "+2.95%", changeValue: "+2.96", isPositive: true, avatarBg: "#0284C7", avatarText: "INTC" },
        { symbol: "PLTR", name: "Palantir Technologies", price: 28.45, changePercent: "+7.12%", changeValue: "+1.89", isPositive: true, avatarBg: "#1F2937", avatarText: "PLTR" }
    ],
    gainers: [
        { symbol: "ACVA", name: "ACV Auctions Inc.", price: 10.44, changePercent: "+44.53%", changeValue: "+3.22", isPositive: true, avatarBg: "#FFD100", avatarText: "ACV" },
        { symbol: "TNON", name: "Tenon Medical, Inc.", price: 5.82, changePercent: "+9.81%", changeValue: "+0.70", isPositive: true, avatarBg: "#374151", avatarText: "T" },
        { symbol: "RIVN", name: "Rivian Automotive", price: 15.60, changePercent: "+8.45%", changeValue: "+1.21", isPositive: true, avatarBg: "#059669", avatarText: "RIVN" },
        { symbol: "NVDA", name: "NVIDIA Corp.", price: 128.90, changePercent: "+6.80%", changeValue: "+8.20", isPositive: true, avatarBg: "#16A34A", avatarText: "NVDA" },
        { symbol: "LCID", name: "Lucid Group Inc.", price: 3.45, changePercent: "+5.15%", changeValue: "+0.17", isPositive: true, avatarBg: "#475569", avatarText: "LCID" }
    ],
    losers: [
        { symbol: "SMR", name: "NuScale Power Corporation", price: 8.87, changePercent: "-13.17%", changeValue: "-1.35", isPositive: false, avatarBg: "#2563EB", avatarText: "SMR" },
        { symbol: "NKLA", name: "Nikola Corporation", price: 7.15, changePercent: "-8.40%", changeValue: "-0.65", isPositive: false, avatarBg: "#DC2626", avatarText: "NKLA" },
        { symbol: "FSR", name: "Fisker Inc.", price: 0.85, changePercent: "-6.20%", changeValue: "-0.06", isPositive: false, avatarBg: "#B91C1C", avatarText: "FSR" },
        { symbol: "AMC", name: "AMC Entertainment", price: 4.30, changePercent: "-5.80%", changeValue: "-0.26", isPositive: false, avatarBg: "#991B1B", avatarText: "AMC" }
    ],
    featured: [
        { symbol: "TSLA", name: "Tesla", price: 365.37, changePercent: "+0.50%", changeValue: "+1.81", isPositive: true, icon: "tesla" },
        { symbol: "AAPL", name: "Apple", price: 333.31, changePercent: "+2.06%", changeValue: "+6.74", isPositive: true, icon: "apple" },
        { symbol: "MSFT", name: "Microsoft", price: 494.85, changePercent: "+0.49%", changeValue: "+2.41", isPositive: true, icon: "microsoft" },
        { symbol: "GOOGL", name: "Alphabet", price: 340.57, changePercent: "+2.40%", changeValue: "+7.97", isPositive: true, icon: "google" },
        { symbol: "AMZN", name: "Amazon", price: 256.67, changePercent: "+1.90%", changeValue: "+4.82", isPositive: true, icon: "amazon" }
    ]
};

// Vehicle Database
const vehicles = [
    {
        id: "model-x",
        name: "Tesla Model X",
        price: 36000,
        displayPrice: "$36,000.00*",
        note: "After Est. Gas Savings",
        image: "assets/images/model_x_white.jpg",
        acceleration: "3.8s 0-60 mph",
        range: "335 miles",
        topSpeed: "155 mph",
        seating: "Up to 7 Seats",
        powertrain: "Dual Motor All-Wheel Drive",
        doors: "Falcon Wing Doors"
    },
    {
        id: "model-3-lr",
        name: "Tesla Model 3 Long Range",
        price: 47240,
        displayPrice: "$47,240.00*",
        note: "After Est. Gas Savings",
        image: "assets/images/model_3_blue.jpg",
        acceleration: "4.2s 0-60 mph",
        range: "341 miles",
        topSpeed: "125 mph",
        seating: "5 Seats",
        powertrain: "Dual Motor All-Wheel Drive",
        doors: "Acoustic Glass All Around"
    },
    {
        id: "model-x-plaid",
        name: "Tesla Model X Plaid",
        price: 94990,
        displayPrice: "$94,990.00*",
        note: "After Est. Gas Savings",
        image: "assets/images/model_s_plaid.jpg",
        acceleration: "2.5s 0-60 mph",
        range: "326 miles",
        topSpeed: "163 mph",
        seating: "6 Seats",
        powertrain: "Tri Motor All-Wheel Drive (1,020 hp)",
        doors: "Falcon Wing Doors & Carbon Decor"
    },
    {
        id: "cybertruck",
        name: "Tesla Cybertruck Foundation",
        price: 99990,
        displayPrice: "$99,990.00*",
        note: "After Est. Gas Savings",
        image: "assets/images/cybertruck.jpg",
        acceleration: "2.6s 0-60 mph",
        range: "340 miles",
        topSpeed: "130 mph",
        seating: "5 Adults",
        powertrain: "Cyberbeast Tri-Motor AWD",
        doors: "Ultra-Hard 30X Cold-Rolled Stainless Steel"
    }
];

// Live Notifications Data
const liveNotifications = [
    { city: "Moscow", action: "just invested", amount: "$5,400", type: "invest" },
    { city: "Chicago", action: "just withdrew", amount: "$1,250", type: "withdraw" },
    { city: "London", action: "just invested", amount: "$12,000", type: "invest" },
    { city: "Tokyo", action: "just reserved", amount: "Tesla Model X", type: "car" },
    { city: "Zurich", action: "just invested", amount: "$25,000", type: "invest" },
    { city: "Dubai", action: "just ordered", amount: "Tesla Model X Plaid", type: "car" },
    { city: "Singapore", action: "just deposited", amount: "2.4 BTC", type: "crypto" },
    { city: "Toronto", action: "just withdrew", amount: "$3,800", type: "withdraw" },
    { city: "Frankfurt", action: "just invested", amount: "$8,500", type: "invest" },
    { city: "Sydney", action: "just reserved", amount: "Tesla Cybertruck", type: "car" }
];

// Alpine.js Global Stores & Logic
document.addEventListener('alpine:init', () => {
    // Theme Store with Dashboard-Style Circular View Transition
    Alpine.store('theme', {
        dark: localStorage.getItem('theme') === 'dark',
        init() {
            if (this.dark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        },
        toggle(trigger) {
            if (document.documentElement.dataset.themeVt === 'active') return;

            const bounds = trigger?.currentTarget?.getBoundingClientRect?.() || (trigger?.target?.getBoundingClientRect ? trigger.target.getBoundingClientRect() : null);
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const x = bounds ? bounds.left + bounds.width / 2 : viewportWidth / 2;
            const y = bounds ? bounds.top + bounds.height / 2 : viewportHeight / 2;
            const radius = Math.hypot(Math.max(x, viewportWidth - x), Math.max(y, viewportHeight - y));
            const clipFrom = `circle(0% at ${(x / viewportWidth) * 100}% ${(y / viewportHeight) * 100}%)`;
            const clipTo = `circle(${(radius / (Math.hypot(viewportWidth, viewportHeight) / Math.SQRT2)) * 100}% at ${(x / viewportWidth) * 100}% ${(y / viewportHeight) * 100}%)`;
            const nextDark = !this.dark;
            const applyTheme = () => {
                document.documentElement.classList.toggle('dark', nextDark);
                this.dark = nextDark;
                localStorage.setItem('theme', nextDark ? 'dark' : 'light');
            };

            if (typeof document.startViewTransition !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                applyTheme();
                if (window.renderStockCharts) window.renderStockCharts();
                if (window.renderDashboardChart) window.renderDashboardChart();
                return;
            }

            const root = document.documentElement;
            root.dataset.themeVt = 'active';
            root.style.setProperty('--theme-clip-from', clipFrom);
            root.style.setProperty('--theme-clip-to', clipTo);
            const transition = document.startViewTransition(() => applyTheme());
            transition.ready.then(() => {
                root.animate({ clipPath: [clipFrom, clipTo] }, {
                    duration: 400,
                    easing: 'ease-in-out',
                    fill: 'forwards',
                    pseudoElement: '::view-transition-new(root)'
                });
            }).catch(() => {});
            transition.finished.finally(() => {
                delete root.dataset.themeVt;
                root.style.removeProperty('--theme-clip-from');
                root.style.removeProperty('--theme-clip-to');
            }).catch(() => {});
            if (window.renderStockCharts) {
                window.renderStockCharts();
            }
            if (window.renderDashboardChart) {
                window.renderDashboardChart();
            }
        }
    });

    // Notification Toaster Store
    Alpine.store('toast', {
        visible: false,
        data: liveNotifications[0],
        index: 0,
        init() {
            setTimeout(() => {
                this.showNext();
            }, 2500);
        },
        showNext() {
            this.data = liveNotifications[this.index % liveNotifications.length];
            this.visible = true;
            this.index++;
            setTimeout(() => {
                this.visible = false;
                setTimeout(() => {
                    this.showNext();
                }, Math.floor(Math.random() * 3000) + 4000);
            }, 4500);
        }
    });

    // Stock Market App Component
    Alpine.data('stockMarketApp', () => ({
        activeTab: 'active',
        timeframe: '1Y',
        stockList: stockData.active,
        featuredList: stockData.featured,

        setTab(tab) {
            this.activeTab = tab;
            this.stockList = stockData[tab] || stockData.active;
            this.updateCharts();
        },

        setTimeframe(tf) {
            this.timeframe = tf;
            this.updateCharts();
        },

        init() {
            this.$nextTick(() => {
                initCharts();
            });
        },

        updateCharts() {
            initCharts();
        }
    }));

    // Vehicle Modal & Store
    Alpine.store('vehicleModal', {
        open: false,
        mode: 'view', // 'view' or 'order'
        selectedVehicle: vehicles[0],
        openView(vehicle) {
            this.selectedVehicle = vehicle;
            this.mode = 'view';
            this.open = true;
        },
        openOrder(vehicle) {
            this.selectedVehicle = vehicle;
            this.mode = 'order';
            this.open = true;
        },
        close() {
            this.open = false;
        }
    });

    // Auth Modals Store
    Alpine.store('authModal', {
        open: false,
        tab: 'login', // 'login' or 'register'
        openLogin() {
            this.tab = 'login';
            this.open = true;
        },
        openRegister() {
            this.tab = 'register';
            this.open = true;
        },
        close() {
            this.open = false;
        }
    });
});

// Canvas Charts Implementation
let chartLeft = null;
let chartRight = null;

function initCharts() {
    const isDark = document.documentElement.classList.contains('dark') || true; // Screenshot shows dark stock section
    const canvasLeft = document.getElementById('chartLeft');
    const canvasRight = document.getElementById('chartRight');

    if (!canvasLeft || !canvasRight) return;

    // Timeframe labels and mock data generator
    const labels = ["Oct", "Nov", "Dec", "2026", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
    
    // Left Chart (Trending with dips, red stroke matching screenshot)
    const dataLeft = [120, 115, 98, 92, 75, 82, 68, 72, 65, 84, 80, 96];
    
    // Right Chart (Tesla / Tech indices, volatile with peaks)
    const dataRight = [380, 370, 395, 360, 420, 390, 375, 385, 340, 365, 355, 365.37];

    if (chartLeft) chartLeft.destroy();
    if (chartRight) chartRight.destroy();

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(24, 24, 27, 0.9)',
                titleColor: '#fff',
                bodyColor: '#EF4444',
                borderColor: '#3F3F46',
                borderWidth: 1,
                padding: 10,
                displayColors: false
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#71717A', font: { size: 10 } }
            },
            y: {
                display: false,
                grid: { display: false }
            }
        },
        elements: {
            line: {
                borderColor: '#FFD100',
                borderWidth: 1.8,
                tension: 0.35
            },
            point: {
                radius: 0,
                hoverRadius: 4,
                hoverBackgroundColor: '#FFD100',
                hoverBorderColor: '#FFFFFF',
                hoverBorderWidth: 2
            }
        }
    };

    if (canvasLeft.getContext) {
        chartLeft = new Chart(canvasLeft.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    data: dataLeft,
                    fill: {
                        target: 'origin',
                        above: 'rgba(255, 209, 0, 0.08)'
                    }
                }]
            },
            options: chartOptions
        });
    }

    if (canvasRight.getContext) {
        chartRight = new Chart(canvasRight.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    data: dataRight,
                    fill: {
                        target: 'origin',
                        above: 'rgba(255, 209, 0, 0.08)'
                    }
                }]
            },
            options: chartOptions
        });
    }
}

window.renderStockCharts = initCharts;

// Initialize Lucide icons on load and DOM updates
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) {
        window.lucide.createIcons();
    }
    setTimeout(() => {
        initCharts();
    }, 300);
});

// Refresh icons after Alpine mutations
window.addEventListener('alpine:initialized', () => {
    if (window.lucide) {
        window.lucide.createIcons();
    }
});
