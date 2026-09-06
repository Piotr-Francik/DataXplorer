var temperaturePoints
var salinityPoints


function parsing(){
  console.log("before running")
  return fetch("./Data2.csv")
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

parsing().then(data => {
  const yValues = []
  const temperature = []
  const salinity = []

  for(let i = 1; i < data.length; i++){
    if (data[i].length < 3 || !data[i][0]) continue
    yValues.push(Number(data[i][0]))
    temperature.push(Number(data[i][1]))
    salinity.push(Number(data[i][2].replace(/\r/,"")))
  }

temperaturePoints = yValues.map((yValue, index) => ({
    x: temperature[index],
    y: yValue //coordinates for temp
}))
salinityPoints = yValues.map((yValue, index) => ({
    x: salinity[index],
    y: yValue//coordinates for salinity
}))

var salinityMaximum = Math.max(...salinity)
var salinityMinimum = Math.min(...salinity)


var tempMinimum = Math.min(...temperature)
var tempMaximum = Math.max(...temperature)

console.log(yValues)
console.log(salinity)

new Chart("myChart", {
type: "line",
    data: {
    labels: yValues,
    datasets: [{
        label: "temperature",
        data: temperaturePoints,
        borderColor: "red",
        xAxisID: "x-temperature",
        fill: false,
        lineTension: 0
    },{
        label: "Salinity",
        data: salinityPoints,
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
        display: true,
        //color:"black",
        
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


parsing().then(data => {
  const yValues = []
  const temperature = []
  const salinity = []

  for(let i = 1; i < data.length; i++){
    if (data[i].length < 3 || !data[i][0]) continue
    yValues.push(Number(data[i][0]))
    temperature.push(Number(data[i][1])+3)
    salinity.push(Number(data[i][2].replace(/\r/,"")))
  }

temperaturePoints = yValues.map((yValue, index) => ({
    x: temperature[index],
    y: yValue //coordinates for temp
}))
salinityPoints = yValues.map((yValue, index) => ({
    x: salinity[index],
    y: yValue//coordinates for salinity
}))

var salinityMaximum = Math.max(...salinity)
var salinityMinimum = Math.min(...salinity)


var tempMinimum = Math.min(...temperature)
var tempMaximum = Math.max(...temperature)

console.log(yValues)
console.log(salinity)

new Chart("myChart2", {
type: "line",
    data: {
    labels: yValues,
    datasets: [{
        label: "temperature",
        data: temperaturePoints,
        borderColor: "red",
        xAxisID: "x-temperature",
        fill: false,
        lineTension: 0
    },{
        label: "Salinity",
        data: salinityPoints,
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
        display: true,
        //color:"black",
        
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


