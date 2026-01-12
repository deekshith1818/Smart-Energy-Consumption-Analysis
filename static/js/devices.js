// Smart Energy Dashboard - Device Analysis Page

const API_BASE = '';
let deviceHourlyChart = null;
let deviceDailyChart = null;
let deviceComparisonChart = null;
let devicesData = [];

// Chart.js defaults
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = '#334155';

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await loadDevices();
    initCharts();
    loadDeviceData();
});

// Load available devices
async function loadDevices() {
    try {
        const response = await fetch(`${API_BASE}/api/devices`);
        const data = await response.json();
        devicesData = data.devices || [];

        const select = document.getElementById('device-select');
        select.innerHTML = devicesData.map((d, i) =>
            `<option value="${d.name}" ${i === 0 ? 'selected' : ''}>${d.name}</option>`
        ).join('');

        // Populate all devices list
        populateDeviceList();

    } catch (error) {
        console.error('Error loading devices:', error);
    }
}

// Initialize charts
function initCharts() {
    // Hourly chart
    const hourlyCtx = document.getElementById('deviceHourlyChart').getContext('2d');
    deviceHourlyChart = new Chart(hourlyCtx, {
        type: 'bar',
        data: {
            labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
            datasets: [{
                label: 'Consumption (kW)',
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
                x: { grid: { display: false } }
            }
        }
    });

    // Daily chart
    const dailyCtx = document.getElementById('deviceDailyChart').getContext('2d');
    deviceDailyChart = new Chart(dailyCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Daily Usage (kWh)',
                data: [],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
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

    // Comparison chart
    const compCtx = document.getElementById('deviceComparisonChart').getContext('2d');
    deviceComparisonChart = new Chart(compCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Consumption (%)',
                data: [],
                backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, grid: { color: '#334155' } },
                y: { grid: { display: false } }
            }
        }
    });
}

// Load device data
async function loadDeviceData() {
    const deviceName = document.getElementById('device-select').value;
    const timeRange = document.getElementById('time-range').value;

    if (!deviceName) return;

    try {
        // Try to fetch device-specific data
        const response = await fetch(`${API_BASE}/api/device/${encodeURIComponent(deviceName)}?range=${timeRange}`);
        const data = await response.json();

        updateDeviceStats(data);
        updateDeviceCharts(data);
    } catch (error) {
        console.error('Error loading device data:', error);
        // Use simulated data
        updateDeviceStats(generateSimulatedData(deviceName));
        updateDeviceCharts(generateSimulatedData(deviceName));
    }

    // Update comparison chart
    updateComparisonChart();
}

// Generate simulated data based on device
function generateSimulatedData(deviceName) {
    const baseUsage = devicesData.find(d => d.name === deviceName)?.percentage || 10;
    const multiplier = baseUsage / 10;

    return {
        total: (Math.random() * 100 * multiplier + 50).toFixed(2),
        average: (Math.random() * 2 * multiplier + 0.5).toFixed(2),
        peak: (Math.random() * 5 * multiplier + 2).toFixed(2),
        min: (Math.random() * 0.5 * multiplier).toFixed(2),
        hourly: Array.from({ length: 24 }, () => Math.random() * 3 * multiplier),
        daily: Array.from({ length: 7 }, () => Math.random() * 20 * multiplier)
    };
}

// Update device stats
function updateDeviceStats(data) {
    document.getElementById('device-total').textContent = `${data.total} kWh`;
    document.getElementById('device-avg').textContent = `${data.average} kW`;
    document.getElementById('device-peak').textContent = `${data.peak} kW`;
    document.getElementById('device-min').textContent = `${data.min} kW`;
}

// Update device charts
function updateDeviceCharts(data) {
    // Hourly chart
    deviceHourlyChart.data.datasets[0].data = data.hourly;
    deviceHourlyChart.update();

    // Daily chart
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    deviceDailyChart.data.labels = days;
    deviceDailyChart.data.datasets[0].data = data.daily;
    deviceDailyChart.update();
}

// Update comparison chart
function updateComparisonChart() {
    const top5 = devicesData.slice(0, 5);
    deviceComparisonChart.data.labels = top5.map(d => d.name);
    deviceComparisonChart.data.datasets[0].data = top5.map(d => d.percentage);
    deviceComparisonChart.update();
}

// Populate device list
function populateDeviceList() {
    const list = document.getElementById('all-devices-list');
    const maxPercentage = Math.max(...devicesData.map(d => d.percentage));

    list.innerHTML = devicesData.map(device => `
        <div class="device-item" style="cursor: pointer;" onclick="selectDevice('${device.name}')">
            <div style="flex: 1;">
                <div class="device-name">${device.name}</div>
                <div class="device-bar">
                    <div class="device-bar-fill" style="width: ${(device.percentage / maxPercentage) * 100}%"></div>
                </div>
            </div>
            <div class="device-usage">${device.percentage}%</div>
        </div>
    `).join('');
}

// Select device from list
function selectDevice(name) {
    document.getElementById('device-select').value = name;
    loadDeviceData();
}

// Helper: Create gradient
function createGradient(ctx, color1, color2) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
}
