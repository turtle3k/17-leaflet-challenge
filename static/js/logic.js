// Store our API endpoint inside earthquakeUrl & tectonicUrl
var earthquakeUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
// URL for tectonic plates JSON data
var tectonicUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"

// console.log(earthquakeUrl);
// console.log(tectonicURL)

// Perform a GET request to the earthquake query URL
d3.json(earthquakeUrl, function(data) {
    // Once we get a response, send the data.features object to the createFeatures function
    createFeatures(data.features);
});

function createFeatures(earthquakeData) {

    // Define a function we want to run once for each feature in the features array
    // Give each feature a popup describing the place and time of the earthquake
    function onEachFeature(feature, layer) {
      layer.bindPopup("<h3>" + feature.properties.place +
        "</h3><hr><p>" + feature.properties.mag + " Magnitude" + "<br>" + new Date(feature.properties.time) + "</p>");
    }
  
    // Create a GeoJSON layer containing the features array on the earthquakeData object
    // Run the onEachFeature function once for each piece of data in the array
    var earthquakes = L.geoJSON(earthquakeData, {
        
      // **Add links looked up about Leaflet pointToLayer here for future reference**
        // See https://leafletjs.com/examples/geojson/  and https://geospatialresponse.wordpress.com/2015/07/26/leaflet-geojson-pointtolayer/

      pointToLayer: function (feature, latlng) {
        return new L.circleMarker(latlng, {
          radius: getRadius(feature.properties.mag),
          fillColor: getColor(feature.properties.mag),
          fillOpacity: 0.5,
          color: "#000",
          stroke: true,
          weight: 1.0
        });
      },

      onEachFeature: onEachFeature
    });

    // Sending our earthquakes layer to the createMap function
    createMap(earthquakes);
}


function createMap(earthquakes) {
// function createMap(earthquakes, tecPlates) {

  // Create the tile layer that will be the background of our map
  var comicmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
      attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
      maxZoom: 18,
      id: "mapbox.comic",
      accessToken: API_KEY
  });

  var outdoormap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
      attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
      maxZoom: 18,
      id: "mapbox.outdoors",
      accessToken: API_KEY
  });    

  var satellitemap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
      attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
      maxZoom: 18,
      id: "mapbox.satellite",
      accessToken: API_KEY
  });
    
  var piratemap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
      attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
      maxZoom: 18,
      id: "mapbox.pirates",
      accessToken: API_KEY
  });

  var contrastmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
      attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
      maxZoom: 18,
      id: "mapbox.high-contrast",
      accessToken: API_KEY
  });

  // Define a baseMaps object to hold the base layers
  //  Played with several types inlcuding light, dark, outdoors, streets, satellite, comic, pencil, pirates, emerald, and high-contrast.
  //    Found list here: https://gis.stackexchange.com/questions/244788/map-ids-to-add-mapbox-basemaps-to-leaflet-or-openlayers/244797
  var baseMaps = {
    "Comic Map": comicmap,
    "Pirate Map": piratemap,
    "Outdoor Map": outdoormap,
    "Satellite Map": satellitemap,
    "High-Contrast Map": contrastmap
  };
  
  // Create tectonic plate layer
  var tecPlates = new L.LayerGroup();

  // Create overlay object to hold our overlay layers
  var overlayMaps = {
    "Earthquakes": earthquakes,
    "Tectonic Plates" : tecPlates
  };
  
  // Create our map, giving it the comicmap and earthquakes layers & tec plates to display on load
  var myMap = L.map("map", {
    center: [50, -110],
    zoom: 3,
    layers: [comicmap, earthquakes, tecPlates]
  });
  
  // Add the plate lines to the tectonic layer
  d3.json(tectonicUrl, function(plateData) {
    L.geoJson(plateData, {
      color: "yellow",
      weight: 2
    })
    .addTo(tecPlates);
  });

  // Create a layer control.  Pass in our baseMaps and overlayMaps
  // Add the layer control to the map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);


  // Create a legend to display information about our map
  //  Note to self, CSS also important here - see also/addl leafletjs link below
  var legend = L.control({
    position: "bottomright"
  });

  // When the layer control is added, insert a div with the class of "legend"
  // https://leafletjs.com/examples/choropleth/
  legend.onAdd = function (myMap) {
    var div = L.DomUtil.create("div", "info legend"),
        grades = [0, 1, 2, 3, 4, 5],
        labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
      div.innerHTML +=
        '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
        grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
  };

  // Add the info legend to the map
  legend.addTo(myMap);
};

// Function that will determine the color based on magnitude of the earthquake
// red, orange, yellow, green, purple, black
// Red, OrangeRed, Orange, Yellow, Gold, Khaki
function getColor(mag) {
  switch (true) {
  case (mag > 5):
    return "#800026";
    break;
  case (mag > 4):
    return "#BD0026";
    break;
  case (mag > 3):
    return "#E31A1C";
    break;
  case (mag > 2):
    return "#FC4E2A";
    break;
  case (mag > 1):
    return "#FD8D3C";
    break;
  default:
    return "#FEB24C";
  }
};
// function getColor(d) {
//   return d > 5 ? "#08519c":
//          d > 4 ? "#3182bd":
//          d > 3 ? "#6baed6":
//          d > 2 ? "#9ecae1":
//          d > 1 ? "#c6dbef":
//                   "#eff3ff";
// };


// Function set radius of circle marker based on magnitude of the earthquake
function getRadius(mag) {
  return mag * 5;
};