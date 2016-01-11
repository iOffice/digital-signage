'use strict';

/* globals Utils */

function getQueryParams() {
  var url = arguments.length <= 0 || arguments[0] === undefined ? window.location.href : arguments[0];

  var query = {};
  var params = url.substr(url.lastIndexOf('?') + 1).split('&');
  _.each(params, function (item) {
    var col = item.split('=');
    query[decodeURIComponent(col[0])] = decodeURIComponent(col[1]);
  });
  return query;
}

function setFloorInfo(query) {
  var fvEle = document.getElementsByTagName('fv-map')[0];
  var titleEle = document.getElementById('title');
  fvEle.setAttribute('floor-id', parseInt(query.id, 10));
  titleEle.innerHTML = query.name;
}

var query = getQueryParams();
setFloorInfo(query);

// GLOBALS
_.assign(window, {
  gReservations: null,
  gMap: null,
  M2: {
    position: {},
    roomID: '',
    zoomIn: function zoomIn(e) {
      if (gMap) {
        gMap.zoomIn(e);
      }
    },
    zoomOut: function zoomOut(e) {
      if (gMap) {
        gMap.zoomOut(e);
      }
    },
    reset: function reset() {
      if (gReservations) {
        gReservations.updateData();
      }
      if (gMap) {
        gMap.panTo(M2.position.center, { animate: false });
        gMap.setZoom(M2.position.zoom);
        if (M2.roomID) {
          gMap.selectRoom.byName('');
          gMap.options.selectMode = false;
          gMap._refreshLayers();
          M2.roomID = '';
          try {
            m2SetRTVar('roomId', '');
          } catch (er) {
            console.log('m2SetRTVar Error...');
          }
        }
      }
    },
    onRoomClick: function onRoomClick(e) {
      var room = e.room;
      var id = room.id;
      if (M2.roomID !== id) {
        M2.roomID = id;
        try {
          m2SetRTVar('roomId', '' + id);
        } catch (er) {
          console.log('m2SetRTVar Error...');
        }
        if (room.options.interactive) {
          gMap.selectRoom.byId(room.id);
          // gMap.pingRoom(room, {
          //   screenRatio: 0.1,
          //   pulses: 4,
          // });
        }
      }
    }
  },
  m2RunScript: function m2RunScript(str) {
    // 22 Miles
    var result = escape(str) + ' _unsetup=null;/**/';
    window.location = 'run://' + result;
  },
  zoomIn: function zoomIn(e) {
    M2.zoomIn(e);
  },
  zoomOut: function zoomOut(e) {
    M2.zoomOut(e);
  },
  reset: function reset() {
    M2.reset();
  },
  selectRoom: function selectRoom(id) {
    if (gMap) {
      gMap.selectRoom.byId(id, { zoom: 'edge' });
      gMap.pingRoom(gMap.roomById[id], {
        screenRatio: 0.1,
        pulses: 4
      });
    }
  }
});

Utils.trace("hello", null, null);

function addMarker(map, room, icon, popupLabel) {
  var delta = arguments.length <= 4 || arguments[4] === undefined ? [0, 0] : arguments[4];
  var isDelta = arguments.length <= 5 || arguments[5] === undefined ? true : arguments[5];

  var b = room.getLargestRectangleBounds();
  var marker = L.marker([isDelta ? b.getNorth() + delta[1] : delta[1], isDelta ? b.getCenter().lng + delta[0] : delta[0]], { icon: icon });
  if (popupLabel) {
    marker.bindPopup(popupLabel);
  }
  return marker.addTo(map);
}

