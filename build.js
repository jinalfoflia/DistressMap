(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// FIELDNOTES
// A customizable field reporting app made with Mapbox

var hat = require('hat');

// Setup
// 1. Signup for a Mapbox account and add your public token https://www.mapbox.com/studio/account/tokens/
mapboxgl.accessToken = 'pk.eyJ1IjoiamluYWxmb2ZsaWEiLCJhIjoiOE53X2toRSJ9.2aMeuYERrEvKHul16lAJjA';

// 2. URL to fetch stories
var STORIES_DATASET_URL = 'https://z2ny0kupj7.execute-api.us-east-1.amazonaws.com/testing/features';

// 3. Customize your map style and location
var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/jinalfoflia/cj00z1rx500nw2smwz881l75x', //stylesheet location
    center: [1.775,30.134], // starting position
    zoom: 2.1, // starting zoom
    hash: true // show zoom/lat/lon in the url
});

// 4. Add geolocation and navigation plugins
map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.GeolocateControl());

var geocoder = new MapboxGeocoder({ accessToken: mapboxgl.accessToken });
document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

// 5. Global variables
var storiesFeatureCollection = {
    type: 'FeatureCollection',
    features: []
};

var reviewer;

// 6. After the map style loads ...
map.on('load', function() {
    setupMap();
    getStories();
});

function setupMap() {
    map.addSource('stories-source', {
        'type': 'geojson',
        'data': storiesFeatureCollection,
        'cluster': true,
        'clusterMaxZoom': 14,
        'clusterRadius': 50
    });

    map.addLayer({
        'id': 'stories-markers',
        'type': 'symbol',
        'source': 'stories-source',
        'layout': {
            'icon-image': 'marker-30'
        },
        'filter': ['!has', 'point_count']
    });

    /*
    //Showing individual markers as circles
    map.addLayer({
        'id': 'stories-markers',
        'type': 'circle',
        'source': 'stories-source',
        'paint': {
            'circle-color': '#FF7F50',
            'circle-radius': 5,
            'circle-stroke-color': 'rgba(255,255,255,0.75)',
            'circle-stroke-width': 4
        },
        'filter': ['!has', 'point_count']
    });
    */


    map.addLayer({
        'id': 'stories-cluster-circles',
        'type': 'circle',
        'source': 'stories-source',
        'paint': {
            'circle-color': {
                property: 'point_count',
                type: 'exponential',
                stops: [
                    [{ zoom: 1, value: 5}, '#ffebb8'],
                    [{ zoom: 1, value: 20}, '#ff8441'],
                    [{ zoom: 7, value: 1}, '#ffebb8'],
                    [{ zoom: 7, value: 5}, '#ff8441']
                ]
            },
            'circle-radius': {
                property: "point_count",
                type: "exponential",
                stops: [
                    [{ zoom: 1, value: 5}, 10],
                    [{ zoom: 1, value: 20}, 25],
                    [{ zoom: 7, value: 1}, 10],
                    [{ zoom: 7, value: 5}, 25],
                ]
            },
            'circle-stroke-color': 'rgba(255,255,255,0.8)',
            'circle-stroke-width': 2
        },
        'filter': ['has', 'point_count']
    });

    map.addLayer({
      'id': 'stories-cluster-labels',
      'type': 'symbol',
      'source': 'stories-source',
      'layout': {
        'text-field': '{point_count}',
        'text-font': [
            'DIN Offc Pro Bold',
            'Arial Unicode MS Bold',
        ],
        'text-size': 12,
      }
    });

    map.on('click', function(e) {
        var clickedMarkers = map.queryRenderedFeatures([
            [e.point.x - 5, e.point.y - 5],
            [e.point.x + 5, e.point.y + 5]
        ], { layers: ['stories-markers'] });

        var clickedClusters = map.queryRenderedFeatures([
            [e.point.x - 5, e.point.y - 5],
            [e.point.x + 5, e.point.y + 5]
        ], { layers: ['stories-cluster-circles'] });

        if (clickedMarkers.length) {
            var clickedMarker = clickedMarkers[0];
            viewStory(e, clickedMarker);
        } else if (clickedClusters.length) {
            map.flyTo({
                center: e.lngLat,
                zoom: map.getZoom() + 2
            });
        } else {
            addStory(e);
        }
    });
}

