document.addEventListener("DOMContentLoaded", () => {
    // Shared Colors (Dracula Theme)
    const draculaColors = {
        background: '#282a36',
        currentLine: '#44475a',
        foreground: '#f8f8f2',
        comment: '#6272a4',
        cyan: '#8be9fd',
        green: '#50fa7b',
        orange: '#ffb86c',
        pink: '#ff79c6',
        purple: '#bd93f9',
        red: '#ff5555',
        yellow: '#f1fa8c'
    };

    // Global Chart.js configuration for readability over dark themes
    Chart.defaults.color = draculaColors.foreground;
    Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

    // Holders for our active Chart instances
    let emotionChart, completionChart, confidenceChart;

    async function fetchAnalytics() {
        try {
            const res = await fetch('/api/analytics_data');
            const data = await res.json();
            renderCharts(data);
        } catch (e) {
            console.error("Failed to fetch analytics:", e);
        }
    }

    function renderCharts(data) {
        // --- 1. Emotion Profile ---
        const emotionCtx = document.getElementById('emotionChart').getContext('2d');
        const emotionLabels = Object.keys(data.emotion_distribution);
        const emotionData = Object.values(data.emotion_distribution);
        
        // Dynamically assign standard colors to emotions
        const EMOTION_COLORS = {
            'happy': draculaColors.green,
            'surprise': draculaColors.cyan,
            'neutral': draculaColors.comment,
            'sad': draculaColors.purple,
            'disgust': draculaColors.orange,
            'angry': draculaColors.red,
            'fear': draculaColors.yellow,
            'Unknown': draculaColors.currentLine
        };
        const bgColors = emotionLabels.map(l => EMOTION_COLORS[l] || draculaColors.pink);

        if (emotionChart) emotionChart.destroy();
        emotionChart = new Chart(emotionCtx, {
            type: 'doughnut',
            data: {
                labels: emotionLabels.map(e => e.toUpperCase()),
                datasets: [{
                    data: emotionData,
                    backgroundColor: bgColors,
                    borderColor: draculaColors.background,
                    hoverOffset: 4
                }]
            }
        });

        // --- 2. Completion Rates Bar ---
        const compCtx = document.getElementById('completionChart').getContext('2d');
        const sCount = data.completions.success;
        const fCount = data.completions.failed;
        
        if (completionChart) completionChart.destroy();
        completionChart = new Chart(compCtx, {
            type: 'bar',
            data: {
                labels: ['Successful Builds', 'Failed Builds'],
                datasets: [{
                    label: 'Executions Count',
                    data: [sCount, fCount],
                    backgroundColor: [draculaColors.green, draculaColors.red],
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: draculaColors.currentLine } },
                    x: { grid: { display: false } }
                }
            }
        });

        // --- 3. Confidence Over Time Line ---
        const confCtx = document.getElementById('confidenceChart').getContext('2d');
        
        if (confidenceChart) confidenceChart.destroy();
        confidenceChart = new Chart(confCtx, {
            type: 'line',
            data: {
                labels: data.confidence_trend.labels,
                datasets: [{
                    label: 'Engagement Score [0 - 1.0]',
                    data: data.confidence_trend.values,
                    fill: true,
                    borderColor: draculaColors.cyan,
                    backgroundColor: 'rgba(139, 233, 253, 0.2)', // transparent cyan
                    tension: 0.3,
                    pointRadius: 2
                }]
            },
            options: {
                scales: {
                    y: { min: 0, max: 1, grid: { color: draculaColors.currentLine } },
                    x: {
                        ticks: { maxTicksLimit: 15 },
                        grid: { display: false }
                    }
                }
            }
        });

        // --- 4. System Aggregates ---
        const confusionMetric = document.getElementById("confusion-metric");
        confusionMetric.innerText = `System Analytics: User has triggered \"Confusion States\" during ${data.confusion_frames} interval loops.`;
        if (data.confusion_frames > 20) {
            confusionMetric.style.backgroundColor = draculaColors.red;
        } else if (data.confusion_frames > 5) {
            confusionMetric.style.backgroundColor = draculaColors.orange;
        } else {
            confusionMetric.style.backgroundColor = draculaColors.green;
        }
    }

    // Initialize and then pole repeatedly every 5 seconds to pseudo-live-stream logs
    fetchAnalytics();
    setInterval(fetchAnalytics, 5000);
});
