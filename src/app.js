const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const cors = require('cors');
const sanitizeHtml = require('sanitize-html');

const corsOptions = {
  origin: '*', 
  optionsSuccessStatus: 200 
};

app.use(cors(corsOptions));

// Zum Parsen von application/json
app.use(express.json()); 
// Zum Parsen von application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));


const port = 3000;


// Funktion zum Überprüfen von Command-Line-Argumenten
function checkForDevArg() {
  return process.argv.includes('-dev'); // Nutze den Befehl "node app.js -dev" um die lokale Datenbank zu verwenden
}

// Entscheiden Sie, welche Datenbankkonfiguration basierend auf dem Argument verwendet werden soll
// Wenn das '-dev' Argument vorhanden ist, wird 'localhost' als Host verwendet
// Andernfalls wird die Produktionsdatenbankkonfiguration verwendet
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


// Endpoint zum Abrufen aller Posts
app.get('/api/posts', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [rows, fields] = await connection.execute('SELECT * FROM post;');
    
    await connection.end();

    if (rows.length === 0) {
      res.status(404).send('Keine Posts gefunden.');
    } else {
      res.json(rows);
    }
    
  } catch (error) {
    console.error('Fehler beim Zugriff auf die Datenbank: ', error.message);
    res.status(500).send('Fehler beim Zugriff auf die Datenbank: ' + error.message);
  }
});

// Endpoint zum Abrufen eines Posts anhand der Post-ID
app.get('/api/post/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute('SELECT * FROM post WHERE id = ?;', [req.params.id]);
    await connection.end();

    if (rows.length === 0) {
      res.status(404).send('Post nicht gefunden.');
    } else {
      res.json(rows[0]);
    }
  } catch (error) {
    console.error('Fehler beim Zugriff auf die Datenbank: ', error.message);
    res.status(500).send('Fehler beim Zugriff auf die Datenbank: ' + error.message);
  }
});


// Endpoint zum Abrufen aller Nutzer (geheime Daten wie sub)
app.get('/api/users', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute('SELECT number, username, profile_picture FROM user;');
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Fehler beim Zugriff auf die Datenbank: ', error.message);
    res.status(500).send('Fehler beim Zugriff auf die Datenbank: ' + error.message);
  }
});

// Endpoint zum Abrufen Informationen eines Nutzers anhand der User-Nummer
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
      res.status(404).send('Nutzer nicht gefunden.');
    } else {
      res.json(rows[0]);
    }
  } catch (error) {
    console.error('Fehler beim Zugriff auf die Datenbank: ', error.message);
    res.status(500).send('Fehler beim Zugriff auf die Datenbank: ' + error.message);
  }
});


// Endpoint zum Abrufen der eigenen Nutzer Infos anhand von sub (Auth0-Identifikator)
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
      res.status(404).send('Nutzer nicht gefunden.');
    } else {
      res.json(rows[0]);
    }
  } catch (error) {
    console.error('Fehler beim Zugriff auf die Datenbank: ', error.message);
    res.status(500).send('Fehler beim Zugriff auf die Datenbank: ' + error.message);
  }
});


// Endpoint zum Abrufen aller Posts eines Nutzers
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
      res.status(404).send('Keine Posts gefunden.');
    } else {
      res.json(rows);
    }
  } catch (error) {
    console.error('Fehler beim Zugriff auf die Datenbank: ', error.message);
    res.status(500).send('Fehler beim Zugriff auf die Datenbank: ' + error.message);
  }
});


app.listen(port, () => {
  // Gibt eine Meldung aus, welche Konfiguration verwendet wird
  if (checkForDevArg()) {
    console.log(`Entwicklungsmodus aktiviert: API hört auf Port ${port} (lokal)`);
  } else {
    console.log(`Produktionsmodus aktiviert: API hört auf Port ${port} (live)`);
  }
});
