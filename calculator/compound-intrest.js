const form = document.querySelector('form');
const chart = document.getElementById('chart');

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const principal = Number(document.getElementById('principal').value);
    const interestRate = Number(document.getElementById('interestRate').value);
    const duration = Number(document.getElementById('duration').value);

    const compoundInterest = calculateCompoundInterest(principal, interestRate, duration);
    updateChart(compoundInterest);
});

function calculateCompoundInterest(principal, interestRate, duration) {
    const numberOfCompounds = 12;
    const ratePerCompound = interestRate / numberOfCompounds;
    const numberOfCompoundsTotal = numberOfCompounds * duration;
    let balance = principal;

    const dataPoints = [];

    for (let i = 0; i < numberOfCompoundsTotal; i++) {
        const interest = balance * ratePerCompound / 100;
        balance += interest;
        dataPoints.push(balance);
    }

    return dataPoints;
}

function updateChart(dataPoints) {
    const chartData = {
        labels: Array.from({ length: dataPoints.length }, (_, i) => i + 1),
        datasets: [{
            label: 'Compound Interest',
            data: dataPoints,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4
        }]
    };

    const chartOptions = {
        responsive: true,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            title: {
                display: true,
                text: 'Compound Interest Growth Over Time'
            },
            legend: {
                display: false
            }
        }
    };

    new Chart(chart, {
        type: 'line',
        data: chartData,
        options: chartOptions
    });
}

