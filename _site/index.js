// FIELDNOTES
// A customizable field reporting app made with Mapbox

// Setup
// 1. Signup for a Mapbox account and add your public token https://www.mapbox.com/studio/account/tokens/
mapboxgl.accessToken = 'pk.eyJ1IjoiamluYWxmb2ZsaWEiLCJhIjoiOE53X2toRSJ9.2aMeuYERrEvKHul16lAJjA';

// 2. Create a new access token with the `datasets:read` and `datasets:write` scope. Request for a beta access if you do not see this option https://www.mapbox.com/api-documentation/#datasets
var mapboxAccessDatasetToken = 'sk.eyJ1IjoiamluYWxmb2ZsaWEiLCJhIjoiY2l2M2VvMjRxMDAwNjJ5cDZvdzc2dmcxdyJ9.1o0KPCBmRyaGZCWKGcggzQ';

// 3. Create a new Mapbox dataset and set the dataset location https://www.mapbox.com/blog/wildfire-datasets/
var dataset = 'civ3ff1en00062zljkbiyvqxg';
var DATASETS_BASE = 'https://api.mapbox.com/datasets/v1/jinalfoflia/' + dataset + '/';

// 4. Customize your map style and location
var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/jinalfoflia/civ3fliw8001p2jpdr0sdh9xm', //stylesheet location
    center: [1.775,30.134], // starting position
    zoom: 2.1, // starting zoom
    hash: true
});

var MapboxClient = require('mapbox/lib/services/datasets');
var mapbox = new MapboxClient(mapboxAccessDatasetToken);

var reviewer;
var _tmp = {};

var geolocate = map.addControl(new mapboxgl.Geolocate({
    position: 'bottom-right'
}));
map.addControl(new mapboxgl.Navigation());


// Layer for review markers

var overlayDataSource = new mapboxgl.GeoJSONSource({
    data: {}
});

var overlayData = {
    'id': 'overlayData',
    'type': 'circle',
    'source': 'overlayDataSource',
    'interactive': true,
    'layout': {
        visibility: 'visible'
    },
    'paint': {
        'circle-radius': 15,
        'circle-color': 'blue'
    }
};

// Map ready
map.on('style.load', function(e) {
    init();


    function init() {

        map.addSource('overlayDataSource', overlayDataSource);
        map.addLayer(overlayData);
        getOverlayFeatures();

        map.on('click', function(e) {

            // Add review marker
            var newOverlayFeature = {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "coordinates": [

                    ],
                    "type": "Point"
                }
            };

            var clickedOverlayFeatures = map.queryRenderedFeatures([
                [e.point.x - 5, e.point.y - 5],
                [e.point.x + 5, e.point.y + 5]
            ], {
                layers: ['overlayData']
            });
            if (clickedOverlayFeatures.length) {
                overlayFeatureForm(clickedOverlayFeatures[0]);

            } else {
                overlayFeatureForm();
            }

            function overlayFeatureForm(feature) {
                  var formOptions = "<div class='radio-pill pill pad1y clearfix'><input id='safe' type='radio' name='review' value='safe' checked='checked'><label for='safe' class='short button icon check fill-green'>Safe</label><input id='unsafe' type='radio' name='review' value='unsafe'><label for='unsafe' class='short button icon check fill-red'>Danger</label></div>";
                var formReviewer = "<fieldset><label> Your Story: <span id='reviewer' style='padding:5px;background-color:#eee'></span></label><input type='text' name='reviewer' placeholder='Share your story with the world'></input></fieldset>"
                var popupHTML = "<form>" + formOptions + formReviewer + "<a id='updateOverlayFeature' class='button col4' href='#'>Save</a><a id='deleteOverlayFeature' class='button quiet fr col4' href='#' style=''>Delete</a></form>";
                var popup = new mapboxgl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(popupHTML)
                    .addTo(map);

                // Show existing status if available
                if (feature) {
                    $("input[name=review][value=" + feature.properties["key"] + "]").prop('checked', true);
                    $("#reviewer").html(feature.properties["contributed_by"]);
                    newOverlayFeature = feature;
                    newOverlayFeature["id"] = feature.properties["id"];
                    console.log(feature);
                } else {
                    newOverlayFeature.geometry.coordinates = e.lngLat.toArray();
                }

                // Set reviewer name if previously saved
                if (reviewer) {
                    $("input[name=reviewer]").val(reviewer);
                }

                // Update dataset with feature status on clicking save
                document.getElementById("updateOverlayFeature").onclick = function() {
                    newOverlayFeature.properties["key"] = $("input[name=review]:checked").val();
                    reviewer = $("input[name=reviewer]").val();
                    newOverlayFeature.properties["contributed_by"] = reviewer;
                    popup.remove();
                    mapbox.insertFeature(newOverlayFeature, dataset, function(err, response) {
                        console.log(response);
                        overlayFeatureCollection.features = overlayFeatureCollection.features.concat(response);
                        overlayDataSource.setData(overlayFeatureCollection);
                    });
                };
                // Delete feature on clicking delete
                document.getElementById("deleteOverlayFeature").onclick = function() {
                    popup.remove();
                    mapbox.deleteFeature(newOverlayFeature["id"], dataset, function(err, response) {
                        console.log(response);
                    });
                };
            }

        });

    }


    // Get data from a Mapbox dataset
    var overlayFeatureCollection = {
        'type': 'FeatureCollection',
        'features': []
    };

    function getOverlayFeatures(startID) {

        var url = DATASETS_BASE + 'features';
        var params = {
            'access_token': mapboxAccessDatasetToken
        };

        // Begin with the last feature of previous request
        if (startID) {
            params.start = startID;
        }

        $.getJSON(url, params, function(data) {

            console.log(data);

            if (data.features.length) {
                data.features.forEach(function(feature) {
                    // Add dataset feature id as a property
                    feature.properties.id = feature.id;
                });
                overlayFeatureCollection.features = overlayFeatureCollection.features.concat(data.features);
                var lastFeatureID = data.features[data.features.length - 1].id;
                getOverlayFeatures(lastFeatureID);
                overlayDataSource.setData(overlayFeatureCollection);
            }
            overlayDataSource.setData(overlayFeatureCollection);
        });
    }

});
