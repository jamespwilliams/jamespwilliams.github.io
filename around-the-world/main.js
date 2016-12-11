map = null;

// geolocation
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(successFunction, errorFunction);
} else {
    errorFunction();
}
function successFunction(position) {
    initMap(position.coords.latitude,
      position.coords.longitude);

    main();
}
function errorFunction() {
    initMap(0,0);
}

function main() {
    startMarker = new google.maps.Marker({
                animation: google.maps.Animation.DROP,
                draggable:true,
                position:null,
                map: map,
                icon: 'markers/green_MarkerA.png'
        });

    sp = readPositionFromCookie("start");
    if (sp) {
      startMarker.setPosition(sp);
    }

    google.maps.event.addListener(startMarker, 'drag', function() {
      // updateMarkerStatus('Drag ended');
      markerDragged("start", startMarker);
    });

    google.maps.event.addListener(startMarker, 'dragend', function() {
      // updateMarkerStatus('Drag ended');
      markerDragEnd("start", startMarker);
    });

    finishMarker = new google.maps.Marker({
                animation: google.maps.Animation.DROP,
                draggable:true,
                position:null,
                map: map,
                icon: 'markers/green_MarkerB.png'
        });

    fp = readPositionFromCookie("finish");
    if (fp) {
      finishMarker.setPosition(fp);
    }

    google.maps.event.addListener(finishMarker, 'drag', function() {
      // updateMarkerStatus('Drag ended');
      markerDragged();
    });

    google.maps.event.addListener(finishMarker, 'dragend', function() {
      // updateMarkerStatus('Drag ended');
      markerDragEnd("finish", finishMarker);
    });

    totalLine = new google.maps.Polyline({
            path: [],
            icons: [{
              icon: {
                path: 'M 0,-1 0,1',
                strokeOpacity: 1,
                scale: 4
              },
              offset: '0',
              repeat: '20px'
            }],
            strokeColor: 'grey',
            strokeOpacity: 0.0,
            strokeWeight: 1,
            geodesic: true,
            map: null,
            visible:false
        });
    coveredLine = new google.maps.Polyline({
            path: [],
            strokeColor: "#FF0000",
            strokeColor: 'green',
            strokeOpacity: 1.0,
            strokeWeight: 4,
            geodesic: true,
            map: null,
            visible:false
        });

    totalMeters = 0;

    // Cookies:

    dist = readCookie("distance");

    if (dist != null) {
      $('#met').text(readCookie("distance"));
      totalMeters = parseInt(dist);
    }

    
    updateTotalLine();
    updateLine();

} // end main

function createCookie(name,value,days) {
    days = 365
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name,"",-1);
}

function savePositionAsCookie(cookiename, position) {
  createCookie(cookiename + "Lat", position.lat());
  createCookie(cookiename + "Lng", position.lng());
}

function readPositionFromCookie(cookiename) {
  if (readCookie(cookiename + "Lat")) {
    return {lat:parseFloat(readCookie(cookiename + "Lat")),
          lng:parseFloat(readCookie(cookiename + "Lng"))
          };
  }
  
}

function addMeters() {
  dist = readCookie("distance");
  if (dist != null) {
    createCookie("distance", (parseInt(dist) + parseInt($("#meters").val())).toString(), 10);
    $('#met').text(readCookie("distance"));

    totalMeters = parseInt(dist) + parseInt($("#meters").val())
  } else {
    createCookie("distance", parseInt($("#meters").val()).toString(), 10);
    $('#met').text($("#meters").val());
    totalMeters = parseInt($("#meters").val());
  }

  updateLine();
}


function addStartMarkerClicked() {
    startMarker.setMap(map);
    
    startMarker.setPosition({lat:map.getCenter().lat(), lng:map.getCenter().lng()});
    savePositionAsCookie("start", startMarker.getPosition());

    updateLine();
    updateTotalLine();
}

function addFinishMarkerClicked() {
    finishMarker.setMap(map);
    finishMarker.setPosition({lat:map.getCenter().lat(), lng:map.getCenter().lng()});
    savePositionAsCookie("finish", finishMarker.getPosition());

    updateLine();
    updateTotalLine();
}

