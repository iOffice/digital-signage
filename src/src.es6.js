const query = {};
let map = {};

let url = window.location.href;

url = url.substr(url.lastIndexOf('?') + 1).split('&');
_.each(url, (item) => {
  const line = item.split('=');
  query[decodeURIComponent(line[0])] = decodeURIComponent(line[1]);
  map[decodeURIComponent(line[0])] = decodeURIComponent(line[1]);
});

document.getElementsByTagName('fv-map')[0].setAttribute('floor-id', parseInt(map['id']));
document.getElementById('title').innerHTML = map['name'];

map = {};
//22miles
window.m2RunScript = function(str)
{
  str = escape(str)+' _unsetup=null;/**/';
  window.location = 'run://' + str;
};

//from TD
function zoomIn(e) { M2.zoomIn(e); }
function zoomOut(e) { M2.zoomOut(e); }
function reset(e) { M2.reset(); }
function selectRoom(id) {
  map.selectRoom.byId(id);
}

var M2 = {
  position: {},
  roomID: '',
  zoomIn: function(e) { if (map) map.zoomIn(e); },
  zoomOut: function(e) { if (map) map.zoomOut(e); },
  reset: function() {
    if (map) {
      map.panTo(M2.position.center, {animate:false});
      map.setZoom(M2.position.zoom);
      if (M2.roomID) {
        map.selectRoom.byName('');
        map.options.selectMode = false;
        map._refreshLayers();
        M2.roomID = '';
        try {
          m2SetRTVar('roomId', '');
        } catch (er) {}
      }
    }
  },
  onRoomClick: function(e) {
    var room = e.room;
    var id = room.id;
    if (M2.roomID !== id) {
      M2.roomID = id;
      try {
        m2SetRTVar('roomId', id + '');
      } catch (er) {}
      if (room.options.interactive) {
        map.selectRoom.byId(room.id);
        map.pingRoom(room, {
          screenRatio: .1,
          pulses: 10
        });
      }
    }
  }
};

function addMarker(map, room, icon, popupLabel, delta) {
  delta = delta || [0, 0];
  var b = room.getLargestRectangleBounds();
  var marker = L.marker([b.getNorth() + delta[1], b.getCenter().lng + delta[0]], {icon: icon});
  if (popupLabel) {
    marker.bindPopup(popupLabel);
  }
  return marker.addTo(map);
}

L.control({'position':'topright'});
angular.module('DemoApp', ['i.floor-viewer'])
    .controller('DemoController', function($scope, fvUtil, fvDelegate) {
      fvUtil.config('https://demo.iofficeconnect.com', {
        'x-auth-username': query.user,
        'x-auth-password': query.pass,
      });
      setTimeout(function() {
        fvDelegate.getMap().then(function(map) {
          this.map = map;
          map.zoomControl.setPosition('topright');
          //map.setZoom(map.getZoom() + 1);
          map.on('roomclick', M2.onRoomClick);
          document.getElementById('title').innerHTML = map.floor.building.name + ' / ' + map.floor.name;
          M2.position.zoom = map.getZoom();
          M2.position.center = map.getCenter();

          if (map.floor.id !== 224) {
            return;
          }



          map.onRoomsReady.then(function() {

            L.AwesomeMarkers.Icon.prototype.options.prefix = 'ion';
            var menRestRoomIcon = L.AwesomeMarkers.icon({
                icon: 'man',
                markerColor: 'gray'
              }),
              womenRestRoomIcon = L.AwesomeMarkers.icon({
              icon: 'woman',
              markerColor: 'gray'
            }),
              foodIcon = L.AwesomeMarkers.icon({
              icon: 'pizza',
              markerColor: 'blue'
            }),
              hereIcon = L.AwesomeMarkers.icon({
              icon: 'home',
              markerColor: 'red'
            }),
              labIcon = L.AwesomeMarkers.icon({
              icon: 'erlenmeyer-flask',
              markerColor: 'purple'
            }),
              exitIcon = L.AwesomeMarkers.icon({
              icon: 'android-exit',
              markerColor: 'red'
            });
            //22miles
            try {
              var foodLayer = addMarker(map, map.roomByName['1834'], foodIcon, 'Cafeteria', [0, -0.3]);
              var hereLayer = addMarker(map, map.roomByName['1819'], hereIcon, 'You Are Here', [0.2, -0.85]);
              var restroomsLayers = new L.LayerGroup([
                addMarker(map, map.roomByName['1832'], womenRestRoomIcon, 'Women'),
                addMarker(map, map.roomByName['1833'], menRestRoomIcon, 'Men')
              ]).addTo(map);
              var labLayer = addMarker(map, map.roomByName['1822'], labIcon, 'Laboratory', [0, -0.1]);
              var exitLayer = new L.LayerGroup([
                addMarker(map, map.roomByName['1826'], exitIcon, 'Emergency Exit', [0.1, -1.725]),
                addMarker(map, map.roomByName['1803'], exitIcon, 'Emergency Exit', [-0.025, 1.3])
              ]).addTo(map);

              var baseLayers = {};
              var overLayers = {
                '<i class="icon ion-home"></i> You Are Here': hereLayer,
                '<i class="icon ion-woman"></i><i class="icon ion-man"></i> Restrooms': restroomsLayers,
                '<i class="icon ion-pizza"></i> Cafeteria': foodLayer,
                '<i class="icon ion-erlenmeyer-flask"></i> Laboratory': labLayer,
                '<i class="icon ion-android-exit"></i> Emergency Exit': exitLayer
              };
              var panelLayers = L.control.layers(baseLayers, overLayers);
              map.addControl(panelLayers);
            } catch (er) {}
            var legend = L.control({position: 'bottomright'});
            legend.onAdd = function(map) {
              var div = L.DomUtil.create('div', 'info legend'),
                data = {
                  'Non-Reservable': 'lightgray',
                  'Reservable': '#80C680',
                  'Partially Available': '#FFB74D',
                  'At Capacity': '#D32F2F'
                };
              _.each(data, function(color, label) {
                  div.innerHTML +=
                    '<i style="background:' + color + '"></i> ' +
                    label + '<br>';
                });
              return div;
            };
            legend.addTo(map);

          });
        });
      }, 30);

    });
