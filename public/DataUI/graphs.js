import { setScene, onSceneChange, getDepth } from '../scripts/main.js';

var activeGraph = 0;

Chart.defaults.global.defaultFontColor = "#eafffe";
Chart.defaults.global.defaultFontSize = 13;

function blackout(f) {
    document.getElementById("blackout").classList.add("shade");
    setTimeout(f, 250);
    setTimeout(unblack, 500);
}

function unblack() {
    document.getElementById("blackout").classList.remove("shade");
}

function afterFlip(el, cb) {
    let done = false;
    const onEnd = (event) => {
        if (event.propertyName !== "transform") return;
        done = true;
        el.removeEventListener("transitionend", onEnd);
        cb();
    };
    el.addEventListener("transitionend", onEnd);
    // Fallback in case the transition never fires (e.g. reduced-motion settings)
    setTimeout(() => {
        if (!done) {
            el.removeEventListener("transitionend", onEnd);
            cb();
        }
    }, 400);
}

const correctGraphs = new Set(["1", "4", "5", "7"])

function select() {
    blackout(() => setScene(8 + activeGraph / 10));

    document.querySelectorAll(".container div").forEach(container => {
        const selectedGraph = document.querySelector(".container .gridContainer div.select")
        if (selectedGraph && selectedGraph !== container) {
            return
        }
        const isCorrect = correctGraphs.has(container.dataset.graph)

        container.classList.toggle("is-correct", isCorrect)
        container.classList.toggle("is-incorrect", !isCorrect)
    })

    document.querySelectorAll(".container").forEach(container => {
        container.classList.add("deselect");
    });

    document.querySelectorAll(".select").forEach(item => {
        item.classList.remove("select");
    });
}

window.select = select

// FLIP helper: animates a card's position/size change via transform only,
// so the canvas buffer is never resized mid-transition (see setupGraphButtons).
function flip(el, mutate) {
    const first = el.getBoundingClientRect();
    mutate();
    const last = el.getBoundingClientRect();

    const dx = (first.left + first.width / 2) - (last.left + last.width / 2);
    const dy = (first.top + first.height / 2) - (last.top + last.height / 2);
    const sx = first.width / last.width;
    const sy = first.height / last.height;

    el.style.transition = "none";
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    el.getBoundingClientRect(); // force reflow so the browser registers the start state

    requestAnimationFrame(() => {
        el.style.transition = "";
        el.style.transform = ""; // falls back to the CSS class's transform (the real end state)
    });
}

function setupGraphButtons() {
    // Find every graph card and prepare it to receive mouse or keyboard input.

    const outCont = document.querySelector(".container")
    outCont.classList.add("deselect")

    document.querySelectorAll(".gridContainer > div").forEach(container => {
        const graphId = container.dataset.graph;

        const openGraph = () => {
            if (container.classList.contains("select")) return;
            if (document.querySelector(".gridContainer div.select")) return;

            activeGraph = graphId;

            flip(container, () => {
                container.classList.add("select");
                outCont.classList.remove("deselect");
            });

            afterFlip(container, () => chartInstances[graphId]?.resize());
        };

        const closeGraph = () => {
            flip(container, () => {
                container.classList.remove("select");
                outCont.classList.add("deselect");
            });

            afterFlip(container, () => chartInstances[graphId]?.resize());
        };

        // Select the graph when the card is clicked.
        container.addEventListener("click", openGraph)
        // Support Enter and Space for keyboard users.
        container.addEventListener("keydown", event => {
            if (event.key === " " || event.key === "Enter") {
                event.preventDefault()
                openGraph()
            }
        })

        // X button to close, instead of clicking the graph again.
        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "chart-close-btn";
        closeBtn.setAttribute("aria-label", "Close graph");
        closeBtn.textContent = "\u2715";
        closeBtn.addEventListener("click", event => {
            event.stopPropagation();
            closeGraph();
        });
        container.appendChild(closeBtn);
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
            return rows
        })
        .catch(error => {
            console.error(error);
        });

}


function startGraph(offsetT, offsetS, name, yValues, temperature, salinity, size) {
    var index = 1

    var temperaturePoints = yValues.slice(0, size).map((yValue, index) => ({
        x: temperature[index] + offsetT,
        y: yValue //coordinates for temp
    }))
    var salinityPoints = yValues.slice(0, size).map((yValue, index) => ({
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
                    gridLines: {
                        color: "rgba(255,255,255,0.15)",
                        zeroLineColor: "rgba(255,255,255,0.4)"
                    },
                    ticks: {
                        fontSize: 12,
                        maxTicksLimit: 6,
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
                    gridLines: {
                        color: "rgba(255,255,255,0.15)",
                        zeroLineColor: "rgba(255,255,255,0.4)"
                    },
                    ticks: {
                        fontSize: 12,
                        maxTicksLimit: 6,
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
                    gridLines: {
                        color: "rgba(255,255,255,0.15)",
                        zeroLineColor: "rgba(255,255,255,0.4)"
                    },
                    ticks: {
                        fontSize: 12,
                        reverse: true,
                        maxTicksLimit: 8
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
    var callsR = Math.floor(size / 5)
    var callsT = 595 / 5
    var callN = 0

    const interval = setInterval(function () {
        //jump by 5
        //size divided by 5
        //number of calls required
        //total number of calls full
        //number the calls if number of call + number of calls required = total number of calls
        //set run flag to be true

        callN += 1
        if (callsR + callN >= callsT) {
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

    return CTD
}

const chartInstances = {};

function draw(data) {
    const yValues = []
    const temperature = []
    const salinity = []
    for (let i = 1; i < data.length; i++) {
        if (data[i].length < 3 || !data[i][0]) continue
        yValues.push(Number(data[i][0]))
        temperature.push(Number(data[i][1]) + 3)
        salinity.push(Number(data[i][2].replace(/\r/, "")))
    }

    chartInstances["1"] = startGraph(0, 0, "myChart", yValues, temperature, salinity, 309) //real Lophelia pertusa Original Data (depth 675)
    chartInstances["2"] = startGraph(3, 0, "myChart2", yValues, temperature, salinity, 522) //depth 1201
    chartInstances["3"] = startGraph(0, 0.5, "myChart3", yValues, temperature, salinity, 444) //plausible dud (depth 1017)
    chartInstances["4"] = startGraph(-1, 0.2, "myChart4", yValues, temperature, salinity, 371) //real Lophelia pertusa  (depth 835)
    chartInstances["5"] = startGraph(-3, -0.8, "myChart5", yValues, temperature, salinity, 266) //real Enallopsammia rostrata (depth 578)
    chartInstances["6"] = startGraph(-2, 0.4, "myChart6", yValues, temperature, salinity, 245) //plausible dud (depth 501)
    chartInstances["7"] = startGraph(-5, -0.9, "myChart7", yValues, temperature, salinity, 338) //real Enallopsammia rostrata (depth 738)
    chartInstances["8"] = startGraph(-2, 0.4, "myChart8", yValues, temperature, salinity, 595) //depth 1381

}

export function main() {

    parsing().then(data => {
        draw(data)
    })
}

//main()