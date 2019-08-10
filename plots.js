mongoEndpoint = "https://webhooks.mongodb-stitch.com/api/client/v2.0/app/devapp-cmeay/service/bootcamp/incoming_webhook/dataframe3";
const dataframe2Endpoint = "https://webhooks.mongodb-stitch.com/api/client/v2.0/app/devapp-cmeay/service/bootcamp/incoming_webhook/custom";
// 
function getColor11(v) {
    return v > 10 ? '#95e386' :
        v > 9 ? '#589662' :
            v > 8 ? '#345e62' :
                v > 7 ? '#83d077' :
                    v > 6 ? '#73bd6c' :
                        v > 5 ? '#4c8360' :
                            v > 4 ? '#244c65' :
                                v > 3 ? '#aaf59a' :
                                    v > 2 ? '#65aa65' :
                                        v > 1 ? '#417060' :
                                            "#003a69";

}
function getColor20(v) {
    return v > 19 ? '#003a69' :
        v > 18 ? '#366062' :
            v > 17 ? '#4f8760' :
                v > 16 ? '#71ba6b' :
                    v > 15 ? '#' :
                        v > 14 ? '#184367' :
                            v > 13 ? '#3c6961' :
                                v > 12 ? '#559161' :
                                    v > 11 ? '#79c470' :
                                        v > 10 ? '#94e285' :
                                            v > 9 ? '#254d65' :
                                                v > 8 ? '#437360' :
                                                    v > 7 ? '#5b9b62' :
                                                        v > 6 ? '#81ce75' :
                                                            v > 5 ? '#9fec8e' :
                                                                v > 4 ? '#2e5663' :
                                                                    v > 3 ? '#497d60' :
                                                                        v > 2 ? '#69b067' :
                                                                            v > 1 ? '#8bd87c' :
                                                                                "#aaf59a";
}

var myChart = undefined;
const buildDuracionMediodeTransporte = async (start, end) => {
    postParams = {
        pipeline: [
            {
                '$group': {
                    '_id': '$medio_principal',
                    'duracion_promedio': { '$avg': '$duracion_viaje (min)' },
                    'total_viajes': { '$sum': 1 }
                }
            },
            {
                '$sort': {
                    'duracion_promedio': -1
                }
            }
        ]
    };

    if (start !== 'All') {
        postParams.pipeline.unshift({
            $match: {}
        })
        postParams.pipeline[0].$match["distrito_origen"] = start;
    }

    res = await fetch(mongoEndpoint, {
        method: 'POST',
        body: JSON.stringify(postParams),
        headers: {
            'Content-Type': 'application/json'
        }
    })

    response = await res.json()

    let ids = [];
    response.map((item) => { ids.push(item._id) })
    // let y = [];
    // response.map((item) => { y.push(item.duracion_promedio.$numberDouble) })
    // let r = [];
    // response.map((item) => { r.push(item.total_viajes.$numberInt / 2000) })

    let data = {
        labels: "labels_",
        datasets: []
    };
    response.map((item, i) => {
        data.datasets.push({
            label: [
                item._id
            ],
            backgroundColor: getColor20(i),
            borderColor: "darkblue",
            data: [
                {
                    x: i,
                    y: parseFloat(item.duracion_promedio.$numberDouble),
                    // r: item.total_viajes.$numberInt /2000
                    r: (45 * (item.total_viajes.$numberInt - 126) / 161200) + 1
                }
            ]
        })
    })
    let options = {
        responsive: true,
        title: {
            display: true,
            text: 'Duración de viajes por medio de transporte'
        },
        layout: {
            padding: {
                left: 20,
                right: 20,
                top: 20,
                bottom: 20
            }
        },
        legend: {
            display: true,
            position: 'right'
        },
        scales: {
            gridLines: { display: true },
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Duración (min)'
                }
            }],
            xAxes: [{
                ticks: {
                    stepSize: 1,
                    display: true,
                    major: { enabled: true },
                    minor: { enabled: true },
                    maxRotation: 90,
                    minRotation: 90,
                    callback: function (value, index, values) {
                        return ids[parseInt(value)];
                    }
                }
            }]
        }
    }

    // ctxContainer = $("#bubbleChartContainer")
    // ctxContainer.empty();
    // ctxElement = $("<canvas id='bubbleChart' width='400' height='200'></canvas>");
    // ctxContainer.append(ctxElement);
    ctx = $("#bubbleChart")
    var myChart = new Chart(ctx, {
        type: 'bubble',
        data: data,
        options: options,

    });
}
buildDuracionMediodeTransporte('All', 'All');


