const { google } = require('googleapis');
const nedb = require('nedb');
const db = new nedb({ filename: 'users.db', autoload: true });

// configure Google OAuth2 credentials
const { client_id, client_secret, redirect_uris } = require('./credentials.json').web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// get Google user profile data and store it in NeDB
async function saveUserProfile(token) 
{
  const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
  const { data } = await oauth2.userinfo.get();
  const user = 
  {
    name: data.name,
    email: data.email,
    picture: data.picture,
    token: token
  };
  db.insert(user, (err, newUser) => 
  {
    if (err) console.error(err);
    console.log('User data saved:', newUser);
  });
}

// callback function to handle Google OAuth2 redirect
function handleOAuth2Callback(req, res) 
{
  const code = req.query.code;
  oAuth2Client.getToken(code, (err, token) => 
  {
    if (err) return console.error('Error retrieving access token', err);
    oAuth2Client.setCredentials(token);
    saveUserProfile(token);
    res.redirect('/'); // redirect to home page after successful authentication
  });
}

// example usage: initiate Google OAuth2 flow
app.get('/auth/google', (req, res) => 
{
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email']
  });
  res.redirect(authUrl);
});

// example usage: handle Google OAuth2 callback
app.get('/auth/google/callback', handleOAuth2Callback);