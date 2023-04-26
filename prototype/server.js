const express = require('express');
const fetch = require('node-fetch');
const app = express();
require('dotenv').config();

const SteamAPI = require('steamapi');
const steam = new SteamAPI(process.env.STEAM_API_KEY);
const RapidAPIKey = process.env.RAPID_API_KEY;


const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const Datastore = require('nedb');
const db = new Datastore({ filename: 'users.db', autoload: true })

// set the view engine to ejs
app.set('view engine', 'ejs');

// define route for homepage
app.get('/', (req, res) => {
  const client_id = GOOGLE_CLIENT_ID; // 'your_client_id
  const redirect_uri = 'http://localhost:3000/auth/google/callback';
  res.render('index', { client_id, redirect_uri});
});

//Alex's steamID to use for testing => 76561198076491240 
//another random one we can use => 76561198146931523
// define route to handle search form submission
app.get('/search', async (req, res) => {
  const steam_id = req.query.steam_id;
  
  //can see the format of the data returned by the following function in the readme in the docs folder
  const data = await RetrieveUserData(steam_id);
});

// const port = process.env.TEST;
// console.log(`Your port is ${port}`);


// define route for Google authentication callback
app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;

  // exchange the authorization code for an access token
  const { access_token } = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      code: code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: 'http://localhost:3000/auth/google/callback',
      grant_type: 'authorization_code'
    })
  }).then(res => res.json());

  // use the access token to retrieve the user's profile information
  const { email, given_name, family_name } = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
    headers: {
      'Authorization': `Bearer ${access_token}`
    }
  }).then(res => res.json());

  
  // render the user profile information
  res.render('profile', { email, given_name, family_name });

  // create a user object to store into NeDB database
  const user =
  {
    email: email,
    firstName: given_name,
    lastName: family_name
  };

  // insert user object into database
  db.insert(user, (err, newUser) =>
  {
    if(err) console.error(err);
    console.log('User data stored:', newUser);
  })

});

//for testing
// RetrieveUserData('76561198076491240').then(out => {
//   console.log(out);
//   console.log(out.userRecentGames['Deep Rock Galactic']);
// });

//gets user summary and recent games played
async function RetrieveUserData(steam_id){
  output = {};
  output.userRecentGames = {};

  //retrieve user data, profile pic, name, etc...
  try{
    const userSummary = await steam.getUserSummary(steam_id);
    output.userAvatar = userSummary.avatar.medium;
    output.userName = userSummary.nickname;
    output.userProfileURL = userSummary.url;
    //console.log(userSummary);
  } catch (err) {
    console.error(err);
  }

  //retrieve user recent games
  try{
    const userRecentGames = await steam.getUserRecentGames(steam_id);
    for (let i = 0; i < userRecentGames.length; i++) {
      //uncomment this to get news for each game, using the other function for testing so we dont waste api calls

      // const out = await RetrieveGameNews(userRecentGames[i].name);
      // output.userRecentGames[userRecentGames[i].name] = out;

      const out = await RetrieveRecentNews();
      output.userRecentGames[userRecentGames[i].name] = out;
    }
  } catch(err) {
    console.error(err);
  }

  // console.log('\n\n');
  return output;
}

//retrieves game news from specified game title
async function RetrieveGameNews(gameTitle) {
  const url = `https://videogames-news2.p.rapidapi.com/videogames_news/search_news?query=${gameTitle}`;

  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RapidAPIKey,
      'X-RapidAPI-Host': 'videogames-news2.p.rapidapi.com'
    }
  };

  try {
    const response = await fetch(url, options);
    const json = await response.json();
    return json;
  } catch (err) {
    console.error('error:', err);
    return null;
  }
}

//this is for testing, doesnt use players recent games
async function RetrieveRecentNews() {
  const url = 'https://videogames-news2.p.rapidapi.com/videogames_news/recent';

  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RapidAPIKey,
      'X-RapidAPI-Host': 'videogames-news2.p.rapidapi.com'
    }
  };

  try {
    const response = await fetch(url, options);
    const json = await response.json();
    return json;
  } catch (err) {
    console.error('error:', err);
    return null;
  }
}


// start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});