// Imports
const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const cors = require('cors');
const sanitizeHtml = require('sanitize-html');

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
  host: 'localhost',
  user: 'root',
  port: '3306',
  database: 'zwitschern'
} : {
  host: '45.81.234.35',
  user: 'api',
  port: '3306',
  password: 'P[u5t9.eB0R1LLVK',
  database: 'zwitschern'
};

// Endpoint for retrieving all posts
app.get('/api/posts', async (req, res) => {
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
app.get('/api/post/:id', async (req, res) => {
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
app.get('/api/users', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute('SELECT user_number, username, profile_picture FROM user;');
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error accessing the database: ', error.message);
    res.status(500).send('Error accessing the database: ', error.message);
  }
});

// Endpoint for retrieving information of a user based on user number
app.get('/api/user_num/:number', async (req, res) => {
  let { number } = req.params;

  // To prevent sql injection, xss and other attacks here use sanitize-html package
  number = sanitizeHtml(number, {
    allowedTags: [],
    allowedAttributes: {}
  });

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute('SELECT username, profile_picture FROM user WHERE number = ?;', [number]);
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
app.get('/api/user_sub/:sub', async (req, res) => {
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
app.get('/api/user_posts/:number', async (req, res) => {
  let { number } = req.params;

  // To prevent sql injection, xss and other attacks here use sanitize-html package
  number = sanitizeHtml(number, {
    allowedTags: [],
    allowedAttributes: {}
  });

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute('SELECT * FROM post WHERE user_number = ?;', [number]);
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

// Start the server
app.listen(port, () => {
// Outputs a message indicating which configuration is being used
  if (checkForDevArg()) {
    console.log(`Entwicklungsmodus aktiviert: API hört auf Port ${port} (lokal)`);
  } else {
    console.log(`Produktionsmodus aktiviert: API hört auf Port ${port} (live)`);
  }
});
