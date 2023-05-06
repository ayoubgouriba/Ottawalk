var geoserverUrl = "http://99.79.76.36:8080/geoserver";
var selectedPoint = null;

var source = null;
var target = null;

var sourceMarker = null;
var targetMarker = null;
 
var pinIcon = new L.Icon({
  iconUrl: 'css/pin.png',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -24]
});

var goldIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

var redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});


var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap'
});

var Esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri and the GIS User Community'
});

var Stamen = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	ext: 'png'
});

var map = L.map('map', {layers: [Stamen]}).setView([45.42, -75.70], 13);

var baseMaps = {
  "OpenStreetMap": osm,
  "Stamen Lite": Stamen,
  "Stellite Imagery": Esri
};

// create an object to hold the layers
var overlayMaps = {};

// create the layer control and add it to the map
var layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);

L.Control.measureControl({position: 'topright'}).addTo(map);

L.control.locate().addTo(map);

L.control.browserPrint({position: 'topright', printModes: ["Portrait", "Landscape", "Custom"]}).addTo(map);

var startGeocoder = L.Control.geocoder({
  placeholder: 'Start point...',
  defaultMarkGeocode: false,
  geocoder: L.Control.Geocoder.nominatim(),
  position: 'topleft',
  collapsed: false,
  container: "startGeocoder"
}).addTo(map);

var destGeocoder = L.Control.geocoder({
  placeholder: 'End point...',
  defaultMarkGeocode: false,
  geocoder: L.Control.Geocoder.nominatim(),
  position: 'topleft',
  collapsed: false,
  container: "destGeocoder"
}).addTo(map);

// empty geojson layer for the shortest path result
var poiLayer = L.geoJSON(null).addTo(map);
var pathLayerShort = L.geoJSON(null).addTo(map);
var pathLayerNature = L.geoJSON(null).addTo(map);
var pathLayerCulture = L.geoJSON(null).addTo(map);
var pathLayerMarket = L.geoJSON(null).addTo(map);

// right-click listener to select start and end points
map.on('contextmenu', function (e) {
  var contextMenu = L.popup({
    closeButton: false,
    minWidth: 150,
    className: 'custom-context-menu'
  });
  contextMenu.setLatLng(e.latlng);
  contextMenu.setContent(`
    <ul class="menu-list">
      <li class="menu-item" onclick="selectStartPoint()">Select Start Point</li>
      <li class="menu-item" onclick="selectEndPoint()">Select End Point</li>
    </ul>
  `);
  contextMenu.openOn(map);
  
// add pointer cursor to the menu items
$('.menu-item').css('cursor', 'pointer');
  
selectStartPoint = function() {
  contextMenu.remove();
  if (sourceMarker) {
      sourceMarker.setLatLng(e.latlng);
  } else {
      sourceMarker = L.marker(e.latlng, {
          draggable: true,
          icon: goldIcon
      }).addTo(map)
      .on("dragend", function(e) {
          selectedPoint = e.target.getLatLng();
          getVertex(selectedPoint, true);
          clearAllInfo();
          clearAllLayers();
          clearOverlays();
          getRoute(function() {
            calculatePathDetails(pathLayerShort, "shortestInfo");
          });
      });
  }
  selectedPoint = e.latlng;
  getVertex(selectedPoint, true);
};

selectEndPoint = function() {
  contextMenu.remove();
  if (targetMarker) {
      targetMarker.setLatLng(e.latlng);
  } else {
      targetMarker = L.marker(e.latlng, {
          draggable: true,
          icon: redIcon
      }).addTo(map)
      .on("dragend", function(e) {
          selectedPoint = e.target.getLatLng();
          getVertex(selectedPoint, false);
          clearAllInfo();
          clearAllLayers();
          clearOverlays();
          getRoute(function() {
            calculatePathDetails(pathLayerShort, "shortestInfo");
          });
      });
  }
  selectedPoint = e.latlng;
  getVertex(selectedPoint, false);
};
});

