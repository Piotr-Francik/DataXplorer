currentDepth = 40
let CTD
var yMaximum 
var yMinimum
var widths = [2,4]
var index = 0
const xValues = [] //depth coordinate
const tempurature = [] //temp data
const salinity = [] //salinity data

function parsing(){
  console.log("before running")
  return fetch("./1974Data.csv")
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
  
  console.log("after running")
}

function pulse(){
  if (CTD){
    const depth = CTD.data.datasets[2]
    depth.borderWidth = widths[index]
    index = (index+1)%2
    CTD.update()
  }
}


function setValue(){
  console.log("set Value triggered")
  var inputVal = document.getElementById('depth').value;
  console.log(inputVal)
  currentDepth = inputVal
  if (CTD){
    const depth = CTD.data.datasets[2]
    depth.data = [
          {y: currentDepth, x: yMinimum},
          {y: currentDepth, x: yMaximum}
        ]
  }
  CTD.update();

}

console.log("starting")
parsing().then(data => {


  for(let i = 0; i < data.length; i++){
    if (data[i].length < 4 || data[i][1] === "") {
      continue
    }

    xValues.push(Number(data[i][1])) 
    tempurature.push(Number(data[i][2]))
    salinity.push(Number(data[i][3]))
    //parsing data into our 2d arrays
  }

  const temperaturePoints = xValues.map((xValue, index) => ({
    x: tempurature[index],
    y: xValue //coordinates for temp
  }))
  const salinityPoints = xValues.map((xValue, index) => ({
    x: salinity[index],
    y: xValue//coordinates for salinity
  }))
  
  //const currentDepth = currentDepth
  yMinimum = Math.min(...tempurature)
  yMaximum = Math.max(...tempurature)

  CTD = new Chart("myChart", {
    // rotate:90,
    type: "line",
    data: {
      //labels: tempurature,
      yAxisID: "y",
      datasets: [{
        label: "Tempurature",
        xAxisID: "x-temperature",
        data: temperaturePoints,
        borderColor: "blue",
        fill: false,
        lineTension: 0
      },{
        label: "Salinity",
        xAxisID: "x-salinity",
        data: salinityPoints,
        borderColor: "green",
        fill: false,
        lineTension: 0
      },{

        xAxisID: "x-temperature",
        data: [
          {y: currentDepth, x: yMinimum},
          {y: currentDepth, x: yMaximum}
        ],
        borderColor: "red",
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        lineTension: 0
        
      }]
    },
    options: {
      legend: {display: true},
      scales: {
        xAxes: [{
          id: "x-temperature",
          type: "linear",
          position: "bottom",
          scaleLabel: {
            display: true,
            labelString: "Temperature"
          },
          ticks: {
            stepSize: 5
          }
        }, {
          id: "x-salinity",
          type: "linear",
          position: "top",
          scaleLabel: {
            display: true,
            labelString: "Salinity"
          },
          ticks: {
            stepSize: 1
          }
        }],
        yAxes: [{
          id: "y",
          type: "linear",
          scaleLabel: {
            display: true,
            labelString: "Depth"
          },
          ticks: {
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

