const express = require('express');
const app = express();
const { auth, requiresAuth } = require('express-openid-connect');
require('dotenv').config()
const mysql = require('mysql2/promise');

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
  user: 'auth',
  port: '3306',
  password: 'qN.SO-f.xK1D*uNT',
  database: 'zwitschern'
};

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.SECRET,   //secrect import from .env file
    baseURL: 'https://zwitschern.chat/auth',
    clientID: '6dHWgZ691XG9pTlUar21zBrdVEvctyFP',
    issuerBaseURL: 'https://dev-x6a4ln1r3kk4uz5p.us.auth0.com'
  };
  const port = 5000;

app.use(auth(config));

// Funktion zum Überprüfen von Command-Line-Argumenten
function checkForDevArg() {
  return process.argv.includes('-dev'); // Nutze den Befehl "node app.js -dev" um die lokale Datenbank zu verwenden
}

// Middleware to check and update user data in database after each authentication
app.use(async (req, res, next) => {
  if (req.oidc.isAuthenticated()) {
    const userData = {
      email: req.oidc.user.email,
      username: req.oidc.user.nickname
    };

    try {
      const connection = await mysql.createConnection(dbConfig);
      // Überprüfen, ob ein Nutzer mit der gleichen E-Mail und/oder dem gleichen Benutzernamen existiert
      const checkUserSql = `SELECT id FROM user WHERE email = ? OR username = ? LIMIT 1;`;
      const [user] = await connection.execute(checkUserSql, [userData.email, userData.username]);

      if (user[0]) {
        // Benutzer existiert bereits, aktualisieren Sie den Benutzernamen oder führen Sie eine andere gewünschte Aktion aus
        console.log('Benutzer existiert bereits, kein neuer Eintrag erforderlich.');
      } else {
        // Benutzer existiert nicht, fügen Sie den neuen Benutzer ein
        const insertSql = `INSERT INTO user (email, username) VALUES (?, ?);`;
        await connection.execute(insertSql, [userData.email, userData.username]);
      }

      await connection.end();
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Benutzerdaten in der Datenbank: ', error.message);
    }
  }
  next();
});


// login and redirect to account
app.get('/auth/login', requiresAuth(), (req, res) => {
    res.redirect('/account');
  });
  
// logout and redirect to home
app.get('/auth/logout', (req, res) => {
  res.oidc.logout({
    returnTo: 'https://zwitschern.chat',
  });
});

// check if user is logged in or not
app.get('/auth/check', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

// callback get
app.get('/auth/callback', (req, res) => {
  res.oidc.callback({
    redirectUri: 'http://localhost:3000/callback',
  });
});

// callback post 
app.post('/auth/callback', express.urlencoded({ extended: false }), (req, res) =>
res.oidc.callback({
  redirectUri: 'http://localhost:3000/callback',
  }
));
    
// start server  
app.listen(port, () => {
  // Gibt eine Meldung aus, welche Konfiguration verwendet wird
  if (checkForDevArg()) {
    console.log(`Entwicklungsmodus aktiviert: AUTH hört auf Port ${port} (lokal)`);
  } else {
    console.log(`Produktionsmodus aktiviert: AUTH hört auf Port ${port} (live)`);
  }
});

  