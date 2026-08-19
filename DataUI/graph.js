
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

parsing().then(data => {
  const xValues = []
  const tempurature = []
  const salinity = []

  for(let i = 0; i < data.length; i++){
    xValues[i] = data[i][1]
    tempurature[i] = data[i][2]
    salinity[i] = data[i][3]
  }

  new Chart("myChart", {
    type: "line",
    data: {
      labels: xValues,
      datasets: [{
        data: tempurature,
        borderColor: "red",
        fill: false
      },{
        data: salinity,
        borderColor: "green",
        fill: false
      }]
    },
    options: {
      legend: {display: false}
    }
  });
});

