const express = require('express');
const fetch = require('node-fetch');
const app = express();
require('dotenv').config();

const SteamAPI = require('steamapi');
const steam = new SteamAPI(process.env.STEAM_API_KEY);
const RapidAPIKey = process.env.RAPID_API_KEY;
const bcrypt = require('bcrypt');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const GOOGLE_CLIENT_ID = '49445260514-bvouskakjlmctdsm3o341arcoid6fqts.apps.googleusercontent.com'

// set the view engine to ejs
app.set('view engine', 'ejs');

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// define route for homepage
app.get('/', (req, res) => {
  const client_id = '49445260514-bvouskakjlmctdsm3o341arcoid6fqts.apps.googleusercontent.com'; // 'your_client_id
  const redirect_uri = 'http://localhost:3000/auth/google/callback';
  res.render('index', { client_id, redirect_uri});
});

// define route for regsitration page 
app.get('/register', function(req, res) {
  res.render('register');
});

// define route for login page 
app.get('/login', function(req, res) {
  res.render('login');
});


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////DATABASE////////////////////////////////////////////////////////
const sqlite3 = require('sqlite3').verbose();

// open the database connection
const db = new sqlite3.Database('mydatabase.db');

// create the users table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT,
      email TEXT,
      password TEXT,
      confirm_password TEXT
    )
  `, (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('Users table created successfully.');
    }
  });
});


// handle the form data and insert it into the database
app.post('/register', (req, res) => {
  // Check if the request body exists and contains the expected properties
  if (!req.body || !req.body.name || !req.body.email || !req.body.password || !req.body.confirm_password) {
    res.status(400).send('Invalid request bodyyyyy.');
    return;
  }

  // Get the form data from the request body
  const { name, email, password, confirm_password } = req.body;

  // Check if the passwords match
  if (password !== confirm_password) {
    res.status(400).send('Passwords do not match.');
    return;
  }

  // Hash the password and store it in the database
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error(err.message);
      res.send('Error registering user.');
    } else {
      db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword], (err) => {
        if (err) {
          console.error(err.message);
          res.send('Error registering user.');
        } else {
          res.render('profile');
        }
      });
    }
  });
});

// close the database connection when the application is done
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Closed the database connection.');
    process.exit(0);
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////handling existing users///////////////////////////////////////////////////////
// handle login request
app.post('/login', (req, res) => {
  // Check if the request body exists and contains the expected properties
  if (!req.body || !req.body.email || !req.body.password) {
    console.log(Here)
    res.status(400).send('invalid request bodyyyy.');
    return;
  }

  // Get the login data from the request body
  const { email, password } = req.body;

  // Check if user with given email exists in the database
  db.get('SELECT * FROM users WHERE email = ?', email, (err, row) => {
    if (err) {
      console.error(err.message);
      res.send('Error logging in.');
    } else if (!row) {
      // User with given email does not exist in the database
      res.status(401).send('Invalid email or password.');
    } else {
      // User with given email exists, compare passwords
      bcrypt.compare(password, row.password, (err, result) => {
        if (result) {
          // Passwords match, login successful
          //res.send('Login successful.');
          res.render('profile')
        } else {
          // Passwords do not match
          res.status(401).send('Invalid email or password.');
        }
      });
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////



//Alex's steamID to use for testing => 76561198076491240 
//another random one we can use => 76561198146931523
// define route to handle search form submission
/*app.post('/steam', async (req, res) => {
  const steam_id = req.body.steam_id;
  console.log(steam_id)
  const userSummary = steam.getUserSummary(steam_id)
  .then(userSummary => {
    console.log("Hello world");
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
  */

//gets user summary and recent games played
async function RetrieveUserData(steam_id){
  output = {};
  output.userRecentGames = {};

  //retrieve user data, profile pic, name, etc...
  try{
    const userSummary = await steam.getUserSummary(steam_id);
    output.userAvatar = userSummary.avatar.large;
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

app.post('/steam', async (req, res) => {
  const steam_id = req.body.steam_id;
  console.log(steam_id)

  // Call the RetrieveUserData function with the steam_id
  const userData = await RetrieveUserData(steam_id);
  
  // Render the EJS template with the retrieved user data
  res.render('steam', { userData: userData });
});

// start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});