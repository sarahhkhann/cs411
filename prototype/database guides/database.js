// WIP tentatively using MongoDB to store user login information
// Will be working and tweaking shit within this, this is just a skeleton from ChatGPT for my sake

// 1: Creating database
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost.27017';
const DBName = 'projectDB';

// 2: Design database scheme (WIP)

// 3: Connecting to database from our app
MongoClient.connect(url, function(err, client) {
    if (err) throw err;
    console.log("Connected successfully to database");
    const db = client.db(dbName);
  
// Step 4: Write queries to insert and retrieve data
// For example, to insert a new user:
    const username = 'alice';
    const password = 'mypassword';
    const collection = db.collection('users');
    collection.insertOne({ username: username, password: password }, function(err, result) {
      if (err) throw err;
      console.log("User inserted");
      client.close();
    });
  
// And to retrieve a user's password by their username:
    const query = { username: 'alice' };
    collection.findOne(query, function(err, result) {
      if (err) throw err;
      console.log(result.password);
      client.close();
    });
  });
  
// Step 5: Integrate with your web app
// For example, to handle a user login form submission:
  const express = require('express');
  const app = express();
  const bodyParser = require('body-parser');
  
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  
  app.post('/login', function(req, res) {
    const username = req.body.username;
    const password = req.body.password;
    MongoClient.connect(url, function(err, client) {
      if (err) throw err;
      const db = client.db(dbName);
      const query = { username: username };
      db.collection('users').findOne(query, function(err, result) {
        if (err) throw err;
        if (result && result.password === password) {
          res.send('Login successful!');
        } else {
          res.send('Login failed.');
        }
        client.close();
      });
    });
  });
  
  app.listen(3000, function() {
    console.log('Listening on port 3000');
  });

