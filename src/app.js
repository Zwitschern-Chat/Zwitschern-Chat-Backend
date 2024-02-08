const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const cors = require('cors');

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


// Endpoint zum Erstellen eines neuen Posts
app.post('/api/post', async (req, res) => {
  const { message, user_number } = req.body;

  // Überprüfen Sie, ob alle Werte vorhanden sind
  if (message === undefined || user_number === undefined) {
    return res.status(400).send('Fehlende Daten:message und user_number sind erforderlich.');
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute('INSERT INTO post (message, user_number) VALUES (?, ?);', [message, user_number]);
    await connection.end();
    res.json({ success: true, message: 'Post erfolgreich erstellt.', postId: rows.insertId });
  } catch (error) {
    console.error('Fehler beim Zugriff auf die Datenbank: ', error.message);
    res.status(500).send('Fehler beim Zugriff auf die Datenbank: ' + error.message);
  }
});

// Endpoint zum Abrufen aller Posts
app.get('/api/posts', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [rows, fields] = await connection.execute('SELECT * FROM post;');
    
    await connection.end();
    
    res.json(rows);
  } catch (error) {
    console.error('Fehler beim Zugriff auf die Datenbank: ', error.message);
    res.status(500).send('Fehler beim Zugriff auf die Datenbank: ' + error.message);
  }
});

// Endpoint zum Abrufen aller Nutzer (ohne sub)
app.get('/api/users', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute('SELECT user_number, username, profile_picture FROM user;');
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Fehler beim Zugriff auf die Datenbank: ', error.message);
    res.status(500).send('Fehler beim Zugriff auf die Datenbank: ' + error.message);
  }
});

// Endpoint zum Abrufen von Nutzer Informationen anhand der number
app.get('/api/user/:number', async (req, res) => {
  const { number } = req.params;

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
app.get('/api/user/:sub', async (req, res) => {
  const { sub } = req.params;

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


app.listen(port, () => {
  // Gibt eine Meldung aus, welche Konfiguration verwendet wird
  if (checkForDevArg()) {
    console.log(`Entwicklungsmodus aktiviert: API hört auf Port ${port} (lokal)`);
  } else {
    console.log(`Produktionsmodus aktiviert: API hört auf Port ${port} (live)`);
  }
});
