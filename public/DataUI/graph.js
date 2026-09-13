import { backgroundBlurriness } from "three/tsl"

console.log("before any variables")
let CTD
var tempMaximum 
var tempMinimum

var tempGrad
var tempIntercept
var salGrad
var salIntercept
var widths = [2,4]
var index = 0
const xValues = [] //depth coordinate
const temperature = [] //temp data
const salinity = [] //salinity data
var temperaturePoints
var salinityPoints


console.log("before any functions")
function parsing(){
  return fetch("./DataUI/Dataset2.csv")
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

// function pulse(){
//   if (CTD){
//     console.log("Testing testing")
//     const depth = CTD.data.datasets[2]
//     depth.borderWidth = widths[index]
//     index = (index+1)%2
//     console.log(index)
    
//     CTD.update()
//   }
// }


// function updateGraph(pDepth){
//   // var inputVal = document.getElementById('depth').value;

//   if (CTD){
//     const depth = CTD.data.datasets[2]
//     depth.data = [
//           {y: xValues[pDepth], x: tempMinimum},
//           {y: xValues[pDepth], x: tempMaximum}
//         ]
//   }
//   CTD.update();

// }

// function drawTherm(index){
//   //console.log("started drawing the rectangle")
//   ctx.clearRect(0,0,canvas.width,canvas.height)
//   ctx.beginPath()
//   ctx.fillStyle = "red" 
//   // console.log("height and width")
//   // console.log(canvas.height,canvas.width)
//   const para = document.createElement("p");
//   const node = document.createTextNode("testing testing");
//   para.appendChild(node);

//   let currentTemp = tempGrad*temperature[Math.floor(index)] + tempIntercept
//   let currentSalinity = salGrad*salinity[Math.floor(index)] + salIntercept

//   ctx.fillRect(2,72-currentTemp,15,currentTemp)
//   ctx.fillStyle = "#53FF1F"
//   ctx.fillRect(32,82.25-currentSalinity,15,currentSalinity)
//   ctx.drawImage(tempMeter,0,0)
//   ctx.drawImage(salMeter,30,0)
//   // tempMeterr.onload = function(){
//   //   ctx.drawImage(tempMeter,0,0)
//   // }

  
//   ctx.stroke()
  
// }

// function animateGraph(){
//   if (CTD){
//     // console.log("testing")
//     // console.log(animationIndex)
//     // //CTD.data.datasets[0].data = temperaturePoints.slice(0,20+animationIndex)
//     // //CTD.data.datasets[1].data = salinityPoints.slice(0,20+animationIndex)
//     // animationIndex = animationIndex+1
//     // CTD.update()
//   }
// }

function startGraph(){
  console.log("test")
  parsing().then(data => {
    console.log("test")
    for(let i = 0; i < data.length; i++){

      xValues.push(Number(data[i][0])) 
      temperature.push(Number(data[i][1]))
      salinity.push(Number(data[i][2]))
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
    salinityMaximum = Math.max(...salinity)
    salinityMinimum = Math.min(...salinity)

    salGrad = 50
    salIntercept = -1742.75

    tempMinimum = Math.min(...temperature)
    tempMaximum = Math.max(...temperature)
    tempGrad = 100/(30)
    tempIntercept = -28

    console.log(xValues)

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
          borderColor: "red",
          fill: false,
          lineTension: 0
        },{
          label: "Salinity",
          xAxisID: "x-salinity",
          data: salinityPoints,
          borderColor: "#53FF1F",
          fill: false,
          lineTension: 0
        }]
      },
      options: {
        tooltips: { enabled: true },
      
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: true,
          //color:"black",
          
          labels: {
            fontColor:"white",
            filter: (legendItem) => legendItem.datasetIndex !== 2
          }
        },
        scales: {
          xAxes: [{ //two different x axis scales for temp and salinity display set to false as a design choice
            display: true,
            id: "x-temperature",
            type: "linear",
            min:10.9,
            max:495.6,
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
  });
  
  //var timer = setInterval(pulse,800)
  //setInterval(animateGraph,100)
  
}

console.log("testing testing testing")
startGraph()
//startGraph();