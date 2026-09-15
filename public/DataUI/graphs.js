import { setScene, onSceneChange, getDepth } from '../../main.js';

function blackout(f) {
    document.getElementById("blackout").classList.add("shade");
    setTimeout(f, 250);
    setTimeout(unblack, 500);
}

function unblack() {
    document.getElementById("blackout").classList.remove("shade");
}

const correctGraphs = new Set(["1", "4", "5", "7"])

function setupGraphButtons() {
    document.querySelectorAll(".chartContainer").forEach(container => {
        const selectGraph = () => {
            console.log(container.dataset.graph);
            //blackout(() => setScene(8 + container.dataset.graph / 10));
            const isCorrect = correctGraphs.has(container.dataset.graph)
            container.classList.toggle("select", true)
            //container.classList.toggle("is-correct", isCorrect)
            //container.classList.toggle("is-incorrect", !isCorrect)
        }

        container.addEventListener("click", selectGraph)
        container.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                selectGraph()
            }
        })
    })
}

setupGraphButtons()


async function parsing() {
    return fetch("./DataUI/Data2.csv")
        .then(response => {
            if (!response.ok) {
                throw new Error(`Could not load CSV: ${response.status} ${response.statusText}`);
            }
            return response.text();
        })
        .then(csvText => {
            const rows = csvText.split("\n")
            for (let i = 0; i < rows.length; i++) {
                rows[i] = rows[i].split(",")
            }
            //console.log(rows)
            return rows
        })
        .catch(error => {
            console.error(error);
        });

}


function startGraph(offsetT, offsetS, name, yValues, temperature, salinity, size) {
    var index = 1

    var temperaturePoints = yValues.slice(0,size).map((yValue, index) => ({
        x: temperature[index] + offsetT,
        y: yValue //coordinates for temp
    }))
    var salinityPoints = yValues.slice(0,size).map((yValue, index) => ({
        x: salinity[index] + offsetS,
        y: yValue//coordinates for salinity
    }))
    const length = temperaturePoints.length

    var CTD = new Chart(name, {
        type: "line",
        data: {
            labels: yValues,
            datasets: [{
                label: "temperature",
                data: temperaturePoints.slice(-index, temperaturePoints.length),
                borderColor: "red",
                xAxisID: "x-temperature",
                fill: false,
                lineTension: 0
            }, {
                label: "Salinity",
                data: salinityPoints.slice(-index, salinityPoints.length),
                xAxisID: "x-salinity",
                borderColor: "#53FF1F",
                fill: false,
                lineTension: 0
            }]
        },
        options: {
            tooltips: { enabled: false },
            hover: { mode: null },
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                display: false,

                labels: {
                    fontColor: "black",
                    filter: (legendItem) => legendItem.datasetIndex !== 2
                }
            },
            scales: {
                xAxes: [{ //two different x axis scales for temp and salinity display set to false as a design choice
                    display: true,
                    id: "x-temperature",
                    type: "linear",

                    position: "bottom",
                    scaleLabel: {
                        display: true,
                        labelString: "Temperature"
                    },
                    ticks: {
                        fontSize: 10,
                        stepSize: 5
                    }
                }, {
                    display: true,
                    id: "x-salinity",
                    type: "linear",
                    position: "top",
                    scaleLabel: {
                        display: true,
                        labelString: "Salinity"
                    },
                    ticks: {
                        fontSize: 10,
                        stepSize: 1
                    }
                }],
                yAxes: [{
                    display: true,
                    id: "y",
                    type: "linear",
                    scaleLabel: {
                        display: true,
                        labelString: "Depth"
                    },
                    ticks: {
                        fontSize: 10,
                        reverse: true
                    }
                }]
            },
            elements: {
                point: {
                    radius: 0,
                    hitRadius: 10,
                }
            }
        }
    });

    var run = false 
    var callsR = Math.floor(size/5)
    var callsT = 595/5
    var callN = 0

    const interval = setInterval(function(){
        //jump by 5
        //size divided by 5
        //number of calls required
        //total number of calls full
        //number the calls if number of call + number of calls required = total number of calls
        //set run flag to be true

        callN += 1
        if (callsR+callN >= callsT){
            run = true
        }

        if (CTD && run) {
            var currentData = CTD.data.datasets[0].data
            CTD.data.datasets[0].data = temperaturePoints.slice(Math.min(0, -(currentData.length + 6)), length)
            CTD.data.datasets[1].data = salinityPoints.slice(Math.min(0, -(currentData.length + 6)), length)
            CTD.update()
            if (currentData.length >= length) {
                clearInterval(interval)
            }
        }
    }, 200)
}

function draw(data) {
    const yValues = []
    const temperature = []
    const salinity = []
    console.log(data)
    for (let i = 1; i < data.length; i++) {
        if (data[i].length < 3 || !data[i][0]) continue
        yValues.push(Number(data[i][0]))
        temperature.push(Number(data[i][1]) + 3)
        salinity.push(Number(data[i][2].replace(/\r/, "")))
    }

    startGraph(0,0,"myChart",yValues,temperature,salinity,309) //real Lophelia pertusa Original Data (depth 675)
    startGraph(3,0,"myChart2",yValues,temperature,salinity,522) //depth 1201
    startGraph(0,0.5,"myChart3",yValues,temperature,salinity,444) //plausible dud (depth 1017)
    startGraph(-1,0.2,"myChart4",yValues,temperature,salinity,371) //real Lophelia pertusa  (depth 835)
    startGraph(-3,-0.8,"myChart5",yValues,temperature,salinity,266) //real Enallopsammia rostrata (depth 578)
    startGraph(-2,0.4,"myChart6",yValues,temperature,salinity,245) //plausible dud (depth 501)
    startGraph(-5,-0.9,"myChart7",yValues,temperature,salinity,338) //real Enallopsammia rostrata (depth 738)
    startGraph(-2,0.4,"myChart8",yValues,temperature,salinity,595) //depth 1381

}

export function main() {

    parsing().then(data => {
        draw(data)
    })
}

//main()