const buildHistogramaDuracion = (start, end) => {
    postParams = {
        pipeline: [
            {
                '$project': {
                    'duracion_viaje (hour)': {
                        '$trunc': {
                            '$divide': [
                                '$duracion_viaje (min)', 60
                            ]
                        }
                    }
                }
            }, {
                '$group': {
                    '_id': '$duracion_viaje (hour)',
                    'count': {
                        '$sum': 1
                    }
                }
            }, {
                '$sort': {
                    '_id': 1
                }
            }
        ]
    }

    if (start !== 'All') {
        postParams.pipeline.unshift({
            $match: {}
        })
        postParams.pipeline[0].$match["distrito_origen"] = start;
    }

    fetch(mongoEndpoint, {
        method: 'POST',
        body: JSON.stringify(postParams),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(async (res) => {
        response = await res.json()

        let x = [];
        response.map((item) => { x.push(item._id.$numberDouble) })
        let y = [];
        response.map((item) => { y.push(item.count.$numberInt) })



        let data = {
            // labels: "labels_",
            datasets: []
        };
        response.map((item, i) => {

            data.datasets.push({
                label: [
                    item._id
                ],
                backgroundColor: "#1c2853",
                borderColor: "darkblue",
                data: [
                    {
                        x: parseFloat(item._id.$numberDouble),
                        y: parseFloat(item.count.$numberInt),
                    }
                ]

            })

        })




        let options = {
            responsive: true,
            title: {
                display: true,
                text: 'Duración total de los viajes'
            },
            layout: {
                padding: {
                    left: 20,
                    right: 20,
                    top: 20,
                    bottom: 20
                }
            },
            legend: {
                display: false,
                position: 'right'
            },
            scales: {
                gridLines: { display: true },
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Número de viajes'
                    },
                    type: 'logarithmic',
                }],
                xAxes: [{
                    // ticks: {

                    //     display: true,

                    // },


                    scaleLabel: {
                        display: true,
                        labelString: 'Duración (min)'
                    },

                }]
            }
        }

        var ctx = document.getElementById('histogram').getContext('2d');
        var myChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: options,

        });

        // var ctx2 = document.getElementsById("chartjs-gauge").getContext('2d');
        // var myGauge = new Chart(ctx, {
        //     type: 'doughnut',
        //     data: {
        //         labels: ["Duración promedio", ""],
        //         datasets: [{
        //             label: "Gauge",
        //             data: [10, 1200],
        //             backgroundColor: [
        //                 "rgb(255, 99, 132)",
        //                 "rgb(54, 162, 235)",
        //                 "rgb(255, 205, 86)"
        //             ]
        //         }]
        //     },
        //     options: options,

        // });



        // var trace1 = {
        //     x: x,
        //     y: y,
        //     name: 'Número de viajes',
        //     type: 'bar'
        // };

        // var data = [trace1];

        // // var layout = {barmode: 'group'};

        // Plotly.newPlot('plot6', data);


    })
        .catch(error => console.error('Error:', error))
}
buildHistogramaDuracion('All', 'All');


