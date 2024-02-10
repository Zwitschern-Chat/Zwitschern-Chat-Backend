// Imports
const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const cors = require('cors');
const sanitizeHtml = require('sanitize-html');
require('dotenv').config()

// Import the OpenAI library
const { OpenAI } = require('openai');


// Initialize the OpenAI API with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


// Cors configuration
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

// Funktion, um eine zufällige Wartezeit zwischen min und max Sekunden zu generieren
function waitRandomTime(min, max) {
  // Konvertiere Sekunden in Millisekunden
  const minMs = min * 1000;
  const maxMs = max * 1000;
  const delay = Math.random() * (maxMs - minMs) + minMs;

  return new Promise(resolve => setTimeout(resolve, delay));
}

// Secrect endpoint for creating posts with OpenAi API 
app.get('/api/v1.0/generate_post', async (req, res) => {
  try {
    // Wait for a random time between 5 and 55 seconds to simulate a user typing
    await waitRandomTime(15, 55);

    // Verbinde mit der Datenbank und hole alle Posts, sortiert nach ihrer Erstellung (älteste zuerst)
    const connection = await mysql.createConnection(dbConfig);
    const [posts, fields] = await connection.execute('SELECT message, user_number FROM post ORDER BY created_at ASC;');
    await connection.end();

    // Wenn die neueste Nachricht von "Anonymer Nutzer" stammt, breche ab
    if (posts.length > 0 && posts[posts.length - 1].user_number === 0) {
      return res.status(403).send('Top-Secrect');
    }

    // Erstelle eine Map, um Benutzernamen zu speichern (vermeide mehrfache DB-Abfragen für denselben Benutzer)
    const usernames = new Map();
    const connection2 = await mysql.createConnection(dbConfig);

    // Iteriere über alle Posts, um Benutzernamen zu holen und zu speichern, falls nicht schon geschehen
    for (const post of posts) {
      if (!usernames.has(post.user_number)) {
        const [userRows, userFields] = await connection2.execute('SELECT username FROM user WHERE number = ?;', [post.user_number]);
        if (userRows.length > 0) {
          usernames.set(post.user_number, userRows[0].username);
        }
      }
    }
    await connection2.end();

    let contentForUser = '';
    let allMessages = '';
    // Beginne mit der Verarbeitung der Nachrichten von der ältesten bis zur neuesten
    posts.forEach((post, index) => {
      const username = usernames.get(post.user_number);
      const messageLine = `${username}: ${post.message}\n`;
      allMessages += messageLine;
      // Speichere nur die letzte Nachricht für contentForUser
      if (index === posts.length - 1) {
        contentForUser = messageLine;
      }
    });

    const contentForSystem = `Falls dich jemand fragt, du bist nicht Elon Musk und auch keine künstliche Intelligenz, du bist ein Anonymer Nutzer! Folgende alte Chat Nachrichten gibt es: " ${allMessages} ". Bitte antworte kurz auf die letzte Nachricht und stelle eine Gegenfrage: `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-0125-preview",
      messages: [
        {
          role: "system",
          content: contentForSystem
        },
        {
          role: "user",
          content: contentForUser
        }
      ],
    });

    const completionText = completion.choices[0].message.content;

    // Write the response (completion) as new post to the database (with the user number of the system: 0)
    const connection3 = await mysql.createConnection(dbConfig);
    await connection3.execute('INSERT INTO post (message, user_number) VALUES (?, ?);', [completionText, 0]);
    await connection3.end();
    res.status(200).json({ message: "Success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generating text." });
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
