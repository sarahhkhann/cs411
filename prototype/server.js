const express = require('express');
const fetch = require('node-fetch');
const app = express();

const SteamAPI = require('steamapi');
const steam = new SteamAPI('9F8C1996E787E164C62A6FB2C317AA21');

// set the view engine to ejs
app.set('view engine', 'ejs');

// define route for homepage
app.get('/', (req, res) => {
  res.render('index');
});

// define route to handle search form submission
app.get('/search', async (req, res) => {
  const steam_id = req.query.steam_id;
  const userSummary = steam.getUserSummary(steam_id)
    .then(userSummary => {
      console.log(userSummary);
    })
    .catch(error => {
      console.error(error);
    });

  const user_avatar = userSummary.avatar;
  const user_name = userSummary.nickname;
  console.log(user_avatar);
  console.log(user_name);
});

// start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});