// Smart Energy Dashboard - Historical Data Page

const API_BASE = '';
let historyTrendChart = null;
let historyHourlyChart = null;
let historyWeekdayChart = null;
let currentPeriod = 'month';

// Chart.js defaults
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = '#334155';

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    loadHistoryData('month');

    // Filter button handlers
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPeriod = btn.dataset.period;
            loadHistoryData(currentPeriod);
        });
    });
});

// Initialize charts
function initCharts() {
    // Trend chart
    const trendCtx = document.getElementById('historyTrendChart').getContext('2d');
    historyTrendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Daily Consumption (kWh)',
                data: [],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#334155' },
                    title: { display: true, text: 'kWh' }
                },
                x: {
                    grid: { display: false },
                    ticks: { maxTicksLimit: 10 }
                }
            }
        }
    });

    // Hourly distribution chart
    const hourlyCtx = document.getElementById('historyHourlyChart').getContext('2d');
    historyHourlyChart = new Chart(hourlyCtx, {
        type: 'bar',
        data: {
            labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
            datasets: [{
                label: 'Average Usage (kW)',
                data: [],
                backgroundColor: createGradient(hourlyCtx, '#6366f1', '#10b981'),
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#334155' } },
                x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } }
            }
        }
    });

    // Weekday chart
    const weekdayCtx = document.getElementById('historyWeekdayChart').getContext('2d');
    historyWeekdayChart = new Chart(weekdayCtx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Average Daily Usage (kWh)',
                data: [],
                backgroundColor: [
                    '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe',
                    '#6366f1', '#10b981', '#34d399'
                ],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#334155' } },
                x: { grid: { display: false } }
            }
        }
    });
}

// Load history data
async function loadHistoryData(period) {
    try {
        const response = await fetch(`${API_BASE}/api/history?period=${period}`);
        const data = await response.json();

        updateStats(data);
        updateCharts(data);
    } catch (error) {
        console.error('Error loading history data:', error);
        // Use simulated data
        const simData = generateSimulatedHistoryData(period);
        updateStats(simData);
        updateCharts(simData);
    }
}

// Generate simulated history data
function generateSimulatedHistoryData(period) {
    const days = { week: 7, month: 30, quarter: 90, year: 365 }[period];
    const labels = [];
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        data.push(Math.random() * 50 + 30);
    }

    const total = data.reduce((a, b) => a + b, 0);
    const avg = total / days;
    const peak = Math.max(...data);

    return {
        labels,
        data,
        stats: {
            total: total.toFixed(2),
            average: avg.toFixed(2),
            peak: (peak * 0.15).toFixed(2),
            cost: (total * 0.12).toFixed(2),
            totalChange: (Math.random() * 20 - 10).toFixed(1),
            avgChange: (Math.random() * 10 - 5).toFixed(1),
            peakChange: (Math.random() * 15 - 7.5).toFixed(1),
            costChange: (Math.random() * 20 - 10).toFixed(1)
        },
        hourly: Array.from({ length: 24 }, () => Math.random() * 3 + 1),
        weekday: Array.from({ length: 7 }, () => Math.random() * 20 + 25)
    };
}

// Update stats display
function updateStats(data) {
    const stats = data.stats;

    document.getElementById('history-total').textContent = `${stats.total} kWh`;
    document.getElementById('history-avg').textContent = `${stats.average} kWh`;
    document.getElementById('history-peak').textContent = `${stats.peak} kW`;
    document.getElementById('history-cost').textContent = `$${stats.cost}`;

    // Update comparison indicators
    updateCompare('history-total-compare', stats.totalChange);
    updateCompare('history-avg-compare', stats.avgChange);
    updateCompare('history-peak-compare', stats.peakChange);
    updateCompare('history-cost-compare', stats.costChange);
}

// Update comparison indicator
function updateCompare(elementId, change) {
    const el = document.getElementById(elementId);
    const value = parseFloat(change);
    const arrow = value >= 0 ? '↑' : '↓';
    el.textContent = `${arrow} ${Math.abs(value)}% vs previous`;
    el.className = `summary-compare ${value >= 0 ? 'negative' : 'positive'}`;
}

// Update charts
function updateCharts(data) {
    // Trend chart
    historyTrendChart.data.labels = data.labels;
    historyTrendChart.data.datasets[0].data = data.data;
    historyTrendChart.update();

    // Hourly chart
    historyHourlyChart.data.datasets[0].data = data.hourly;
    historyHourlyChart.update();

    // Weekday chart
    historyWeekdayChart.data.datasets[0].data = data.weekday;
    historyWeekdayChart.update();
}

// Helper: Create gradient
function createGradient(ctx, color1, color2) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
}