const buildMedioNumViajes = (start, end) => {
    postParams = {
        pipeline: [
            {
                '$group': {
                    '_id': '$medio_principal',
                    'total_viajes': { '$sum': 1 }
                }
            },
            {
                '$sort': {
                    'total_viajes': -1
                }
            }
        ]
    };
    if (start !== 'All') {
        postParams.pipeline.unshift({
            $match: {}
        })
        postParams.pipeline[0].$match["distrito_origen"] = start;
    }

    fetch(mongoEndpoint, {
        method: 'POST',
        body: JSON.stringify(postParams),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(async (res) => {
        response = await res.json()

        let x = [];
        response.map((item) => { x.push(item._id) })
        let y = [];
        response.map((item) => { y.push(item.total_viajes.$numberInt) })


        let data = {
            yLabels: x,
            // labels: "labels_",
            datasets: []
        };
        response.map((item, i) => {
            data.datasets.push({
                label: [
                    item._id
                ],
                pointBackgroundColor: getColor20(i),
                pointBorderColor: "darkblue",
                pointRadius: 10,
                fill: false,
                showLine: false,
                data: [
                    {
                        x: item.total_viajes.$numberInt,
                        y: i
                    }

                    // {
                    //     x: parseInt(item.total_viajes.$numberInt),
                    //     y: item._id,
                    // }
                ]
            })
        })
        let options = {
            responsive: true,
            title: {
                display: true,
                text: 'Viajes por medio de transporte'
            },
            layout: {
                padding: {
                    left: 20,
                    right: 20,
                    top: 20,
                    bottom: 20
                }
            },
            legend: {
                display: false,
                position: 'right'
            },
            scales: {
                gridLines: { display: true },
                yAxes: [{
                    ticks: {
                        stepSize: 1,
                        reverse: true,
                        callback: function (value, index, values) {
                            return x[parseInt(value)];
                        }
                    },

                }],

                xAxes: [{

                    scaleLabel: {
                        display: true,
                        labelString: 'Número de viajes'
                    },

                }]
            }
        }

        var ctx = document.getElementById('dotPlot').getContext('2d');
        var myChart = new Chart(ctx, {
            type: 'scatter',
            data: data,
            options: options,

        });

        // var trace1 = {
        //     x: x,
        //     y: y,
        //     name: 'Número de viajes',
        //     type: 'bar'
        // };

        // var data = [trace1];

        // // var layout = {barmode: 'group'};

        // Plotly.newPlot('plot2', data);

    })
        .catch(error => console.error('Error:', error))
}
buildMedioNumViajes('All', 'All');


const buildViajesHorario = (start, end) => {
    postParams = {
        pipeline: [
            {
                '$group': {
                    '_id': {
                        'proposito': '$proposito',
                        'hora_inicio': '$hora_inicio'
                    },
                    'count': {
                        '$sum': 1
                    }
                }
            },
            {
                '$sort': {
                    '_id.hora_inicio': 1
                }
            }
        ]
    }
    if (start !== 'All') {
        postParams.pipeline.unshift({
            $match: {}
        })
        postParams.pipeline[0].$match["distrito_origen"] = start;
    }

    fetch(mongoEndpoint, {
        method: 'POST',
        body: JSON.stringify(postParams),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(async (res) => {
        response = await res.json()

        const propositos = {}

        response.map((item) => {
            if (propositos[item._id.proposito] !== undefined) {
                propositos[item._id.proposito].x.push(parseInt(item._id.hora_inicio.$numberInt))
                propositos[item._id.proposito].y.push(parseInt(item.count.$numberInt))
            } else {
                propositos[item._id.proposito] = {
                    // data: [item._id.hora_inicio.$numberInt],
                    x: [parseInt(item._id.hora_inicio.$numberInt)],
                    y: [parseInt(item.count.$numberInt)]
                }
            }
        })

        var datasets = [];
        i = 0;
        for (key in propositos) {

            for (hour = 0; hour < 24; hour++) {
                if (propositos[key].x[hour] !== hour) {
                    propositos[key].x.splice(hour, 0, hour)
                    propositos[key].y.splice(hour, 0, 0)
                }
            }

            datasets.push({
                // stack: key,
                label: key,
                backgroundColor: getColor11(i),
                borderColor: "darkblue",
                data: propositos[key].y
            })
            i++;
        }



        let data = {
            labels: propositos[key].x,
            datasets: datasets
        };


        let options = {
            responsive: true,
            title: {
                display: true,
                text: 'Viajes por propósito y horario'
            },
            layout: {
                padding: {
                    left: 20,
                    right: 20,
                    top: 20,
                    bottom: 20
                }
            },
            legend: {
                display: true,
                position: 'right'
            },
            scales: {
                gridLines: { display: true },
                yAxes: [{
                    stacked: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Número de viajes'
                    },
                    // type: 'logarithmic',
                }],
                xAxes: [{
                    stacked: true,
                    ticks: {
                        stepSize: 1,
                        display: true,
                        maxRotation: 0,
                        minRotation: 0,
                        max: 23
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Horario'
                    },

                }]
            }
        }



        // ticks: {
        //     stepSize: 1,
        //     display: true,
        //     major: { enabled: true },
        //     minor: { enabled: true },
        //     maxRotation: 90,
        //     minRotation: 90,



        var ctx = document.getElementById('horarioProposito').getContext('2d');
        var myChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: options,

        });


    })
        .catch(error => console.error('Error:', error))
}
buildViajesHorario('All', 'All');



const buildPropositoNumPasajeros = (start, end) => {
    postParams = {
        pipeline: [
            {
                '$match': {
                    'medio_principal': 'Automóvil'
                }
            },
            {
                '$group': {
                    '_id': '$proposito',
                    'avg_personas_inicio_viaje': { '$avg': '$personas_inicio_viaje' }
                }
            }
        ]
    };
    if (start !== 'All') {
        postParams.pipeline.unshift({
            $match: {}
        })
        postParams.pipeline[0].$match["distrito_origen"] = start;
    }

    fetch(mongoEndpoint, {
        method: 'POST',
        body: JSON.stringify(postParams),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(async (res) => {
        response = await res.json()

        let prop = [];
        response.map((item) => { prop.push(item._id) })
        // let y = [];
        // response.map((item) => { y.push(item.avg_personas_inicio_viaje.$numberDouble) })



        let data = {
            // labels: prop,
            datasets: []
        };
        // let i = 0;
        response.map((item, i) => {
            data.datasets.push({
                label: [
                    item._id
                ],
                backgroundColor: getColor11(i),
                // backgroundColor: "#73bd6c",
                borderColor: "darkblue",
                data: [
                    {
                        x: i,
                        y: parseFloat(item.avg_personas_inicio_viaje.$numberDouble),
                    }
                ]
            })
            // i++;
        })

        let options = {
            responsive: true,
            title: {
                display: true,
                text: 'Pasajeros por vehículo según propósito de viaje'
            },
            layout: {
                padding: {
                    left: 20,
                    right: 20,
                    top: 20,
                    bottom: 20
                }
            },
            legend: {
                display: true,
                position: 'right'
            },
            scales: {
                gridLines: { display: true },
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Pasajeros por vehículo'
                    },
                    ticks: { min: 0 }
                }],
                // xAxes: [{
                //     ticks: {
                //         stepSize: 1,
                //         display: true,
                //         maxRotation: 90,
                //         minRotation: 90,
                //         callback: function (value, index, values) {
                //             return prop[parseInt(value)];
                //         }
                //     }
                // }]
            }
        }





        // xAxes: [{

        // scales: {
        //     gridLines: { display: true },

        //     xAxes: [{
        //         ticks: {
        //             stepSize: 1,
        //             display: true,
        //             major: { enabled: true },
        //             minor: { enabled: true },
        //             maxRotation: 90,
        //             minRotation: 90,
        //             callback: function (value, index, values) {
        //                 return ids[parseInt(value)];
        //             }
        //         }
        //     }]
        // }
        // }]






        var ctx = document.getElementById('numPasajeros').getContext('2d');
        var myChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: options

        });

        // var trace1 = {
        //     x: x,
        //     y: y,
        //     name: 'Número de viajes',
        //     type: 'bar'
        // };

        // var data = [trace1];

        // // var layout = {barmode: 'group'};

        // Plotly.newPlot('plot5', data);


    })
        .catch(error => console.error('Error:', error))
}
buildPropositoNumPasajeros('All', 'All');


