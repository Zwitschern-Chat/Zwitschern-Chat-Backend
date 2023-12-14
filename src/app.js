const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const cors = require('cors');

const corsOptions = {
  origin: '*', 
  optionsSuccessStatus: 200 
};

app.use(cors(corsOptions));

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
  database: 'zwitschern.chat'
} : {
  host: '45.81.234.35',
  user: 'root',
  port: '3306',
  password: '#Jander123',
  database: 'zwitschern.chat'
};


app.get('/api/posts', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [rows, fields] = await connection.execute('SELECT * FROM posts;');
    
    await connection.end();
    
    res.json(rows);
  } catch (error) {
    console.error('Fehler beim Zugriff auf die Datenbank: ', error.message);
    res.status(500).send('Datenbankfehler');
  }
});


app.get('/api/users', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [rows, fields] = await connection.execute('SELECT * FROM users;');
    
    await connection.end();
    
    res.json(rows);
  } catch (error) {
    console.error('Fehler beim Zugriff auf die Datenbank: ', error.message);
    res.status(500).send('Datenbankfehler');
  }
});


app.get('/', (req, res) => {
  res.status(200).send('http://zwitschern.chat:3000/ping');
});

app.get('/ping', (req, res) => {
  res.status(200).send('Pong!');
});


const { auth } = require('express-openid-connect');

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: 'sX_moUorNFXs3Ot17KAetIy9AiXFfqHeDXoIgOotbDYXSsh-0_W7Bd8099Mz9zPz',
  baseURL: 'https://zwitschern.chat/',
  clientID: '6dHWgZ691XG9pTlUar21zBrdVEvctyFP',
  issuerBaseURL: 'https://dev-x6a4ln1r3kk4uz5p.us.auth0.com'
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// req.isAuthenticated is provided from the auth router
app.get('/api/check', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

const { requiresAuth } = require('express-openid-connect');

app.get('/api/profile', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});

app.listen(port, () => {
  // Gibt eine Meldung aus, welche Konfiguration verwendet wird
  if (checkForDevArg()) {
    console.log(`Entwicklungsmodus aktiviert: Backend hört auf Port ${port} (lokal)`);
  } else {
    console.log(`Produktionsmodus aktiviert: Backend hört auf Port ${port} (live)`);
  }
});
