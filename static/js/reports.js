// Smart Energy Dashboard - Reports Page

const API_BASE = '';
let selectedReportType = 'daily';
let reportData = [];

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Set default dates
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    document.getElementById('end-date').value = today.toISOString().split('T')[0];
    document.getElementById('start-date').value = lastWeek.toISOString().split('T')[0];

    // Report type selection
    document.querySelectorAll('.report-type-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.report-type-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedReportType = card.dataset.type;
        });
    });
});

// Generate report
async function generateReport() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const includeSummary = document.getElementById('inc-summary').checked;
    const includeDevices = document.getElementById('inc-devices').checked;
    const includeHourly = document.getElementById('inc-hourly').checked;
    const includeSuggestions = document.getElementById('inc-suggestions').checked;

    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/generate-report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: selectedReportType,
                start_date: startDate,
                end_date: endDate,
                include: {
                    summary: includeSummary,
                    devices: includeDevices,
                    hourly: includeHourly,
                    suggestions: includeSuggestions
                }
            })
        });

        const data = await response.json();
        reportData = data.report || generateSimulatedReport(startDate, endDate);
        displayReport(reportData);

    } catch (error) {
        console.error('Error generating report:', error);
        // Use simulated data
        reportData = generateSimulatedReport(startDate, endDate);
        displayReport(reportData);
    }
}

// Generate simulated report data
function generateSimulatedReport(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const report = [];
    for (let i = 0; i < days; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);

        const total = (Math.random() * 50 + 30).toFixed(2);
        const avg = (total / 24).toFixed(2);
        const peak = (Math.random() * 5 + 3).toFixed(2);
        const cost = (total * 0.12).toFixed(2);

        report.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            total,
            average: avg,
            peak,
            cost
        });
    }

    return report;
}

// Display report in table
function displayReport(data) {
    const tbody = document.getElementById('report-table-body');

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-secondary);">
                    No data available for the selected period
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map(row => `
        <tr>
            <td>${row.date}</td>
            <td>${row.total} kWh</td>
            <td>${row.average} kW</td>
            <td>${row.peak} kW</td>
            <td>$${row.cost}</td>
        </tr>
    `).join('');

    // Add summary row
    const totalSum = data.reduce((acc, r) => acc + parseFloat(r.total), 0);
    const avgCost = data.reduce((acc, r) => acc + parseFloat(r.cost), 0);

    tbody.innerHTML += `
        <tr style="font-weight: bold; background: var(--bg-card-hover);">
            <td>Total</td>
            <td>${totalSum.toFixed(2)} kWh</td>
            <td>-</td>
            <td>-</td>
            <td>$${avgCost.toFixed(2)}</td>
        </tr>
    `;
}

// Download report as CSV
function downloadReport(format) {
    if (reportData.length === 0) {
        alert('Please generate a report first');
        return;
    }

    if (format === 'csv') {
        const headers = ['Date', 'Total (kWh)', 'Average (kW)', 'Peak (kW)', 'Est. Cost ($)'];
        const rows = reportData.map(r => [r.date, r.total, r.average, r.peak, r.cost]);

        // Add summary
        const totalSum = reportData.reduce((acc, r) => acc + parseFloat(r.total), 0).toFixed(2);
        const avgCost = reportData.reduce((acc, r) => acc + parseFloat(r.cost), 0).toFixed(2);
        rows.push(['Total', totalSum, '-', '-', avgCost]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `energy_report_${selectedReportType}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
}
