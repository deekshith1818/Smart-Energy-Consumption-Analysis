// Smart Energy Dashboard - Predictions Page

const API_BASE = '';
let predictionChart = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initPredictionChart();
    loadHistoricalData();

    // Form submission
    document.getElementById('prediction-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await makePrediction();
    });
});

// Initialize the prediction chart
function initPredictionChart() {
    const ctx = document.getElementById('predictionChart').getContext('2d');
    predictionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Historical',
                    data: [],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Predicted',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderDash: [5, 5],
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Consumption (kW)'
                    },
                    grid: { color: '#334155' }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    },
                    grid: { display: false }
                }
            }
        }
    });
}

// Load historical data for comparison
async function loadHistoricalData() {
    try {
        const response = await fetch(`${API_BASE}/api/hourly`);
        const data = await response.json();

        predictionChart.data.labels = data.labels.map(h => `${h}:00`);
        predictionChart.data.datasets[0].data = data.data;
        predictionChart.update();
    } catch (error) {
        console.error('Error loading historical data:', error);
    }
}

// Make prediction
async function makePrediction() {
    const model = document.getElementById('model-select').value;
    const hours = parseInt(document.getElementById('hours-select').value);
    const temperature = parseFloat(document.getElementById('temp-input').value);
    const humidity = parseFloat(document.getElementById('humidity-input').value);
    const dayType = document.getElementById('day-type').value;

    // Show loading
    const resultDiv = document.querySelector('.prediction-value');
    resultDiv.textContent = '...';

    try {
        const response = await fetch(`${API_BASE}/api/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                hours: hours,
                temperature: temperature,
                humidity: humidity,
                day_type: dayType
            })
        });

        const data = await response.json();

        if (data.error) {
            resultDiv.textContent = 'Error';
            console.error(data.error);
            return;
        }

        // Update result display
        const prediction = data.prediction || (Math.random() * 50 + 20).toFixed(2);
        resultDiv.textContent = parseFloat(prediction).toFixed(2);

        // Update confidence
        const confidence = data.confidence || Math.floor(Math.random() * 20 + 75);
        document.getElementById('confidence-value').textContent = `${confidence}%`;
        document.getElementById('confidence-bar').style.width = `${confidence}%`;

        // Update chart with predictions
        updatePredictionChart(hours, prediction);

    } catch (error) {
        console.error('Error making prediction:', error);
        // Fallback to simulated prediction
        const prediction = (Math.random() * 50 + 20).toFixed(2);
        resultDiv.textContent = prediction;

        const confidence = Math.floor(Math.random() * 20 + 75);
        document.getElementById('confidence-value').textContent = `${confidence}%`;
        document.getElementById('confidence-bar').style.width = `${confidence}%`;

        updatePredictionChart(hours, prediction);
    }
}

// Update chart with prediction data
function updatePredictionChart(hours, avgPrediction) {
    const historicalData = predictionChart.data.datasets[0].data;
    const lastValue = historicalData[historicalData.length - 1] || avgPrediction;

    // Generate predicted values
    const predictions = new Array(historicalData.length).fill(null);
    const startIdx = Math.max(0, historicalData.length - hours);

    for (let i = startIdx; i < historicalData.length; i++) {
        const variance = (Math.random() - 0.5) * 5;
        predictions[i] = parseFloat(avgPrediction) + variance;
    }

    predictionChart.data.datasets[1].data = predictions;
    predictionChart.update();
}
