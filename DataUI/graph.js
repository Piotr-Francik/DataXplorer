currentDepth = 40
let CTD
var yMaximum 
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

function setValue(){
  console.log("set Value triggered")
  var inputVal = document.getElementById('depth').value;
  console.log(inputVal)
  currentDepth = inputVal
  if (CTD){
    const depth = CTD.data.datasets[2]
    depth.data = [
          {x: currentDepth, y: 0},
          {x: currentDepth, y: yMaximum}
        ]
  }
  CTD.update();

}


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
    x: xValue,
    y: tempurature[index] //coordinates for temp
  }))
  const salinityPoints = xValues.map((xValue, index) => ({
    x: xValue,
    y: salinity[index] //coordinates for salinity
  }))
  const yValues = tempurature.concat(salinity)
  //const currentDepth = currentDepth
  const yMinimum = Math.min(...yValues)
  yMaximum = Math.max(...yValues)

  CTD = new Chart("myChart", {
    type: "line",
    data: {
      labels: xValues,
      datasets: [{
        label: "Tempurature",
        data: temperaturePoints,
        borderColor: "red",
        fill: false,
        lineTension: 0
      },{
        label: "Salinity",
        data: salinityPoints,
        borderColor: "green",
        fill: false,
        lineTension: 0
      },{

        label: "Current",
        data: [
          {x: currentDepth, y: yMinimum},
          {x: currentDepth, y: yMaximum}
        ],
        borderColor: "blue",
        borderDash: [6, 4],
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
          type: "linear",
          ticks: {
            stepSize: 5
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