startGeocoder.on('markgeocode', function(e) {
  if (sourceMarker) {
      sourceMarker.setLatLng(e.geocode.center);
  } else {
      sourceMarker = L.marker(e.geocode.center, {
          draggable: true,
          icon: goldIcon
      }).addTo(map)
      .on("dragend", function(e) {
          selectedPoint = e.target.getLatLng();
          getVertex(selectedPoint, true);
          clearAllInfo();
          clearAllLayers();
          clearOverlays();
          getRoute(function() {
            calculatePathDetails(pathLayerShort, "shortestInfo");
          });
      });
  }
  selectedPoint = e.geocode.center;
  getVertex(selectedPoint, true);
});

destGeocoder.on('markgeocode', function(e) {
  if (targetMarker) {
      targetMarker.setLatLng(e.geocode.center);
  } else {
      targetMarker = L.marker(e.geocode.center, {
          draggable: true,
          icon: redIcon
      }).addTo(map)
      .on("dragend", function(e) {
          selectedPoint = e.target.getLatLng();
          getVertex(selectedPoint, false);
          clearAllInfo();
          clearAllLayers();
          clearOverlays();
          getRoute(function() {
            calculatePathDetails(pathLayerShort, "shortestInfo");
          });
      });
  }
  selectedPoint = e.geocode.center;
  getVertex(selectedPoint, false);
});


// function to get nearest vertex to the passed point
function getVertex(selectedPoint, isSource) {
  var url = `${geoserverUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=pgrouting:nearest_vertex&outputformat=application/json&viewparams=x:${selectedPoint.lng};y:${selectedPoint.lat};`;
  $.ajax({
    url: url,
    async: false,
    success: function(data) {
      loadVertex(
        data,
        isSource
      );
    }
  });
}

// function to update the source and target nodes as returned from geoserver for later querying
function loadVertex(response, isSource) {
  var features = response.features;
  if (isSource) {
    source = features[0].properties.id;
  } else {
    target = features[0].properties.id;
  }
}


// function to get the shortest path from the given source and target nodes
function getRoute(callback) {
	var url = `${geoserverUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=pgrouting:shortest_path&outputformat=application/json&viewparams=source:${source};target:${target};`;
  
	$.getJSON(url, function(data) {
	  pathLayerShort = L.geoJSON(data, {
	  	style: {
	  		color: '#007BFF',
	  		weight: 7,
	  		opacity: 1
	  	}
	  }).addTo(map);

    // add the layer to the overlayMaps object and to the layer control
	  overlayMaps["Shortest Path"] = pathLayerShort;
	  layerControl.addOverlay(pathLayerShort, "Shortest Path");

    if (callback) {
      callback();
    }
	});
}

var natureGeoJSON = null;
var natureGjsonString = null;

// function to get the shortest path from the given source and target nodes
function getRoute_Nature(callback) {
	var url = `${geoserverUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=pgrouting:nature_path&outputformat=application/json&viewparams=source:${source};target:${target};`;
  
	$.getJSON(url, function(data) {
	  pathLayerNature = L.geoJSON(data, {
	  	style: {
	  		color: '#00C853',
	  		weight: 7,
	  		opacity: 1
	  	}
	  }).addTo(map);

    natureGeoJSON = pathLayerNature.toGeoJSON();
    natureGjsonString = JSON.stringify(natureGeoJSON);

    //console.log(natureGeoJSON);
    //console.log("string: " + natureGjsonString);

    // add the layer to the overlayMaps object and to the layer control
	  overlayMaps["Nature Path"] = pathLayerNature;
	  layerControl.addOverlay(pathLayerNature, "Nature Path");

    if (callback) {
      callback();
    }
	});
}

// function to get the shortest path from the given source and target nodes
function getRoute_Culture(callback) {
	var url = `${geoserverUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=pgrouting:culture_path&outputformat=application/json&viewparams=source:${source};target:${target};`;
  
	$.getJSON(url, function(data) {
	  pathLayerCulture = L.geoJSON(data, {
	  	style: {
	  		color: '#AA00FF',
	  		weight: 7,
	  		opacity: 1
	  	}
	  }).addTo(map);

    cultureGeoJSON = pathLayerCulture.toGeoJSON();
    cultureGjsonString = JSON.stringify(cultureGeoJSON);

    // add the layer to the overlayMaps object and to the layer control
	  overlayMaps["Culture Path"] = pathLayerCulture;
	  layerControl.addOverlay(pathLayerCulture, "Culture Path");

    if (callback) {
      callback();
    }
	});
}

