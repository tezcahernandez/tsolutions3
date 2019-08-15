
const dataframe2Endpoint = "https://webhooks.mongodb-stitch.com/api/client/v2.0/app/devapp-cmeay/service/bootcamp/incoming_webhook/custom";

function decode(encoded) {
    // source: http://doublespringlabs.blogspot.com.br/2012/11/decoding-polylines-from-google-maps.html
    // array that holds the points

    var points = []
    var index = 0, len = encoded.length;
    var lat = 0, lng = 0;
    while (index < len) {
        var b, shift = 0, result = 0;
        do {

            b = encoded.charAt(index++).charCodeAt(0) - 63;//finds ascii                                                                                    //and substract it by 63
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);


        var dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
        lat += dlat;
        shift = 0;
        result = 0;
        do {
            b = encoded.charAt(index++).charCodeAt(0) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        var dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        // points.push({ latitude: (lat / 1E5), longitude: (lng / 1E5) })
        points.push([(lat / 1E5), (lng / 1E5)])

    }
    return points
}

mapInit = () => { }

createMap = async (start, end, transport) => {

    var lightmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, " +
            "<a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.light",
        accessToken: API_KEY
    });

    var darkmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, " +
            "<a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.dark",
        accessToken: API_KEY
    });

    var satellitemap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, " +
            "<a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.satellite",
        accessToken: API_KEY
    });

    // Districts locations
    const districtsLocationsLayer = new L.layerGroup();

    postParams = {
        "pipeline": [
            {
                '$match': {
                    'route.status': {
                        '$ne': 'ZERO_RESULTS'
                    }
                }
            }, {
                '$group': {
                    '_id': {
                        'distrito_destino': '$distrito_destino',
                        'lat_destino': '$lat_destino',
                        'lng_destino': '$lng_destino'
                    },
                    'count': {
                        '$sum': '$num_coincidencias'
                    }
                }
            }
        ]
    }

    if (start !== 'All') {
        postParams.pipeline[0].$match["distrito_origen"] = start;
    }
    if (end !== 'All') {
        postParams.pipeline[0].$match["distrito_destino"] = end;
    }

    _res = await fetch(dataframe2Endpoint, {
        method: 'post',
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify(postParams)
    })
    response = await _res.json();

    for (let i = 0; i < response.length; i++) {
        let coordinates = [parseFloat(response[i]._id.lat_destino.$numberDouble), parseFloat(response[i]._id.lng_destino.$numberDouble)];
        console.log(parseInt(response[i].count.$numberInt));
        L.circle(coordinates, {
            weight: 3,
            fillColor: 'red',
            color: 'red',
            fillOpacity: 1,
            radius: parseInt(response[i].count.$numberInt) * (start === 'All' ? .5 : 2)
        }).bindPopup(`${response[i]._id.distrito_destino}`).addTo(districtsLocationsLayer);
    }

    // for (let i = 0; i < districts_coordinates.length; i++) {
    //     let coordinates = [districts_coordinates[i]['lat'], districts_coordinates[i]['lng']];

    //     L.circle(coordinates, {
    //         weight: 3,
    //         fillColor: 'red',
    //         color: 'red',
    //         fillOpacity: 1,
    //         // radius: (50000)
    //     }).bindPopup(`${districts_coordinates[i].descrip}`).addTo(districtsLocationsLayer);
    // }

    // getting polylines
    const polylinesLayer = new L.layerGroup();
    postParams = {
        "pipeline": [
            {
                '$match': {
                    'route.status': {
                        '$ne': 'ZERO_RESULTS'
                    }
                }
            },
            {
                '$project': {
                    'route.routes.overview_polyline': 1
                }
            }, {
                '$match': {
                    'route.routes.overview_polyline.points': {
                        '$exists': true
                    }
                }
            }, {
                '$addFields': {
                    'route.num_coincidencias': '$num_coincidencias'
                }
            }, {
                '$replaceRoot': {
                    'newRoot': '$route'
                }
            }, {
                '$limit': 1000
            }
        ]
    }

    if (start !== 'All') {
        postParams.pipeline[0].$match["distrito_origen"] = start;
    }
    if (end !== 'All') {
        postParams.pipeline[0].$match["distrito_destino"] = end;
    }
    if (transport !== 'All') {
        postParams.pipeline[0].$match["auto/transporte"] = transport;
    }

    _res = await fetch(dataframe2Endpoint, {
        method: 'post',
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify(postParams)
    })
    response = await _res.json();
    console.log(response);

    resultsCount = response.length;
    for (i = 0; i < response.length; i++) {
        let polyline_encoded = response[i].routes[0].overview_polyline.points;
        let count = response[i].num_coincidencias;
        coordinates = decode(polyline_encoded)
        polyline = L.polyline(
            coordinates,
            {
                // color: 'blue',
                color: '#00D700',
                weight: 1,
                opacity: resultsCount > 1000 ? .01 * count :
                    resultsCount > 500 ? .03 * count :
                        resultsCount > 100 ? .05 * count
                            : .1,
                lineJoin: 'round'
            }
        ).addTo(polylinesLayer);
    }

    var baseMaps = {
        "Dark": darkmap,
        "Light": lightmap,
        "Satellite": satellitemap
    };

    var overlayMaps = {
        "Distritos": districtsLocationsLayer,
        "Rutas": polylinesLayer
    };

    var myMap = L.map("mainMap", {
        center: [19.4326, -99.1332],
        zoom: 11,
        layers: [darkmap, districtsLocationsLayer, polylinesLayer]
    });

    L.control.layers(baseMaps, overlayMaps,
        {
            collapsed: false
        }).addTo(myMap);




    // top 15 roads
    postParams = {
        pipeline: [
            {
                '$match': {
                    'route.status': {
                        '$ne': 'ZERO_RESULTS'
                    }
                }
            }, {
                '$project': {
                    'roads_names': {
                        '$reduce': {
                            'input': '$roads.names',
                            'initialValue': [],
                            'in': {
                                '$concatArrays': [
                                    '$$value', '$$this'
                                ]
                            }
                        }
                    },
                    "num_coincidencias": 1
                }
            }, {
                '$match': {
                    'roads_names': {
                        '$ne': null
                    }
                }
            }, {
                '$project': {
                    'roads_names': {
                        '$reduce': {
                            'input': '$roads_names',
                            'initialValue': [],
                            'in': {
                                '$concatArrays': [
                                    '$$value', {
                                        '$cond': {
                                            'if': {
                                                '$in': [
                                                    '$$this', '$$value'
                                                ]
                                            },
                                            'then': [],
                                            'else': [
                                                '$$this'
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    "num_coincidencias": 1
                }
            }, {
                '$limit': 1000
            }
        ]
    }

    if (start !== 'All') {
        postParams.pipeline[0].$match["distrito_origen"] = start;
    }
    if (end !== 'All') {
        postParams.pipeline[0].$match["distrito_destino"] = end;
    }
    if (transport !== 'All') {
        postParams.pipeline[0].$match["auto/transporte"] = transport;
    }

    _res = await fetch(dataframe2Endpoint, {
        method: 'post',
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify(postParams)
    })
    response = await _res.json();

    roadNamesCount = {}
    excepts = { "right": 1, "left": 1, "east": 1, "U-turn": 1, "south": 1, "west": 1, "northwest": 1, "northeast": 1 }
    response.map((route) => {
        route.roads_names.map((roadName) => {
            if (!(roadName in excepts)) {
                if (roadNamesCount[roadName] === undefined) {
                    roadNamesCount[roadName] = parseInt(route.num_coincidencias.$numberInt);
                } else {
                    roadNamesCount[roadName] += parseInt(route.num_coincidencias.$numberInt);
                }
            }

        })
    });

    var sortable = [];
    for (var road in roadNamesCount) {
        sortable.push([road, roadNamesCount[road]]);
    }

    sortable.sort(function (a, b) {
        return b[1] - a[1];
    });

    top10Roads = sortable.slice(0, 10);

    var legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
        var div = L.DomUtil.create('div', 'info legend'),
            grades = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
            labels = [];
        div.toggle
        div.innerHTML += 'Top 10 roads<br><hr>'

        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                `<i style="background:${getColor(grades[i] + 1)}">&nbsp&nbsp&nbsp&nbsp</i> ` +
                `${i + 1} ${top10Roads[i]}<br>`;
        }

        return div;
    };
    legend.addTo(myMap);
}

function getColor(v) {

    return v > 8 ? '#00D700' :
        v > 7 ? '#08B934' :
            v > 6 ? '#0E9C55' :
                v > 5 ? '#138166' :
                    v > 4 ? '#138166' :
                        v > 3 ? '#156969' :
                            v > 2 ? '#164352' :
                                v > 1 ? '#164352' :
                                    "#164352";

}

// function getColor(v) {

//     return v > 8 ? '#0A2F51' :
//         v > 7 ? '#0E4D64' :
//             v > 6 ? '#137177' :
//                 v > 5 ? '#188977' :
//                     v > 4 ? '#1D9A6C' :
//                         v > 3 ? '#48B16D' :
//                             v > 2 ? '#74C67A' :
//                                 v > 1 ? '#ADDAA1' :
//                                     "#DEEDCF";

// }

createMap("All", "All", "All");

$('#btnSearch').click((e) => {
    document.getElementById('mapContainer').innerHTML = '<div class="row" id="mainMap"></div>';


    let startValue = $('#select_start_trip').val()
    let endValue = $('#select_end_trip').val()
    let transportValue = $('#select_transport').val()
    // alert(startValue, endValue, transportValue)
    createMap(startValue, endValue, transportValue);
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
    postParams = {
        "pipeline": [
            {
                "$group": {
                    "_id": "$distrito_destino",
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

    const $selectEndTrip = $('#select_end_trip');
    $selectEndTrip.append($("<option />").val('All').text('Selecciona destino (Todos)'));
    response.map((item) => {
        $selectEndTrip.append($("<option />").val(item._id).text(item._id));
    });

}

loadSelectBox();