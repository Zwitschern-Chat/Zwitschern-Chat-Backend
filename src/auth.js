// Imports
const express = require('express');
const app = express();
const { auth, requiresAuth } = require('express-openid-connect');
require('dotenv').config()
const mysql = require('mysql2/promise');
const sanitizeHtml = require('sanitize-html');

// Decide which database configuration to use based on the argument
// If the '-dev' argument is present, 'localhost' will be used as the host
// Otherwise, the production database configuration will be used.
const dbConfig = checkForDevArg() ? {
  host: 'localhost',
  user: 'root',
  port: '3306',
  database: 'zwitschern'
} : {
  host: '45.81.234.35',
  user: 'auth',
  port: '3306',
  password: 'qN.SO-f.xK1D*uNT',
  database: 'zwitschern'
};

// Auth0 configuration
const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.SECRET,   // Secrect import from .env file
    baseURL: 'https://zwitschern.chat/auth',
    clientID: '6dHWgZ691XG9pTlUar21zBrdVEvctyFP',
    issuerBaseURL: 'https://dev-x6a4ln1r3kk4uz5p.us.auth0.com'
  };
app.use(auth(config));

// Running the server on port 5000
const port = 5000;

// Function for checking command-line arguments
function checkForDevArg() {
  return process.argv.includes('-dev'); // Use the command "node app.js -dev" to use the local database.
}

// Middleware for parsing JSON requests
app.use(express.json());


// Middleware to check and update user data in database after each authentication
app.use(async (req, res, next) => {
  if (req.oidc.isAuthenticated()) {

    const userData = {
      username: req.oidc.user.nickname,
      profile_picture: req.oidc.user.picture,
      sub: req.oidc.user.sub
    };

    try {
      const connection = await mysql.createConnection(dbConfig);
      // Check if a user with the same sub already exists
      const checkUserSql = `SELECT sub FROM user WHERE sub = ? LIMIT 1;`;
      const [users] = await connection.execute(checkUserSql, [userData.sub]);

      if (users.length > 0) {
        const user = users[0];
        // User already exists, optionally update the username and profile picture
        const updateSql = `UPDATE user SET username = ?, profile_picture = ? WHERE sub = ?;`;
        await connection.execute(updateSql, [userData.username, userData.profile_picture, userData.sub]);
        console.log('Userdata updated.');
      } else {
        // User does not exist, insert the new user
        const insertSql = `INSERT INTO user (sub, username, profile_picture) VALUES (?, ?, ?);`;
        await connection.execute(insertSql, [userData.sub, userData.username, userData.profile_picture]);
        console.log('New user created.');
      }

      await connection.end();
    } catch (error) {
      console.error('Error accessing the database: ', error.message);
    }
  }
  next();
});


// Endpoint to create a new post as chat message from a user
app.post('/auth/post', requiresAuth(), async (req, res) => {
  const sub = req.oidc.user.sub;
  let { message, user_number } = req.body; // Get data from the request body

    // Prevent sql injection, xss and other attacks here use sanitize-html package  
    message = sanitizeHtml(message, {
      allowedTags: [],
      allowedAttributes: {}
    });
    user_number = sanitizeHtml(user_number, {
      allowedTags: [],
      allowedAttributes: {}
    });

  // Use sub for to get number to compare with user_number
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute('SELECT number FROM user WHERE sub = ?;', [sub]);
    await connection.end();

    if (rows.length === 0) {
      res.status(404).send('User not found.');
    } else {
      number = rows[0].number;
    }
  } catch (error) {
    console.error('Error accessing the database: ', error.message);
    res.status(500).send('Error accessing the database: ', error.message);
  }

  if (user_number != number) {
    return res.status(403).send('Not authorized! ' + user_number + '!=' + number);
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute('INSERT INTO post (message, user_number) VALUES (?, ?);', [message, user_number]);
    await connection.end();
    res.json({ success: true, message: 'Post created successfully.', postId: rows.insertId });
  } catch (error) {
    console.error('Error accessing the database: ', error.message);
    res.status(500).send('Error accessing the database: ', error.message);
  }
});


// Endpoint to get all user data from auth0 
app.get('/auth/user', requiresAuth(), (req, res) => {
  res.json(req.oidc.user);
});

// Login and redirect to home
app.get('/auth/login', requiresAuth(), (req, res) => {
  res.redirect('https://zwitschern.chat');
  });

// Account and redirect to account
app.get('/auth/account', requiresAuth(), (req, res) => {
  res.redirect('/account');
});
  
// Logout and redirect to home
app.get('/auth/logout', (req, res) => {
  res.oidc.logout({
    returnTo: 'https://zwitschern.chat',
  });
});

// Only to debug: Check if user is logged in or not
app.get('/auth/check', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

// Callback get for auth0 needed
app.get('/auth/callback', (req, res) => {
  res.oidc.callback({
    redirectUri: 'http://localhost:3000/callback',
  });
});

// Callback post for auth0 needed
app.post('/auth/callback', express.urlencoded({ extended: false }), (req, res) =>
res.oidc.callback({
  redirectUri: 'http://localhost:3000/callback',
  }
));
    
// Start the server
app.listen(port, () => {
  // Outputs a message indicating which configuration is being used
  if (checkForDevArg()) {
    console.log(`Entwicklungsmodus aktiviert: AUTH hört auf Port ${port} (lokal)`);
  } else {
    console.log(`Produktionsmodus aktiviert: AUTH hört auf Port ${port} (live)`);
  }
});

  