// function to get the shortest path from the given source and target nodes
function getRoute_Market(callback) {
	var url = `${geoserverUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=pgrouting:market_path&outputformat=application/json&viewparams=source:${source};target:${target};`;
  
	$.getJSON(url, function(data) {
	  pathLayerMarket = L.geoJSON(data, {
	  	style: {
	  		color: '#FF6F00',
	  		weight: 7,
	  		opacity: 1
	  	}
	  }).addTo(map);

    marketGeoJSON = pathLayerMarket.toGeoJSON();
    marketGjsonString = JSON.stringify(marketGeoJSON);

    // add the layer to the overlayMaps object and to the layer control
	  overlayMaps["Market Path"] = pathLayerMarket;
	  layerControl.addOverlay(pathLayerMarket, "Market Path");

    if (callback) {
      callback();
    }
	});
}

function calculatePathDetails(pathLayer, divId) {
  var totalLength = 0;
  var time = 0;
  var timeM = 0;
  var bounds = null;

  pathLayer.eachLayer(function(layer) {
    var properties = layer.feature.properties;
    var distance = properties.distance;
    totalLength += distance;
    time = totalLength / 1.4;
    timeM = time / 60;

    if (bounds === null) {
      bounds = layer.getBounds();
    } else {
      bounds.extend(layer.getBounds());
    }
  });

  $('#' + divId).html(`<p><strong>Total distance:</strong> ${totalLength.toFixed(2)} meters</p><p><strong>Time to walk  :</strong> ${timeM.toFixed(0)} minutes</p>`);
  if (bounds !== null) {
    map.fitBounds(bounds);
  }
}


// create a new GeoJSON layer
// create a new GeoJSON layer with style function
var osmLayer = L.geoJSON(null);

var osm_nature_url = `${geoserverUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=osm_nature&outputFormat=application/json`;
var osm_culture_url = `${geoserverUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=osm_culture&outputFormat=application/json`;
var osm_market_url = `${geoserverUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=osm_market&outputFormat=application/json`;

// fetch the GeoJSON data from the URL and add it to the layer
function loadPolyJSON(url, callback) {
  $.getJSON(url, function(data) {
  osmLayer.clearLayers();
  osmLayer.addData(data);
  var osmJSON = osmLayer.toGeoJSON();
  callback(osmJSON);
  });
}

// Create a cluster group
var markers = L.markerClusterGroup();

function poiFeatures(geojson1Data, geojson2Data, bufferDistance, bufferUnits) {
  // Create a Leaflet layer for the linestring
  var geojson1 = L.geoJSON(geojson1Data);

  // Create a Leaflet layer for the POIs
  var geojson2 = L.geoJSON(geojson2Data);

  // Create a buffer around the linestring
  var buffer = turf.buffer(geojson1Data, bufferDistance, {units : bufferUnits });

  // Create a Leaflet layer for the points within the buffer
  poiLayer = L.geoJSON(null, {
  style: function(feature) {
    if (feature.geometry.type === 'Point') {
      return { color: 'darkslategrey' };
    } else if (feature.geometry.type === 'LineString') {
      return { color: 'darkslategrey' };
    } else if (feature.geometry.type === 'Polygon') {
      return { color: 'darkslategrey' };
    }
  },
  onEachFeature: function(feature, layer) {
    layer.on('click', function(e) {
      console.log(feature.properties.osm_id); // add this line
      var popupContent = feature.properties.name;
      L.popup()
        .setLatLng(e.latlng)
        .setContent(popupContent)
        .openOn(map);
    });
  },
  pointToLayer: function(feature, latlng) {
    return L.marker(latlng, { icon: pinIcon });
  }
});

  // Find points within the buffer
  // Iterate through each feature in geojson2Data
  geojson2Data.features.forEach(function(feature) {
    // Check if the feature is within any of the features in the buffer
    var isWithin = false;
    buffer.features.forEach(function(bufferFeature) {
      if (turf.booleanWithin(feature, bufferFeature)) {
        isWithin = true;
      }
    });
    // Add the feature to the pointsWithin layer if it is within any of the buffer features
    if (isWithin) {
      poiLayer.addData(feature);
    }
  });
  
  // add the layer to the overlayMaps object and to the layer control
  overlayMaps["Points of Interest"] = poiLayer;
  layerControl.addOverlay(poiLayer, "Points of Interest");

  // Add the points within the buffer to the map
  //poiLayer.addTo(map);  

  // Add the poiLayer to the cluster group
  markers.addLayer(poiLayer);
  // Add the cluster group to the map
  markers.addTo(map);
}

