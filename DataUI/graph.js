import { backgroundBlurriness } from "three/tsl"

const canvas = document.getElementById("bars");
const ctx = canvas.getContext("2d");export let currentDepth = 40
export let CTD
export var yMaximum 
export var yMinimum
var gradient
var yIntercept
export var widths = [2,4]
export var index = 0
export const xValues = [] //depth coordinate
export const temperature = [] //temp data
export const salinity = [] //salinity data
export var temperaturePoints
export var salinityPoints


function parsing(){
  return fetch("./DataUI/1974Data.csv")
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
      console.log(rows)
      return rows
    })
    .catch(error => {
      console.error(error);
    });
  
}

function pulse(){
  if (CTD){
    const depth = CTD.data.datasets[2]
    depth.borderWidth = widths[index]
    index = (index+1)%2
    CTD.update()
  }
}


export function updateGraph(depth){
  // var inputVal = document.getElementById('depth').value;
  currentDepth = depth
  if (CTD){
    const depth = CTD.data.datasets[2]
    depth.data = [
          {y: currentDepth, x: yMinimum},
          {y: currentDepth, x: yMaximum}
        ]
  }
  CTD.update();

}

export function drawTherm(index){
  //console.log("started drawing the rectangle")
  ctx.clearRect(0,0,canvas.width,canvas.height)
  ctx.beginPath()
  console.log("height and width")
  console.log(canvas.height,canvas.width)
  let currentTemp = gradient*temperature[Math.floor(index)] + yIntercept
  ctx.rect(0,100-currentTemp,20,currentTemp)
  ctx.stroke()
  
}

export function startGraph(){
  parsing().then(data => {


    for(let i = 0; i < data.length; i++){
      if (data[i].length < 4 || data[i][1] === "") {
        continue
      }

      xValues.push(Number(data[i][1])) 
      temperature.push(Number(data[i][2]))
      salinity.push(Number(data[i][3]))
      //parsing data into our 2d arrays
    }


    temperaturePoints = xValues.map((xValue, index) => ({
      x: temperature[index],
      y: xValue //coordinates for temp
    }))
    salinityPoints = xValues.map((xValue, index) => ({
      x: salinity[index],
      y: xValue//coordinates for salinity
    }))
    
    //const currentDepth = currentDepth
    yMinimum = Math.min(...temperature)
    yMaximum = Math.max(...temperature)
    console.log(yMaximum)
    gradient = 90/(yMaximum-yMinimum)
    yIntercept = 10-(yMinimum*gradient)
    CTD = new Chart("myChart", {
      // rotate:90,
      type: "line",
      data: {
        //labels: temperature,
        yAxisID: "y",
        datasets: [{
          label: "temperature",
          xAxisID: "x-temperature",
          data: temperaturePoints,
          borderColor: "#481FFF",
          fill: false,
          lineTension: 0
        },{
          label: "Salinity",
          xAxisID: "x-salinity",
          data: salinityPoints,
          borderColor: "#53FF1F",
          fill: false,
          lineTension: 0
        },{

          xAxisID: "x-temperature", //line to display depth
          data: [
            {y: currentDepth, x: yMinimum},
            {y: currentDepth, x: yMaximum}
          ],
          borderColor: "red",
          borderWidth: 2,
          //pointRadius: 2,
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
          display: true,
          //color:"black",
          
          labels: {
            fontColor:"black",
            filter: (legendItem) => legendItem.datasetIndex !== 2
          }
        },
        scales: {
          xAxes: [{ //two different x axis scales for temp and salinity display set to false as a design choice
            display: false,
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
            display: false,
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
            display: false,
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
  });
  
  var timer = setInterval(pulse,800)
}

//startGraph();