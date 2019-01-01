'use strict';

const weatherKey = '9618a8d8432940b2ef54e1ec33601bab';
const weatherEndpoint = 'https://api.openweathermap.org/data/2.5/weather'

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

/* show demo with my image */
function handleDemo() {
  $('#js-demo').on('click', function(event) {
    event.preventDefault(); /* diasble <a href */
    const lat = 34.060200;  /* Demo GPS */
    const lon = -118.278273;
    const demo = {arrDt: ["October 14, 2016", "2:15pm"], resX: 5616, resY: 3744, strAperture: "F/2", strCamera: "Canon", strFile: "IMG_4215.JPG", strFlash: "Flash did not fire", strFocal: "135 mm", strIso: "ISO-400", strModel: "Canon EOS 5D Mark II", strOwner: "Anthony Kim", strSW: "Adobe Photoshop CS6", strShutter: "1/640 sec", strSize: "5.6 MB" }
    resetPage();
    getWeather(lat, lon);   
    updateMap(lat, lon);
    $('#js-img').append(`<img class='frame' src='./img/IMG_4215.jpg'>`);
    renderSummary(demo);
    renderSpec(demo);
    $(window).scrollTop( $("#js-rpt").offset().top );
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

/* Convert GPS coordinate Degree, min, sec to decimal */
function gpsToNum(arrGps, ref) {
  /* Convert DMS -> decimal coordinates. Deg + min/60 + sec/3600 */
  if (arrGps)  {
    const gpsDec = arrGps.map( (item, ind) => item.numerator/item.denominator/ 60**ind)
    .reduce((a, b) => a + b);
    return ref === 'N'|'E'? gpsDec: -gpsDec;
    /* Return a negative value if ref is South or West) */
  }
}

/* convert size to user friendly format */
function convertSize(byte) {
  return (byte < 2**20)? 
    `${Math.round(byte / 2**10)} KB`: `${Math.round(byte/2**10/100)/10} MB`;
}

/* convert date string to customized array format: 
  e.g., "2015:08:09 18:31:33" -> ["August 9, 2015", "06:31pm"] */
function convertDate(strDt) {
  const arrDt = strDt.split(/[: ]+/);
  const strYear = arrDt[0];
  const numDay = Number(arrDt[2]);
  const strMonth = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"][Number(arrDt[1] - 1)];
  //const strHr = 
  const apm = (Number(arrDt[3]) < 12)? 'am': 'pm';
  const numHr = (arrDt[3] === '00' || arrDt[3] === '12')? 12: Number(arrDt[3])%12;
  const strMin = arrDt[4];
  return [`${strMonth} ${numDay}, ${strYear}`, `${numHr}:${strMin}${apm}`];
}

/* polish software name */
function convertSW(softWare, make){
  if (make === 'Apple' && softWare.slice(0,1) === '1') softWare = 'iOS ' + softWare;  
  if (softWare.split(/ /)[0] === 'Adobe') softWare = softWare.split(/ /).slice(0,3).join(' ');

  return softWare;  /* return customized name */
}

/* handle extra long string */
function sliceString (str, maxLen) {
  return (str.length > maxLen)? 
   `${str.slice(0,3)}~${str.slice(-maxLen/2)}`: str;
}

/* return customized exif object */
function customExif(file) {
  const exifObj = file.exifdata;  
  console.log(exifObj);

  /* arrDt[0]: Date in String, arrDt[1]: Time in String */
  return {
    arrDt: (exifObj.DateTimeOriginal)? convertDate(exifObj.DateTimeOriginal) : '',  
    strSize: (file.size)? convertSize(file.size) : '',
    strCamera: (exifObj.Make)? exifObj.Make : '',
    strModel: (exifObj.Model)? exifObj.Model : '',
    resX: (exifObj.PixelXDimension)? exifObj.PixelXDimension : '',
    resY: (exifObj.PixelYDimension)? exifObj.PixelYDimension : '',
    strFile: (file.name)? sliceString(file.name, 20) : '',
    strFocal: (exifObj.FocalLength)? `${exifObj.FocalLength} mm` : '',
    strAperture: (exifObj.FNumber)? `F/${exifObj.FNumber}` : '',
    strShutter: (exifObj.ExposureTime)? `${exifObj.ExposureTime.numerator}/${exifObj.ExposureTime.denominator} sec` : '',
    strIso: (exifObj.ISOSpeedRatings)? 'ISO-' + exifObj.ISOSpeedRatings: '',
    strFlash: (exifObj.Flash)? exifObj.Flash.split(/,/)[0]: '',
    strSW: (exifObj.Software)? convertSW(exifObj.Software, exifObj.Make) : '',
    strOwner: (file.iptcdata.byline)? file.iptcdata.byline : ''
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

/* get the weather info using API */
function getWeather(lat, lon) {
  console.log(lat, lon);

  const url = `${weatherEndpoint}?appid=${weatherKey}&lat=${lat}&lon=${lon}`;
  fetch(url)
    .then(response => {
      if (response.ok)  return response.json();
      throw new Error(response.statusText); /* catch server defined errors e.g, 404 */
    })
    .then(responseJson => renderWeather(responseJson))  /* display weather section */
    .catch(err => {
      console.log('error' + err.message);
    });
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

function handleSubmit() {

  $('#file-input').on('change', function(e) {

    const file = e.target.files[0];
    if (file && file.name) {
      resetPage();  /* Remove previous contents and hidden sections  */

      /* Retreive meta data from the file */ 
      EXIF.getData(file, function() {
        /* Get Geo Codes */
        const lat = gpsToNum(file.exifdata.GPSLatitude, file.exifdata.GPSLatitudeRef);  
        const lon = gpsToNum(file.exifdata.GPSLongitude, file.exifdata.GPSLongitudeRef);
        const exif = customExif(file);  /* parse exif to an object */
        console.log(exif)

        if (lat && lon) {
          getWeather(lat, lon);   /* get weather and display */
          updateMap(lat, lon);    /* update google map based on new GPS) */
        } else {
          renderGpsFailure();     /* No GPS */
        }

        renderUploadedImage(e, file); /* display uploaded image */
        renderSummary(exif);  /* display result summary section */
        renderSpec(exif);     /* display image spec section */

        $(window).scrollTop( $("#js-rpt").offset().top ); /* Page scroll to result page */
      });
    }
  });
}

$(_ => {
  handleSubmit();  // Upon submitting an image
  handleDemo();    // Upon clicking demo link  
});

