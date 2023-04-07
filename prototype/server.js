const express = require('express');
import fetch from "node-fetch";
const app = express();

const apiKey = 'd2ae45b1e88742959ed68671b3217c20'; 

// set the view engine to ejs
app.set('view engine', 'ejs');

// define route for homepage
app.get('/', (req, res) => {
  res.render('index');
});

// define route to handle search form submission
app.get('/search', async (req, res) => {
  const gameName = req.query.game_name;
  const gamePlatform = req.query.game_platform;

  // make API request to RAWG database
  const response = await fetch(`https://accujazz-rawg-video-games-database.p.rapidapi.com/games?search=${gameName}&platforms=${gamePlatform}`, {
    headers: {
      'x-rapidapi-host': 'accujazz-rawg-video-games-database.p.rapidapi.com',
      'x-rapidapi-key': apiKey,
      'useQueryString': true,
      'User-Agent': 'Chrome/93.0.4577.63'
    }
  });

  const data = await response.json();
  const games = data.results;

  // render search results template with the game data
  res.render('search-results', { games });
});

// start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});