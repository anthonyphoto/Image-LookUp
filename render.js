'use strict';

/* render.js - page rendering js */

/* Google map init */
var map;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -34.397, lng: 150.644},
    mapTypeControl: false,
    streetViewControl: false,
    zoom: 10 
  });
}

/* update map with a new position and marker */
function updateMap(lat, lon) {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: lat, lng: lon},
    mapTypeControl: false,
    streetViewControl: false,
    zoom: 15 
  });
  var marker = new google.maps.Marker({
    position: {lat: lat, lng: lon},
    label: {
      color: '#F22613',
      fontWeight: 'bold',
      fontSize: '24px',
      fontFamily: 'Roboto',
      text: 'Your pic was taken from here',
    },
    icon: {
      labelOrigin: new google.maps.Point(11, 60),
      url: './img/cam_1.gif',
    },
    map: map
  });
}

/* redner uploaded image */
function renderUploadedImage(e, file){
  //const file = e.target.files[0];
  const fr = new FileReader();
  fr.readAsDataURL(file);
  //console.log(file);
  fr.onload = function(e) {
    $('#js-img').append(`<img class='frame' alt='Uploaded Image' src='${this.result}'>`);
  }
}

function renderWeather(responseJson) {
  /* convert K->F degree */
  const tempF = Math.round((responseJson.main.temp - 273.15) * 9/5 + 32);  
  
  $('#js-loc-sum').html(` in ${responseJson.name} area `);
  $('#js-loc').html(responseJson.name);
  $('#js-loc-desc').html(`
  Please find a spot where the picture was taken below.  
  The current weather in ${responseJson.name} is "${responseJson.weather[0].description.toUpperCase()}" and temperature is ${tempF}°F.`);

  console.log(responseJson);
  console.log(responseJson.weather[0].icon);
  //console.log(new Date(responseJson.dt * 1000)); 
}

function renderGpsFailure() {
  $('#js-loc').html('Location');
  $('#js-loc-desc').append('Unfortunately this file does not include GPS information.');
  $('#map').addClass('hidden'); 
}

function resetPage() {
  $('.hidden').removeClass('hidden'); /* show all hidden sections */
  $('#js-summary, #js-col1, #js-col2, #js-col3, #js-loc, #js-loc-desc, #js-img').empty();  /* remove previous contents */
}

function renderSummary(exif) {
  const stmtSW = (exif.strSW)? ` and developed with ${exif.strSW}`: '';
  const stmtTime = (exif.arrDt)? `The file was created ${(exif.strOwner)? 'by ' + exif.strOwner : ''} at ${exif.arrDt[1]} on ${exif.arrDt[0]}${stmtSW}.` : '';

  if (exif.strCamera) {
    $('#js-summary').html(`This picture was taken ${(exif.strOwner)? 'by ' + exif.strOwner : ''} <span class= 'font_m' id='js-loc-sum'></span> at ${exif.arrDt[1]} on ${exif.arrDt[0]}. &nbsp; ${exif.strCamera} camera, "${exif.strModel}" was used${stmtSW}.
    `);
  } else {
    $('#js-summary').html(`Hmm.. It looks like your file is missing EXIF information, which means there is no shooting information available. ${stmtTime}
    `);
  }
}

function renderSpec(exif) {
  let shotInfo = ''; /* merge shot settings in one string */
  if (exif.strShutter) {
    shotInfo = exif.strShutter;
    if (exif.strAperture) shotInfo += ', ' + exif.strAperture;
    if (exif.strIso) shotInfo += ', ' + exif.strIso;
  }
  /* display detailed image data in 3 columns */
  $('#js-col1').append((exif.strFile)? `<li>Name: ${exif.strFile}</li>`:'');
  $('#js-col1').append((exif.resX)? `<li>Resolution: ${exif.resX} x ${exif.resY}</li>`:'');
  $('#js-col1').append((exif.strSize)? `<li>File Size: ${exif.strSize}</li>`:'');
  $('#js-col2').append((exif.strFocal)? `<li>Shot at ${exif.strFocal}</li>`:'');
  $('#js-col2').append(shotInfo? `<li>${shotInfo}</li>`:'');
  $('#js-col2').append(exif.strFlash? `<li>${exif.strFlash}</li>`:'');
  $('#js-col3').append(exif.strCamera? `<li>Brand: ${exif.strCamera}</li>`:'');
  $('#js-col3').append(exif.strModel? `<li>Model: ${exif.strModel}</li>`:'');
  $('#js-col3').append(exif.strSW? `<li>SW: ${exif.strSW}</li>`:'');

  /* handling no data */
  if (!$('#js-col2').html()) $('#js-col2').append('<li>Information not available</li>');
  if (!$('#js-col3').html()) $('#js-col3').append('<li>Information not available</li>');
}