// function to clear all path layers
function clearAllLayers() {
  markers.clearLayers();
  poiLayer.clearLayers();
  pathLayerShort.clearLayers();
  pathLayerNature.clearLayers();
  pathLayerCulture.clearLayers();
  pathLayerMarket.clearLayers();
}

function clearAllInfo() {
  $('#shortestInfo').empty();
  $('#natureInfo').empty();
  $('#cultureInfo').empty();
  $('#marketInfo').empty();
}

function clearOverlays() {
  for (var layerName in overlayMaps) {
    var layer = overlayMaps[layerName];
    if (map.hasLayer(layer)) {
      map.removeLayer(layer);
    }
    layerControl.removeLayer(layer);
  }
}

$('.shortest').on('click', function () {
  clearAllInfo();
  clearAllLayers();
  clearOverlays();
  getRoute(function() {
    calculatePathDetails(pathLayerShort, "shortestInfo");
  });
});


$('.nature').on('click', function() {
  clearAllInfo();
  clearAllLayers();
  clearOverlays();
  getRoute_Nature(function() {
    calculatePathDetails(pathLayerNature, "natureInfo");
    loadPolyJSON(osm_nature_url, function(osmJSON) {
      poiFeatures(natureGeoJSON, osmJSON, 200, 'meters');
    });
  });
});

$('.culture').on('click', function() {
  clearAllInfo();
  clearAllLayers();
  clearOverlays();
  getRoute_Culture(function() {
    calculatePathDetails(pathLayerCulture, "cultureInfo");
    loadPolyJSON(osm_culture_url, function(osmJSON) {
      poiFeatures(cultureGeoJSON, osmJSON, 50, 'meters');
    });
  });
});

$('.market').on('click', function() {
  clearAllInfo();
  clearAllLayers();
  clearOverlays();
  getRoute_Market(function() {
    calculatePathDetails(pathLayerMarket, "marketInfo");
    loadPolyJSON(osm_market_url, function(osmJSON) {
      poiFeatures(marketGeoJSON, osmJSON, 50, 'meters');
    });
  });
});

// all button listener
$('.all').on('click', function () {
  clearAllLayers();
  clearAllInfo();
  clearOverlays();
  getRoute(function() {
    calculatePathDetails(pathLayerShort, "shortestInfo");
  });
  getRoute_Nature(function() {
    calculatePathDetails(pathLayerNature, "natureInfo");
  });
  getRoute_Culture(function() {
    calculatePathDetails(pathLayerCulture, "cultureInfo");
  });
  getRoute_Market(function() {
    calculatePathDetails(pathLayerMarket, "marketInfo");
  });
});

var about = `<div>
<p>Ottawalk is a project developed as part of the GISY6028 - Investigating Technologies course, which is a component of the NSCC GIS graduate certificate program at the Centre of Geographic Sciences (COGS).</p> <br>
<p>Ottawalk offers personalized routes based on your walking preferences (nature, culture, shopping, etc.).</p> <br>
<p>Available in Ottawa and its surrounding areas.</p> <br>
<ul>
  <li>Designed and created by Ayoub Gouriba</li>
  <li>Supported by Prof. Ed Symons</li>
  <li>Data sourced from OpenStreetMap</li>
  <li>Year: 2023</li> <br>
</ul>
</div>
`
$(document).ready(function() {
  // Add click event listener to the "About" text
  $("#about").click(function() {
    // Use jQuery dialog box to show the text "Author: Ayoub"
    $(about).dialog({
      appendTo: "body", // Append the dialog box to the body element
      width: 800
    });
  });
});