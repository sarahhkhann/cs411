const express = require('express');
const fetch = require('node-fetch');
const app = express();
require('dotenv').config();

const SteamAPI = require('steamapi');
const steam = new SteamAPI(process.env.STEAM_API_KEY);
const RapidAPIKey = process.env.RAPID_API_KEY;


const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// set the view engine to ejs
app.set('view engine', 'ejs');

// define route for homepage
app.get('/', (req, res) => {
  const client_id = '49445260514-bvouskakjlmctdsm3o341arcoid6fqts.apps.googleusercontent.com'; // 'your_client_id
  const redirect_uri = 'http://localhost:3000/auth/google/callback';
  res.render('index', { client_id, redirect_uri});
});

//Alex's steamID to use for testing => 76561198076491240 
//another random one we can use => 76561198146931523
// define route to handle search form submission
app.get('/search', async (req, res) => {
  const steam_id = req.query.steam_id;
  const userSummary = steam.getUserSummary(steam_id)
    .then(userSummary => {
      // console.log(userSummary);
      const user_avatar = userSummary.avatar.medium;
      const user_name = userSummary.nickname;

      console.log(user_avatar);
      console.log(user_name);
    })
    .catch(error => {
      console.error(error);
    });

  const userRecentGames = steam.getUserRecentGames(steam_id)
    .then(userRecentGames => {
      for (let i = 0; i < userRecentGames.length; i++) {
        console.log(userRecentGames[i].name);
      }
      //console.log(userRecentGames);
      //const userGame1 = userRecentGames[0].name;
      // const user_name = userSummary.nickname;
      //console.log(userGame1);
      // console.log(user_name);
    })
    .catch(error => {
      console.error(error);
    });
});

//this is for testing, doesnt use players recent games
const url = 'https://videogames-news2.p.rapidapi.com/videogames_news/recent';
const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': RapidAPIKey,
    'X-RapidAPI-Host': 'videogames-news2.p.rapidapi.com'
  }
};
fetch(url, options)
	.then(res => res.json())
	.then(json => console.log(json))
	.catch(err => console.error('error:' + err));
  
// const url = 'https://videogames-news2.p.rapidapi.com/videogames_news/search_news?query=GTA';

// const options = {
//   method: 'GET',
//   headers: {
//     'X-RapidAPI-Key': '3a0658e8bdmshacb124ac4515456p101be7jsna2b797243cc4',
//     'X-RapidAPI-Host': 'videogames-news2.p.rapidapi.com'
//   }
// };

// fetch(url, options)
// 	.then(res => res.json())
// 	.then(json => console.log(json))
// 	.catch(err => console.error('error:' + err));

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
});




// start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});