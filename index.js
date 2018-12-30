'use strict';




/* openweathermap API*/
const weatherKey = '9618a8d8432940b2ef54e1ec33601bab';
const weatherEndpoint = 'https://api.openweathermap.org/data/2.5/weather'

/* Google map */
const mapKey = 'AIzaSyDZru626EgBL1Ry4UzDOIr-VpjunKoQtO8';
const mapEndpoint ='https://maps.googleapis.com/maps/api/geocode/json';

/* Google map init */
var map;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -34.397, lng: 150.644},
    mapTypeControl: false,
    streetViewControl: false,
    zoom: 10 


  });
//  bounds  = new google.maps.LatLngBounds();
}

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
      //fontWeight: 'bold',
      fontFamily: 'Roboto',
      text: 'The pic was taken\n from here',
    },
    icon: {
      labelOrigin: new google.maps.Point(11, 50),
      url: './img/cam_1.gif',
    },
    map: map
  });
}

function renderUploadedImage(e, file){
//  const file = e.target.files[0];
  const fr = new FileReader();
  fr.readAsDataURL(file);
  console.log(file);

  fr.onload = function(e) {
    $('.js-img').append(`<img class='frame' src='${this.result}'>`);
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

function convertSize(byte) {
  return (byte < 2**20)? 
    `${Math.round(byte / 2**10)} KB`: `${Math.round(byte/2**10/100)/10} MB`;
}

/* Convert date form to customized format: 
 * "2015:08:09 18:31:33" -> ["August 9, 2015", "06:31pm"]
 * return type is array - 0: date 1: time
 */
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
  return [`${strMonth} ${numDay}, ${strYear}`, `${(numHr < 12)? '0' + numHr: numHr}:${strMin}${apm}`];
}

function renderExifInfo(file) {
  const exifObj = file.exifdata;
  console.log(exifObj);
  console.log('time: ' +  typeof(exifObj.DateTimeOriginal));
  
  console.log('file size = ' + convertSize(file.size));
  console.log(`Demension: ${exifObj.PixelXDimension} x ${exifObj.PixelYDimension}`);

  $('.js-exif').append(`
    <ul>
      <li>File Name: ${file.name}</li>
      <li>Photo is taken at ${convertDate(exifObj.DateTimeOriginal)}</li>

      <li>Image Resolution: ${exifObj.PixelXDimension} x ${exifObj.PixelYDimension}</li>
      <li>File Size: ${convertSize(file.size)}</li>
      <li>Camera: ${exifObj.Make}</li> 
      <li>Model: ${exifObj.Model}</li>

      <li>Focal Length: ${exifObj.FocalLength} mm</li>
      <li>Aperture: F/${exifObj.FNumber}</li>
      <li>Shutter Speed: ${exifObj.ExposureTime.numerator}/${exifObj.ExposureTime.denominator} sec</li>
      <li>ISO: ${exifObj.ISOSpeedRatings}</li>
      <li>${exifObj.Flash.split(/,/)[0]}</li>
      <li>Editing Software: ${exifObj.Software}</li>
      <li>Photorapher: ${file.iptcdata.byline}</li>

  `);
  
}


function renderWeather(responseJson) {
  const tempF = Math.round((responseJson.main.temp - 273.15) * 9/5 + 32);  // Convert Kelvin -> Farenheit

  $('.js-weather').append(`
    <ul>    
      <li>Current weather in ${responseJson.name}</li>
 <!--     <li>${responseJson.weather[0].main}</li>  -->
      <li>${responseJson.weather[0].description.toUpperCase()} ${tempF}°F</li>
    <ul>`);
  console.log(responseJson);
  console.log(responseJson.weather[0].icon);
  console.log(new Date(responseJson.dt * 1000));
  
}

/* Display the weather */
function getWeather(lat, lon) {
  console.log(lat, lon);
  if (!lat || !lon) return;  // error handling

  const url = `${weatherEndpoint}?appid=${weatherKey}&lat=${lat}&lon=${lon}`;
  fetch(url)
    .then(response => {
      if (response.ok)  return response.json();
      throw new Error(response.statusText);
    })
    .then(responseJson => renderWeather(responseJson))
    .catch(err => {
      console.log('error' + err.message)
    });
}

function handleSubmit() {
  $('#file-input').on('change', function(e) {
    $('.hidden').removeClass('hidden');

    const file = e.target.files[0];
    if (file && file.name) {
        EXIF.getData(file, function() {
          /* Get Geo Codes */
          const lat = gpsToNum(file.exifdata.GPSLatitude, file.exifdata.GPSLatitudeRef);  
          const lon = gpsToNum(file.exifdata.GPSLongitude, file.exifdata.GPSLongitudeRef);

          console.log(lat + ", " + lon);

          updateMap(lat, lon);
          renderUploadedImage(e, file);
          renderExifInfo(file);
          getWeather(lat, lon);   /* get weather and display */
        });
    }
  });
}

function handleDemo() {
  $('#js-demo').on('click', function(event) {
    event.preventDefault(); /* diasble <a href */
    console.log('demo clicked');
    
  });
}

$(_ => {
/*  initMap(); */
  handleSubmit();  // Upon submitting an image
  handleDemo();    // Upon clicking demo link
  
});

