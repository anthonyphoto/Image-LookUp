'use strict';

const weatherKey = '9618a8d8432940b2ef54e1ec33601bab';
const weatherEndpoint = 'https://api.openweathermap.org/data/2.5/weather'

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

    $('html').animate({
      scrollTop: $("#js-rpt").offset().top
    }, 'slow');
    // $(window).scrollTop( $("#js-rpt").offset().top );
  });
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

        $('html').animate({
          scrollTop: $("#js-rpt").offset().top
        }, 'slow');
        // $(window).scrollTop( $("#js-rpt").offset().top ); /* Page scroll to result page */
      });
    }
  });
}

$(_ => {
  handleSubmit();  // Upon submitting an image
  handleDemo();    // Upon clicking demo link  
});
