document.addEventListener('DOMContentLoaded', () => {
    // Sliders sync
    const sbaInput = document.getElementById('skilled_birth_attendance');
    const sbaSlider = document.getElementById('sba_slider');
    const ancInput = document.getElementById('antenatal_care_coverage');
    const ancSlider = document.getElementById('anc_slider');

    function sync(input, slider) {
        slider.value = input.value || 0;
        input.addEventListener('input', () => slider.value = input.value);
        slider.addEventListener('input', () => input.value = slider.value);
    }

    sync(sbaInput, sbaSlider);
    sync(ancInput, ancSlider);

    // Chart Init
    let trendsChart;
    const ctx = document.getElementById('trendsChart').getContext('2d');

    // Fetch History
    async function loadHistory() {
        try {
            const response = await fetch('/api/history');
            const data = await response.json();

            const years = data.map(d => d.year);
            const mmr = data.map(d => d.MMR);

            initChart(years, mmr);
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    function initChart(years, data) {
        trendsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: 'Historical MMR',
                    data: data,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3
                }, {
                    label: 'Prediction',
                    data: [], // Filled correctly on prediction
                    borderColor: '#ec4899',
                    backgroundColor: '#ec4899',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    showLine: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#94a3b8' } }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94a3b8' },
                        title: { display: true, text: 'Maternal Mortality Ratio', color: '#94a3b8' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }

    loadHistory();

    // Form Submission
    const form = document.getElementById('predictionForm');
    const btn = document.getElementById('predictBtn');
    const loader = document.getElementById('loader');
    const resultBox = document.getElementById('resultBox');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // UI Loading State
        btn.disabled = true;
        loader.style.display = 'block';
        resultBox.classList.add('hidden');
        resultBox.classList.remove('visible');

        const formData = {
            year: parseInt(document.getElementById('year').value),
            skilled_birth_attendance: parseFloat(sbaInput.value),
            antenatal_care_coverage: parseFloat(ancInput.value),
            health_spending: parseFloat(document.getElementById('health_spending').value)
        };

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                showResult(formData.year, result);
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error('Prediction failed:', error);
            alert('Failed to connect to server.');
        } finally {
            btn.disabled = false;
            loader.style.display = 'none';
        }
    });

    function showResult(year, result) {
        // Update Result Box
        document.getElementById('resYear').textContent = year;
        document.getElementById('resMMR').textContent = result.predicted_mmr.toFixed(2);

        const badge = document.getElementById('resRisk');
        badge.textContent = result.risk_level;
        badge.className = 'badge'; // Reset

        if (result.risk_level.includes('High')) badge.classList.add('high');
        else if (result.risk_level.includes('Medium')) badge.classList.add('medium');
        else badge.classList.add('low');

        resultBox.classList.remove('hidden');
        // Small delay for fade in
        setTimeout(() => resultBox.classList.add('visible'), 10);

        // Update Chart
        // We need to add the point to the chart.
        // If year exists, update it. If not, add it.
        // For simplicity in this Viz, we will add a secondary dataset point for the prediction
        // tailored to match the year on the X-axis.

        updateChartWithPrediction(year, result.predicted_mmr);
    }

    function updateChartWithPrediction(year, val) {
        const currentLabels = trendsChart.data.labels;

        // If year is beyond current range, add it
        if (!currentLabels.includes(year)) {
            // Add intermediate years if gap (simplified: just add the target year)
            currentLabels.push(year);
            // Sort to keep order
            // Note: If we really want to sort, we need to sort data too. 
            // For now assume user predicts future.
        }

        // Create a sparse array for the prediction dot
        const predictionData = currentLabels.map(y => y === year ? val : null);

        trendsChart.data.datasets[1].data = predictionData;
        trendsChart.update();
    }
});
