const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const Datastore = require('nedb');

const CLIENT_ID = 'your-google-client-id';

const app = express();
const db = new Datastore({ filename: 'users.db', autoload: true });

// Middleware for handling incoming requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Route for handling OAuth2 callback from Google
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;

  try {
    // Create a new OAuth2Client and set its credentials
    const oAuth2Client = new OAuth2Client(CLIENT_ID);
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Use the Google API to obtain the user's profile information
    const { data } = await oAuth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json',
    });

    // Create a new user object and insert it into the NeDB database
    const user = {
      googleId: data.id,
      name: data.name,
      email: data.email,
      picture: data.picture,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    };
    db.insert(user, (err, newUser) => {
      if (err) console.error(err);
      console.log('User data saved:', newUser);
    });

    // Redirect the user to the homepage or some other page
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server and listen for incoming requests
app.listen(3000, () => {
  console.log('Server started on port 3000');
});