function resetMeters() {
  totalMeters = 0;
  createCookie("distance", 0);
  $("#met").text("0");
  updateLine();
  updateTotalLine();
}

function markerDragged() {
  updateLine();
  updateTotalLine();

}

function markerDragEnd(cookiename, marker) {
  savePositionAsCookie(cookiename, marker.getPosition());
}

function updateTotalLine() {
    startLat = startMarker.getPosition().lat();
    startLng = startMarker.getPosition().lng();
    finishLat = finishMarker.getPosition().lat();
    finishLng = finishMarker.getPosition().lng();

    totalLine.setMap(map);
    totalLine.setVisible(true);
    totalLine.setPath([new google.maps.LatLng(startLat, startLng), new google.maps.LatLng(finishLat, finishLng)]);
}
function updateLine() {
    startLat = startMarker.getPosition().lat();
    startLng = startMarker.getPosition().lng();
    finishLat = finishMarker.getPosition().lat();
    finishLng = finishMarker.getPosition().lng();

    var point = pointBetween(startLat, startLng, finishLat, finishLng, totalMeters);

    if (distanceBetween(startLat, startLng, point.lat, point.lon) > distanceBetween(startLat, startLng, finishLat, finishLng)) {
      coveredLine.setPath([new google.maps.LatLng(startLat, startLng), new google.maps.LatLng(finishLat, finishLng)]);
      coveredLine.setVisible(true);
      coveredLine.setMap(map);
    }
    else {
      coveredLine.setPath([new google.maps.LatLng(startLat, startLng), new google.maps.LatLng(point.lat, point.lon)]);
      coveredLine.setVisible(true);
      coveredLine.setMap(map);
    }
    
}

function initMap(latitude, longitude) {
        var pos = {lat: latitude, lng: longitude};

        map = new google.maps.Map(document.getElementById('map'), {
          zoom: 7,
          minZoom: 3,
          center: pos
        });
}



function degToRad(x) {
  return (Math.PI / 180) * x;
}

function radToDeg(x) {
  return x * (180 / Math.PI);
}

// function takes starting position, bearing, and distance to travel
function destinationGivenStartBearingAndDistance(lat1, lon1, brng, d) {
   var lat2 = Math.asin( Math.sin(lat1)*Math.cos(d/R) + 
              Math.cos(lat1)*Math.sin(d/R)*Math.cos(brng) );
   var lon2 = lon1 + Math.atan2(Math.sin(brng)*Math.sin(d/R)*Math.cos(lat1), 
                     Math.cos(d/R)-Math.sin(lat1)*Math.sin(lat2));

}

function distanceBetween(lat1, lon1, lat2, lon2) {
  var R = 6371e3; // metres
var p1 = degToRad(lat1);
var p2 = degToRad(lat2);
var dp = degToRad(lat2-lat1);
var dl = degToRad(lon2-lon1);

var a = Math.sin(dp/2) * Math.sin(dp/2) +
        Math.cos(p1) * Math.cos(p2) *
        Math.sin(dl/2) * Math.sin(dl/2);
var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

var d = R * c;

return d;

}

function pointBetween(lat1, lon1, lat2, lon2, d) {
    da = 1 / 6371e3
    f = (d / distanceBetween(lat1, lon1, lat2, lon2));

    var p1 = degToRad(lat1);
    var p2 = degToRad(lat2);
    var l1 = degToRad(lon1);
    var l2 = degToRad(lon2);

    a = Math.sin((1-f)*da) / Math.sin(da)
    b = Math.sin(f*da) / Math.sin(da)
    x = a * Math.cos(p1) * Math.cos(l1) + b * Math.cos(p2) * Math.cos(l2);
    y = a * Math.cos(p1) * Math.sin(l1) + b * Math.cos(p2) * Math.sin(l2);
    z = a * Math.sin(p1) + b * Math.sin(p2);
    pi = Math.atan2(z, Math.sqrt(x*x + y*y));
    li = Math.atan2(y, x)

    return {lat:radToDeg(pi), lon:radToDeg(li)};
}

function bearingBetween(lat1, lon1, lat2, lon2) {

}
