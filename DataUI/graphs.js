

const correctGraphs = new Set(["1", "5"])

function setupGraphButtons(){
    document.querySelectorAll(".chartContainer").forEach(container => {
        const selectGraph = () => {
            const isCorrect = correctGraphs.has(container.dataset.graph)
            container.classList.toggle("is-correct", isCorrect)
            container.classList.toggle("is-incorrect", !isCorrect)
            container.setAttribute("aria-pressed", "true")
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



async function parsing(){
  console.log("before running")
  return fetch("./DataUI/Data2.csv")
    .then(response => {
      if (!response.ok) {
        throw new Error(`Could not load CSV: ${response.status} ${response.statusText}`);
      }
      return response.text();
    })
    .then(csvText =>{
      const rows = csvText.split("\n")
      for(let i = 0; i < rows.length; i++){
        rows[i] = rows[i].split(",")
      }
      //console.log(rows)
      return rows
    })
    .catch(error => {
      console.error(error);
    });
  
}

function animateGraph(pName,index,length,pTemp,pSal){
    if (pName){
  
        var currentData = pName.data.datasets[0].data
        pName.data.datasets[0].data = pTemp.slice(Math.min(0,-(currentData.length+2)),pTemp.length)
        pName.data.datasets[1].data = pSal.slice(Math.min(0,-(currentData.length+2)),pSal.length)
        index = index+8
        pName.update()
    }
    return index
}

function startGraph(offsetT,offsetS,name,yValues,temperature,salinity){
    var index = 80
    
    var temperaturePoints = yValues.map((yValue, index) => ({
        x: temperature[index]+offsetT,
        y: yValue //coordinates for temp
    }))
    var salinityPoints = yValues.map((yValue, index) => ({
        x: salinity[index]+offsetS,
        y: yValue//coordinates for salinity
    }))

    var CTD = new Chart(name, {
    type: "line",
        data: {
        labels: yValues,
        datasets: [{
            label: "temperature",
            data: temperaturePoints.slice(-index,temperaturePoints.length),
            borderColor: "red",
            xAxisID: "x-temperature",
            fill: false,
            lineTension: 0
        },{
            label: "Salinity",
            data: salinityPoints.slice(-index,salinityPoints.length),
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
            fontColor:"black",
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
    index = setInterval(animateGraph, 10,CTD,index,temperaturePoints.length,temperaturePoints, salinityPoints)

}

function draw(data){
    const yValues = []
    const temperature = []
    const salinity = []
    console.log(data)
    for(let i = 1; i < data.length; i++){
        if (data[i].length < 3 || !data[i][0]) continue
            yValues.push(Number(data[i][0]))
            temperature.push(Number(data[i][1])+3)
            salinity.push(Number(data[i][2].replace(/\r/,"")))
    }

    startGraph(0,0,"myChart",yValues,temperature,salinity) //real Lophelia pertusa
    startGraph(3,0,"myChart2",yValues,temperature,salinity)
    startGraph(0,0.5,"myChart3",yValues,temperature,salinity)
    startGraph(3,0.5,"myChart4",yValues,temperature,salinity)
    startGraph(-3,-0.8,"myChart5",yValues,temperature,salinity) //real Enallopsammia rostrata
    startGraph(-2,0.4,"myChart6",yValues,temperature,salinity)
    startGraph(-3,-0.8,"myChart7",yValues,temperature,salinity) 
    startGraph(-2,0.4,"myChart8",yValues,temperature,salinity)

}

export function main(){

    parsing().then(data =>{
        draw(data)
    })
}

//main()