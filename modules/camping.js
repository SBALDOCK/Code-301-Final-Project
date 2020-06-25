'use strict';

const queryTypeString = 'camping';

const express = require('express');
const app = express();

const pg = require('pg');
const superagent = require('superagent');
require('ejs');
require('dotenv').config();

// const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.log(err));

client.connect();

const getCampgrounds = (location, response) => {
  //START-CONSOLE-TESTING
  // console.log('getCampgrounds');
  // console.log(location)
  //END-CONSOLE-TESTING
  let sqlSelect = 'SELECT api_id FROM camping;';
  client.query(sqlSelect)
    .then(sqlData => {
      //START-CONSOLE-TESTING
      // console.log('getCampgrounds, DB api_ids:');
      // console.log(sqlData.rows);
      //END-CONSOLE-TESTING
      getCampgroundsFromAPI(sqlData.rows, location, response);
    })
    .catch(error => {
      console.error('Error checking cache for favorited trails');
      console.error(error);
    });
}

const getCampgroundsFromAPI = (apiIDsFromCache, location, response) => {
  //START-CONSOLE-TESTING
  // console.log('getCampgroundsFromAPI, location:');
  // console.log(location);
  //END-CONSOLE-TESTING
  let apiUrl = 'https://developer.nps.gov/api/v1/parks';
  let apiParams = {
    q: location.search_query,
    limit: 10,
    api_key: process.env.CAMPING_API_KEY
  };
  superagent.get(apiUrl, apiParams)
    .then(apiData => {
      //START-CONSOLE-TESTING
      // console.log('Camping apiData.body.data:');
      // console.log(apiData.body.data);
      //END-CONSOLE-TESTING
      //flatten the array from an array of objects with a single key-value pair, to
      //an array of numbers
      apiIDsFromCache = apiIDsFromCache.map(sqlObject => sqlObject.api_id);
      let campingArray = apiData.body.data.map(oneCamp => {
        //START-CONSOLE-TESTING
        // console.log('oneCamp.images:');
        // console.log(oneCamp.images);
        //END-CONSOLE-TESTING
        let newCampground = new Camp(oneCamp);
        newCampground.cached = apiIDsFromCache.includes(oneCamp.id.toString());
        return newCampground;
      });
      //START-CONSOLE-TESTING
      // console.log('this is my campingArray', campingArray);

      //END-CONSOLE-TESTING
      response.status(200).render('results.ejs',
        {
          queryType: queryTypeString,
          userName: location.userName,
          campResults: campingArray
        });
    })
    .catch(error => {
      console.error('error', error)
    });

}

module.exports.getCampgrounds = getCampgrounds;

function Camp(obj) {
  let placeholderImage = './public/images/weekend_warrior_imagenotavailable.png'
  this.api_id = obj.id;
  this.cached = false;
  this.images = obj.images[0].url ? obj.images[0].url : placeholderImage;
  this.name = obj.name ? obj.name : 'No name available';
  this.latitude = obj.latitude ? obj.latitude : 0.0;
  this.longitude = obj.longitude ? obj.longitude : 0.0;
  this.description = obj.description ? obj.description : 'No description available';
  this.entranceFees = obj.entranceFees ? obj.entranceFees : 'No info available';
  this.activities = obj.activities ? obj.activities : 'No info available';
}


// contacts: [Object],
// states: 'WA',
// longitude: '-121.2069423',
// activities: [Array],
// entranceFees: [Array],
// directionsInfo: 'Access to North Cascades National Park and Ross Lake National Recreation Area is from the State Route 20 corridor. SR 20 (North Cascades Highway) connects with Interstate 5 (Exit 230) at Burlington. From the east, the highway intersects with US 97 at Okanogan and with SR 153 at Twisp. The State Department of Transportation closes a portion of the road between Ross Dam Trailhead and Lone Fir Campground in winter. The Lake Chelan National Recreation Area (Stehekin) is accessible by ferry or plane from Chelan.',
// entrancePasses: [Array],
// directionsUrl: 'http://www.nps.gov/noca/planyourvisit/directions.htm',
// url: 'https://www.nps.gov/noca/index.htm',
// weatherInfo: "The best weather for visiting the North Cascades generally occurs between mid-June and late-September. Summer daytime temperatures average in the 70's F. Snow is off most trails by mid-July. Autumn and Spring are popular for color and wildlife. Storms are common: always be prepared for a few days of rain and wind. The east side of the Cascade Mountains (Lake Chelan National Recreation Area) is drier and warmer in the summer than the west side. Summer temperatures at Stehekin reach the 90's F.",
// name: 'North Cascades',
// operatingHours: [Array],
// topics: [Array],
// latLong: 'lat:48.71171756, long:-121.2069423',
// description: "Less than three hours from Seattle, an alpine landscape beckons. Discover communities of life adapted to moisture in the west and recurring fire in the east. Explore jagged peaks crowned by more than 300 glaciers. Listen to cascading waters in forested valleys. Witness a landscape sensitive to the Earth's changing climate. Help steward the ecological heart of the Cascades.",
// images: [Array],
// designation: 'National Park',
// parkCode: 'noca',
// addresses: [Array],
// id: '80EB184D-4B6D-4AD2-B6E2-CAAD6312B27D',
// fullName: 'North Cascades National Park',
// latitude: '48.71171756'