$('#btnSearch').click((e) => {
    // document.getElementById('mapContainer').innerHTML = '<div class="row" id="mainMap"></div>';


    let startValue = $('#select_start_trip').val()
    // let endValue = $('#select_end_trip').val()
    // let transportValue = $('#select_transport').val()
    // createMap(startValue, endValue, transportValue);
    buildDuracionMediodeTransporte(startValue, 'All');
    buildHistogramaDuracion(startValue, 'All');
    buildMedioNumViajes(startValue, 'All');
    buildViajesHorario(startValue, 'All');
    buildPropositoNumPasajeros(startValue, 'All');

})

loadSelectBox = async () => {

    // populate start_trip selectbox
    postParams = {
        "pipeline": [
            {
                "$group": {
                    "_id": "$distrito_origen",
                    "count": {
                        "$sum": "$num_coincidencias"
                    }
                }
            },
            {
                "$sort": {
                    "_id": 1
                }
            }
        ]
    }

    _res = await fetch(dataframe2Endpoint, {
        method: 'post',
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify(postParams)
    })
    response = await _res.json();

    const $selectStartTrip = $('#select_start_trip');
    $selectStartTrip.append($("<option />").val('All').text('Selecciona origen (Todos)'));
    response.map((item) => {
        $selectStartTrip.append($("<option />").val(item._id).text(item._id));
    });

    // populate end_trip selectbox
    // postParams = {
    //     "pipeline": [
    //         {
    //             "$group": {
    //                 "_id": "$distrito_destino",
    //                 "count": {
    //                     "$sum": "$num_coincidencias"
    //                 }
    //             }
    //         },
    //         {
    //             "$sort": {
    //                 "_id": 1
    //             }
    //         }
    //     ]
    // }

    // _res = await fetch(dataframe2Endpoint, {
    //     method: 'post',
    //     headers: {
    //         "Content-type": "application/json"
    //     },
    //     body: JSON.stringify(postParams)
    // })
    // response = await _res.json();

    // const $selectEndTrip = $('#select_end_trip');
    // $selectEndTrip.append($("<option />").val('All').text('Selecciona destino (Todos)'));
    // response.map((item) => {
    //     $selectEndTrip.append($("<option />").val(item._id).text(item._id));
    // });

}

loadSelectBox();