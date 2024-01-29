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

  // auth router attaches /login, /logout, and /callback routes to the baseURL
  app.use(auth(config));

  // Funktion zum Überprüfen von Command-Line-Argumenten
function checkForDevArg() {
  return process.argv.includes('-dev'); // Nutze den Befehl "node app.js -dev" um die lokale Datenbank zu verwenden
}
  
  // req.isAuthenticated is provided from the auth router
  app.get('/auth/check', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
  });
  
  app.get('/auth/profile', requiresAuth(), async (req, res) => {
    const userData = {
      email: req.oidc.user.email,
      username: req.oidc.user.nickname
    };
  
    try {
      const connection = await mysql.createConnection(dbConfig);
  
      // Der SQL-Befehl prüft, ob ein Benutzer mit der gleichen E-Mail existiert und aktualisiert dessen Benutzernamen.
      // Falls der Benutzer nicht existiert, wird ein neuer Eintrag erstellt.
      const sql = `
        INSERT INTO user (email, username) 
        VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE username = VALUES(username);
      `;
      await connection.execute(sql, [userData.email, userData.username]);
  
      await connection.end();
  
      res.send(JSON.stringify(userData));
    } catch (error) {
      console.error('Fehler beim Speichern des Nutzers: ', error.message);
      res.status(500).send('Fehler beim Zugriff auf die Datenbank: ' + error.message);
    }
  });
  

  app.get('/auth/callback', (req, res) => {
    res.oidc.callback({
      redirectUri: 'http://localhost:3000/callback',
    });
  });
  
  app.post('/auth/callback', express.urlencoded({ extended: false }), (req, res) =>
    res.oidc.callback({
      redirectUri: 'http://localhost:3000/callback',
    }
    ));
    
  
    app.listen(port, () => {
      // Gibt eine Meldung aus, welche Konfiguration verwendet wird
      if (checkForDevArg()) {
        console.log(`Entwicklungsmodus aktiviert: AUTH hört auf Port ${port} (lokal)`);
      } else {
        console.log(`Produktionsmodus aktiviert: AUTH hört auf Port ${port} (live)`);
      }
    });

  