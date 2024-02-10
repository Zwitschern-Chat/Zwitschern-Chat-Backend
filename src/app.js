// Imports
const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const cors = require('cors');
const sanitizeHtml = require('sanitize-html');
require('dotenv').config()

const corsOptions = {
  origin: '*', 
  optionsSuccessStatus: 200 
};

// Running the server on port 3000
const port = 3000;

app.use(cors(corsOptions));

// Middleware for parsing JSON requests
app.use(express.json()); 
// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Function for checking command-line arguments
function checkForDevArg() {
  return process.argv.includes('-dev'); // Use the command "node app.js -dev" to use the local database.
}

// Decide which database configuration to use based on the argument
// If the '-dev' argument is present, 'localhost' will be used as the host
// Otherwise, the production database configuration will be used.
const dbConfig = checkForDevArg() ? {
  host: process.env.DB_HOST_API_DEV,
  user: process.env.DB_USER_API_DEV,
  port: process.env.DB_PORT_API_DEV,
  database: process.env.DB_NAME_API_DEV
} : {
  host: process.env.DB_HOST_API_PROD,
  user: process.env.DB_USER_API_PROD,
  port: process.env.DB_PORT_API_PROD,
  password: process.env.DB_PASSWORD_API_PROD,
  database: process.env.DB_NAME_API_PROD
};

// Endpoint for retrieving all posts
app.get('/api/v1.0/posts', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [rows, fields] = await connection.execute('SELECT * FROM post;');
    
    await connection.end();

    if (rows.length === 0) {
      res.status(404).send('No posts found.');
    } else {
      res.json(rows);
    }
    
  } catch (error) {
    console.error('Error accessing the database: ', error.message);
    res.status(500).send('Error accessing the database: ', error.message);
  }
});

// Endpoint for retrieving a post by post ID
app.get('/api/v1.0/post/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute('SELECT * FROM post WHERE id = ?;', [req.params.id]);
    await connection.end();

    if (rows.length === 0) {
      res.status(404).send('Post not found.');
    } else {
      res.json(rows[0]);
    }
  } catch (error) {
    console.error('Error accessing the database: ', error.message);
    res.status(500).send('Error accessing the database: ', error.message);
  }
});

// Endpoint for retrieving all users (excluding sensitive data)
app.get('/api/v1.0/users', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute('SELECT number, username, profile_picture FROM user;');
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error accessing the database: ', error.message);
    res.status(500).send('Error accessing the database: ', error.message);
  }
});

// Endpoint for retrieving information of a user based on user number
app.get('/api/v1.0/user_num/:number', async (req, res) => {
  let { number } = req.params;

  // To prevent sql injection, xss and other attacks here use sanitize-html package
  number = sanitizeHtml(number, {
    allowedTags: [],
    allowedAttributes: {}
  });

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute('SELECT username, profile_picture, created_at, bio FROM user WHERE number = ?;', [number]);
    await connection.end();

    if (rows.length === 0) {
      res.status(404).send('User not found.');
    } else {
      res.json(rows[0]);
    }
  } catch (error) {
    console.error('Error accessing the database: ', error.message);
    res.status(500).send('Error accessing the database: ', error.message);
  }
});

// Endpoint for retrieving information of a user based on username
app.get('/api/v1.0/user/:username', async (req, res) => {
  let { username } = req.params;

  // To prevent sql injection, xss and other attacks here use sanitize-html package
  username = sanitizeHtml(username, {
    allowedTags: [],
    allowedAttributes: {}
  });

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute('SELECT number, profile_picture, created_at, bio FROM user WHERE username = ?;', [username]);
    await connection.end();

    if (rows.length === 0) {
      res.status(404).send('User not found.');
    } else {
      res.json(rows[0]);
    }
  } catch (error) {
    console.error('Error accessing the database: ', error.message);
    res.status(500).send('Error accessing the database: ', error.message);
  }
});

// Endpoint for retrieving own user information based on sub (Auth0 identifier)
app.get('/api/v1.0/user_sub/:sub', async (req, res) => {
  let { sub } = req.params;

  // To prevent sql injection, xss and other attacks here use sanitize-html package
  sub = sanitizeHtml(sub, {
    allowedTags: [],
    allowedAttributes: {}
  });

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute('SELECT * FROM user WHERE sub = ?;', [sub]);
    await connection.end();

    if (rows.length === 0) {
      res.status(404).send('User not found.');
    } else {
      res.json(rows[0]);
    }
  } catch (error) {
    console.error('Error accessing the database: ', error.message);
    res.status(500).send('Error accessing the database: ', error.message);
  }
});

// Endpoint for retrieving all posts from a user based on user number
app.get('/api/v1.0/user_posts/:user_number', async (req, res) => {
  let { user_number } = req.params;

  // To prevent sql injection, xss and other attacks here use sanitize-html package
  user_number = sanitizeHtml(user_number, {
    allowedTags: [],
    allowedAttributes: {}
  });

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute('SELECT * FROM post WHERE user_number = ?;', [user_number]);
    await connection.end();

    if (rows.length === 0) {
      res.status(404).send('No posts found.');
    } else {
      res.json(rows);
    }
  } catch (error) {
    console.error('Error accessing the database: ', error.message);
    res.status(500).send('Error accessing the database: ', error.message);
  }
});

// Endpoint to get user_number from post by id
app.get('/api/v1.0/post_user/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute('SELECT user_number FROM post WHERE id = ?;', [req.params.id]);
    await connection.end();

    if (rows.length === 0) {
      res.status(404).send('Post not found.');
    } else {
      res.json(rows[0]);
    }
  } catch (error) {
    console.error('Error accessing the database: ', error.message);
    res.status(500).send('Error accessing the database: ', error.message);
  }
});

// Start the server
app.listen(port, () => {
// Outputs a message indicating which configuration is being used
  if (checkForDevArg()) {
    console.log(`Entwicklungsmodus aktiviert: API hört auf Port ${port} (lokal)`);
  } else {
    console.log(`Produktionsmodus aktiviert: API hört auf Port ${port} (live)`);
  }
});
