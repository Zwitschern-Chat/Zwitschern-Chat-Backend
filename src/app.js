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


function verifyApiKey(req, res, next) {
  const apiKey = req.query.apiKey;
  // Extrahieren des API-Schlüssels aus den Headers

  const expectedApiKey = 'Fen4GC6KRjmt';

  if (apiKey && apiKey === expectedApiKey) {
    next();
  } else {
    res.status(401).send('Ungültiger API-Schlüssel');
  }
}


// Anwendung der Middleware auf alle /api/ Routen
app.use('/api', verifyApiKey);

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

// user username or email to get user id
app.get('/api/user', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const { username, email } = req.query;
    let [rows, fields] = await connection.execute('SELECT id FROM user WHERE username = ? OR email = ?;', [username, email]);
    await connection.end();
    if (rows.length > 0) {
      res.json({ id: rows[0].id });
    } else {
      res.status(404).send('Nutzer nicht gefunden.');
    }
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

app.post('/api/post', async (req, res) => {
  const { title, body, userId } = req.body;

  // Überprüfen Sie, ob alle Werte vorhanden sind
  if (title === undefined || body === undefined || userId === undefined) {
    return res.status(400).send('Fehlende Daten: title, body und userId sind erforderlich.');
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute('INSERT INTO post (title, body, user_id) VALUES (?, ?, ?);', [title, body, userId]);
    await connection.end();
    res.json({ success: true, message: 'Post erfolgreich erstellt.', postId: rows.insertId });
  } catch (error) {
    console.error('Fehler beim Zugriff auf die Datenbank: ', error.message);
    res.status(500).send('Fehler beim Zugriff auf die Datenbank: ' + error.message);
  }
});


app.post('/api/users', async (req, res) => {
  try {
    const { email, userId } = req.body;
    const connection = await mysql.createConnection(dbConfig);

    const [rows, fields] = await connection.execute('INSERT INTO user (email, userId) VALUES (?, ?);', [email, userId]);

    await connection.end();

    res.json({ success: true, message: 'Nutzer erfolgreich hinzugefügt.' });
  } catch (error) {
    console.error('Fehler beim Speichern des Nutzers: ', error.message);
    res.status(500).send('Fehler beim Zugriff auf die Datenbank: ' + error.message);
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [rows, fields] = await connection.execute('SELECT * FROM user;');
    
    await connection.end();
    
    res.json(rows);
  } catch (error) {
    console.error('Fehler beim Zugriff auf die Datenbank: ', error.message);
    res.status(500).send('Fehler beim Zugriff auf die Datenbank: ' + error.message);
  }
});


app.get('/', (req, res) => {
  res.status(200).send('http://zwitschern.chat:3000/ping');
});

app.get('/ping', (req, res) => {
  res.status(200).send('Pong!');
});


app.listen(port, () => {
  // Gibt eine Meldung aus, welche Konfiguration verwendet wird
  if (checkForDevArg()) {
    console.log(`Entwicklungsmodus aktiviert: API hört auf Port ${port} (lokal)`);
  } else {
    console.log(`Produktionsmodus aktiviert: API hört auf Port ${port} (live)`);
  }
});