function getStories(from) {
    var url = STORIES_DATASET_URL + (from ? '?start=' + from : '');

    $.getJSON(url, function(data) {
        storiesFeatureCollection.features = storiesFeatureCollection.features.concat(data.features);
        map.getSource('stories-source').setData(storiesFeatureCollection);

        if (data.features.length) {
            var lastFeatureID = data.features[data.features.length - 1].id;
            getStories(lastFeatureID);
        }
    });
}

function viewStory(e, story) {
    var formStory = ""
    + "<fieldset>"
    +     "<label>Story:</label>"
    +     "<textarea readonly name='story' placeholder='Share your story with the world' class='width36'>" + story.properties.story + "</textarea>"
    + "</fieldset>";

    var popupHTML = ""
    + "<form class='width40 pad2'>"
    +   formStory
    + "</form>";

    var popup = new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(popupHTML)
        .addTo(map);
}

function addStory(e) {
    var formStory = ""
    + "<fieldset>"
    +     "<label>Your story:</label>"
    +     "<textarea name='story' placeholder='Share your story with the world' class='width36'></textarea>"
    + "</fieldset>";

    var formActions = ""
    + "<a id='add-story' class='button col4' href='#'>Save</a>";

    var popupHTML = ""
    + "<form class='width40 pad2'>"
    +   formStory
    +   formActions
    + "</form>";

    var popup = new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(popupHTML)
        .addTo(map);

    // Update dataset with feature status on clicking save
    $('#add-story').on('click', function() {
        var newStoryFeature = {
            id: hat(),
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [
                    e.lngLat.lng,
                    e.lngLat.lat
                ]
            },
            properties: {
                story: $('textarea[name=story]').val(),
                timestamp: Date.now()
            }
        };

        popup.remove();

        $.ajax({
            url: STORIES_DATASET_URL + '/' + newStoryFeature['id'],
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(newStoryFeature)
        }).done(function(response) {
            storiesFeatureCollection.features = storiesFeatureCollection.features.concat(response);
            map.getSource('stories-source').setData(storiesFeatureCollection);
        });
    });
}

},{"hat":2}],2:[function(require,module,exports){
var hat = module.exports = function (bits, base) {
    if (!base) base = 16;
    if (bits === undefined) bits = 128;
    if (bits <= 0) return '0';
    
    var digits = Math.log(Math.pow(2, bits)) / Math.log(base);
    for (var i = 2; digits === Infinity; i *= 2) {
        digits = Math.log(Math.pow(2, bits / i)) / Math.log(base) * i;
    }
    
    var rem = digits - Math.floor(digits);
    
    var res = '';
    
    for (var i = 0; i < Math.floor(digits); i++) {
        var x = Math.floor(Math.random() * base).toString(base);
        res = x + res;
    }
    
    if (rem) {
        var b = Math.pow(base, rem);
        var x = Math.floor(Math.random() * b).toString(base);
        res = x + res;
    }
    
    var parsed = parseInt(res, base);
    if (parsed !== Infinity && parsed >= Math.pow(2, bits)) {
        return hat(bits, base)
    }
    else return res;
};

hat.rack = function (bits, base, expandBy) {
    var fn = function (data) {
        var iters = 0;
        do {
            if (iters ++ > 10) {
                if (expandBy) bits += expandBy;
                else throw new Error('too many ID collisions, use more bits')
            }
            
            var id = hat(bits, base);
        } while (Object.hasOwnProperty.call(hats, id));
        
        hats[id] = data;
        return id;
    };
    var hats = fn.hats = {};
    
    fn.get = function (id) {
        return fn.hats[id];
    };
    
    fn.set = function (id, value) {
        fn.hats[id] = value;
        return fn;
    };
    
    fn.bits = bits || 128;
    fn.base = base || 16;
    return fn;
};

},{}]},{},[1]);
