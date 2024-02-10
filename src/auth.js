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
  host: process.env.DB_HOST_AUTH_DEV,
  user: process.env.DB_USER_AUTH_DEV,
  port: process.env.DB_PORT_AUTH_DEV,
  database: process.env.DB_NAME_AUTH_DEV
} : {
  host: process.env.DB_HOST_AUTH_PROD,
  user: process.env.DB_USER_AUTH_PROD,
  port: process.env.DB_PORT_AUTH_PROD,
  password: process.env.DB_PASSWORD_AUTH_PROD,
  database: process.env.DB_NAME_AUTH_PROD
};

// Auth0 configuration
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SECRET,
  baseURL: process.env.BASE_URL,
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: process.env.ISSUER_BASE_URL
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
        // User already exists, optionally update profile picture
        const updateSql = `UPDATE user SET profile_picture = ? WHERE sub = ?;`;
        await connection.execute(updateSql, [userData.profile_picture, userData.sub]);
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
app.post('/auth/v1.0/post', requiresAuth(), async (req, res) => {
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

// Endpoint to change own username, checks if user is logged (get sub, and compare user_number with number) in and if the username is not already taken
app.post('/auth/v1.0/username', requiresAuth(), async (req, res) => {
  const sub = req.oidc.user.sub;
  let { username, user_number } = req.body; // Get data from the request body

  // Prevent sql injection, xss and other attacks here use sanitize-html package  
  username = sanitizeHtml(username, {
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
    const [rows, fields] = await connection.execute('SELECT number FROM user WHERE username = ?;', [username]);
    await connection.end();

    if (rows.length > 0) {
      return res.status(409).send('Username already taken.');
    }
  } catch (error) {
    console.error('Error accessing the database: ', error.message);
    res.status(500).send('Error accessing the database: ', error.message);
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute('UPDATE user SET username = ? WHERE sub = ?;', [username, sub]);
    await connection.end();
    res.json({ success: true, message: 'Username changed successfully.' });
  } catch (error) {
    console.error('Error accessing the database: ', error.message);
    res.status(500).send('Error accessing the database: ', error.message);
  }
});

// Endpoint to change own bio, checks if user is logged (get sub, and compare user_number with number)
app.post('/auth/v1.0/bio', requiresAuth(), async (req, res) => {
  const sub = req.oidc.user.sub;
  let { bio, user_number } = req.body; // Get data from the request body

  // Prevent sql injection, xss and other attacks here use sanitize-html package  
  bio = sanitizeHtml(bio, {
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
    const [rows, fields] = await connection.execute('UPDATE user SET bio = ? WHERE sub = ?;', [bio, sub]);
    await connection.end();
    res.json({ success: true, message: 'Bio changed successfully.' });
  } catch (error) {
    console.error('Error accessing the database: ', error.message);
    res.status(500).send('Error accessing the database: ', error.message);
  }
});

// Endpoint to change own message, checks if user is logged (get sub to get number & get user_number from post by id '/api/v1.0/post_user/:id' and compare user_number with number)
app.put('/auth/v1.0/post/:id', requiresAuth(), async (req, res) => {
  const sub = req.oidc.user.sub;
  let { message} = req.body; // Get data from the request body

  // Prevent sql injection, xss and other attacks here use sanitize-html package  
  message = sanitizeHtml(message, {
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

  // Use id to get user_number to compare with number
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute('SELECT user_number FROM post WHERE id = ?;', [req.params.id]);
    await connection.end();

    if (rows.length === 0) {
      res.status(404).send('Post not found.');
    } else {
      user_number = rows[0].user_number;
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
    const [rows, fields] = await connection.execute('UPDATE post SET message = ? WHERE id = ?;', [message, req.params.id]);
    await connection.end();
    res.json({ success: true, message: 'Post changed successfully.' });
  } catch (error) {
    console.error('Error accessing the database: ', error.message);
    res.status(500).send('Error accessing the database: ', error.message);
  }
});

// Endpoint to delete own message, checks if user is logged (get sub to get number & get user_number from post by id '/api/v1.0/post_user/:id' and compare user_number with number)
app.delete('/auth/v1.0/post/:id', requiresAuth(), async (req, res) => {
  const sub = req.oidc.user.sub;
  let user_number;

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

  // Use id to get user_number to compare with number
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute('SELECT user_number FROM post WHERE id = ?;', [req.params.id]);
    await connection.end();

    if (rows.length === 0) {
      res.status(404).send('Post not found.');
    } else {
      user_number = rows[0].user_number;
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
    const [rows, fields] = await connection.execute('DELETE FROM post WHERE id = ?;', [req.params.id]);
    await connection.end();
    res.json({ success: true, message: 'Post deleted successfully.' });
  } catch (error) {
    console.error('Error accessing the database: ', error.message);
    res.status(500).send('Error accessing the database: ', error.message);
  }
});


// Endpoint to get all user data from auth0 
app.get('/auth/v1.0/user', requiresAuth(), (req, res) => {
  res.json(req.oidc.user);
});

// Login and redirect to home
app.get('/auth/v1.0/login', requiresAuth(), (req, res) => {
  res.redirect('https://zwitschern.chat');
  });

// User profile and redirect to profile
app.get('/auth/v1.0/profile', requiresAuth(), (req, res) => {
  res.redirect('/profile');
});
  
// Logout and redirect to home
app.get('/auth/v1.0/logout', (req, res) => {
  res.oidc.logout({
    returnTo: 'https://zwitschern.chat',
  });
});

// Check if user is logged in or not
app.get('/auth/v1.0/check', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

// Callback get for auth0 needed
app.get('/auth/v1.0/callback', (req, res) => {
  res.oidc.callback({
    redirectUri: 'http://localhost:3000/callback',
  });
});

// Callback post for auth0 needed
app.post('/auth/v1.0/callback', express.urlencoded({ extended: false }), (req, res) =>
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

  