L.control({ 'position': 'topright' });
angular.module('DemoApp', ['i.floor-viewer']).controller('DemoController', function DemoController($scope, fvUtil, fvDelegate) {
  fvUtil.config('https://demo.iofficeconnect.com', {
    'x-auth-username': query.user,
    'x-auth-password': query.pass
  });
  setTimeout(function () {
    gReservations = fvDelegate.getLayerControllerByHandle('reservations');
    fvDelegate.getMap().then(function (map) {
      gMap = map;
      map.zoomControl.setPosition('topright');
      // map.setZoom(map.getZoom() + 1);
      map.on('roomclick', M2.onRoomClick);
      document.getElementById('title').innerHTML = map.floor.building.name + ' / ' + map.floor.name;
      M2.position.zoom = map.getZoom();
      M2.position.center = map.getCenter();
      map.on('click', function (e) {
        console.log('LATLNG: ', [e.latlng.lng, e.latlng.lat]);
      });

      map.onRoomsReady.then(function () {

        L.AwesomeMarkers.Icon.prototype.options.prefix = 'ion';
        var menRestRoomIcon = L.AwesomeMarkers.icon({
          icon: 'man',
          markerColor: 'gray'
        });
        var womenRestRoomIcon = L.AwesomeMarkers.icon({
          icon: 'woman',
          markerColor: 'gray'
        });
        var foodIcon = L.AwesomeMarkers.icon({
          icon: 'pizza',
          markerColor: 'blue'
        });
        var hereIcon = L.AwesomeMarkers.icon({
          icon: 'home',
          markerColor: 'red'
        });
        var labIcon = L.AwesomeMarkers.icon({
          icon: 'erlenmeyer-flask',
          markerColor: 'purple'
        });
        var labtopIcon = L.AwesomeMarkers.icon({
          icon: 'laptop',
          markerColor: 'purple'
        });
        var exitIcon = L.AwesomeMarkers.icon({
          icon: 'android-exit',
          markerColor: 'red'
        });

        if (map.floor.id === 330) {
          var foodLayer = addMarker(map, map.roomByName.BISTRO, foodIcon, 'Cafeteria', [3.22265625, -1.84375], false);
          var hereLayer = addMarker(map, map.roomByName['GET AWAY 2'], hereIcon, 'You Are Here', [11.20703125, -3.5390625], false);
          var restroomsLayers = new L.LayerGroup([addMarker(map, map.roomByName['WOMEN\'S RESTROOM'], womenRestRoomIcon, 'Women', [6.9609375, -3.3671875], false), addMarker(map, map.roomByName['MEN\'S RESTROOM'], menRestRoomIcon, 'Men', [6.96484375, -3.91015625], false)]).addTo(map);
          var laptopLayer = addMarker(map, map.roomByName['LAPTOP BAR'], labtopIcon, 'Laptop Bar', [7.203125, -5.79296875], false);
          var exitLayer = new L.LayerGroup([addMarker(map, map.roomByName['NORTH STAIRS'], exitIcon, 'Emergency Exit', [12.10546875, -3.9609375], false), addMarker(map, map.roomByName['SOUTH STAIRS'], exitIcon, 'Emergency Exit', [5.33203125, -1.26171875], false)]).addTo(map);

          var baseLayers = {};
          var overLayers = {
            '<i class="icon ion-home"></i> You Are Here': hereLayer,
            '<i class="icon ion-woman"></i><i class="icon ion-man"></i> Restrooms': restroomsLayers,
            '<i class="icon ion-pizza"></i> Cafeteria': foodLayer,
            '<i class="icon ion-laptop"></i> Laptop Bar': laptopLayer,
            '<i class="icon ion-android-exit"></i> Emergency Exit': exitLayer
          };
          var panelLayers = L.control.layers(baseLayers, overLayers);
          map.addControl(panelLayers);
        } else if (map.floor.id === 331) {
          var hereLayer = addMarker(map, map.roomByName['LOBBY'], hereIcon, 'You Are Here', [9.21875, -2.65625], false);
          var restroomsLayers = new L.LayerGroup([addMarker(map, map.roomByName['WOMEN\'S RESTROOM'], womenRestRoomIcon, 'Women', [5.5625, -2.38671875], false), addMarker(map, map.roomByName['MEN\'S RESTROOM'], menRestRoomIcon, 'Men', [5.55859375, -2.8671875], false)]).addTo(map);
          var laptopLayer = addMarker(map, map.roomByName['LAPTOP BAR'], labtopIcon, 'Laptop Bar', [10.421875, -4.89453125], false);
          var exitLayer = new L.LayerGroup([addMarker(map, map.roomByName['NORTH STAIRS'], exitIcon, 'Emergency Exit', [9.98828125, -3.09765625], false), addMarker(map, map.roomByName['SOUTH STAIRS'], exitIcon, 'Emergency Exit', [3.453125, -2.18359375], false), addMarker(map, map.roomByName['LOBBY STAIRS'], exitIcon, 'Emergency Exit', [7.625, -2.4921875], false)]).addTo(map);

          var baseLayers = {};
          var overLayers = {
            '<i class="icon ion-home"></i> You Are Here': hereLayer,
            '<i class="icon ion-woman"></i><i class="icon ion-man"></i> Restrooms': restroomsLayers,
            '<i class="icon ion-laptop"></i> Laptop Bar': laptopLayer,
            '<i class="icon ion-android-exit"></i> Emergency Exit': exitLayer
          };
          var panelLayers = L.control.layers(baseLayers, overLayers);
          map.addControl(panelLayers);
        } else if (map.floor.id === 332) {
          var hereLayer = addMarker(map, map.roomByName['ELEV.1'], hereIcon, 'You Are Here', [9.0390625, -2.6640625], false);
          var restroomsLayers = new L.LayerGroup([addMarker(map, map.roomByName['WOMEN\'S RESTROOM'], womenRestRoomIcon, 'Women', [5.578125, -2.40625], false), addMarker(map, map.roomByName['MEN\'S RESTROOM'], menRestRoomIcon, 'Men', [5.58984375, -2.90625], false)]).addTo(map);
          var laptopLayer = addMarker(map, map.roomByName['LAPTOP BAR'], labtopIcon, 'Laptop Bar', [3.8125, -4.9453125], false);
          var exitLayer = new L.LayerGroup([addMarker(map, map.roomByName['NORTH STAIRS'], exitIcon, 'Emergency Exit', [10.015625, -3.12109375], false), addMarker(map, map.roomByName['SOUTH STAIRS'], exitIcon, 'Emergency Exit', [3.33984375, -2.140625], false)]).addTo(map);

          var baseLayers = {};
          var overLayers = {
            '<i class="icon ion-home"></i> You Are Here': hereLayer,
            '<i class="icon ion-woman"></i><i class="icon ion-man"></i> Restrooms': restroomsLayers,
            '<i class="icon ion-laptop"></i> Laptop Bar': laptopLayer,
            '<i class="icon ion-android-exit"></i> Emergency Exit': exitLayer
          };
          var panelLayers = L.control.layers(baseLayers, overLayers);
          map.addControl(panelLayers);
        } else {
          return;
        }

        var legend = L.control({ position: 'bottomright' });
        legend.onAdd = function () {
          var div = L.DomUtil.create('div', 'info legend');
          var data = {
            'Non-Reservable': 'lightgray',
            'Reservable': '#80C680',
            // 'Partially Booked': '#FFB74D',
            'Booked': '#D32F2F'
          };
          _.each(data, function (color, label) {
            div.innerHTML += '<i style="background:' + color + '"></i> ' + label + '<br>';
          });
          return div;
        };
        legend.addTo(map);
      });
    });
  }, 30);
});