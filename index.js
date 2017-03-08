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
    style: 'mapbox://styles/mapbox/dark-v9', //stylesheet location
    center: [1.775,30.134], // starting position
    zoom: 2.1, // starting zoom
    hash: true // show zoom/lat/lon in the url
});

// 4. Add geolocation and navigation plugins
map.addControl(new mapboxgl.Geolocate({ position: 'bottom-right' }));
map.addControl(new mapboxgl.Navigation());

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
            'icon-image': 'marker-15'
        },
        'filter': ['!has', 'point_count']
    });


    map.addLayer({
        'id': 'stories-cluster-circles',
        'type': 'circle',
        'source': 'stories-source',
        'paint': {
          'circle-radius': 18,
          'circle-color': '#f1f075',
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
            'DIN Offc Pro Medium',
            'Arial Unicode MS Bold',
        ],
        'text-size': 12,
      }
    });

    map.on('click', function(e) {
        var clickedFeatures = map.queryRenderedFeatures([
            [e.point.x - 5, e.point.y - 5],
            [e.point.x + 5, e.point.y + 5]
        ], { layers: ['stories-markers'] });

        if (clickedFeatures.length) {
            var clickedFeature = clickedFeatures[0];
            viewStory(e, clickedFeature);
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
