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
      username: req.oidc.user.nickname,
      profile_picture: req.oidc.user.picture,
      id: req.oidc.user.sub
    };

    try {
      const connection = await mysql.createConnection(dbConfig);
      // Überprüfen, ob ein Nutzer mit der gleichen sub existiert
      const checkUserSql = `SELECT id FROM user WHERE id = ? LIMIT 1;`;
      const [users] = await connection.execute(checkUserSql, [userData.id]);

      if (users.length > 0) {
        const user = users[0];
        // Benutzer existiert bereits, aktualisieren Sie ggf. den Benutzernamen und das Profilbild
        const updateSql = `UPDATE user SET username = ?, profile_picture = ? WHERE id = ?;`;
        await connection.execute(updateSql, [userData.username, userData.profile_picture, user.id]);
        console.log('Benutzerdaten aktualisiert.');
      } else {
        // Benutzer existiert nicht, fügen Sie den neuen Benutzer ein
        const insertSql = `INSERT INTO user (id, username, profile_picture,) VALUES (?, ?, ?);`;
        await connection.execute(insertSql, [userData.id, userData.username, userData.profile_picture]);
        console.log('Neuer Benutzer hinzugefügt.');
      }

      await connection.end();
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Benutzerdaten in der Datenbank: ', error.message);
    }
  }
  next();
});



// endpoint to get user data from auth0 
app.get('/auth/user', requiresAuth(), (req, res) => {
  res.json(req.oidc.user);
});

// login
app.get('/auth/login', requiresAuth(), (req, res) => {
    res.redirect('/account');
  });

// account page 
app.get('/auth/account', requiresAuth(), (req, res) => {
  res.redirect('https://zwitschern.chat');
});
  
// logout and redirect to home
app.get('/auth/logout', (req, res) => {
  res.oidc.logout({
    returnTo: 'https://zwitschern.chat',
  });
});

// debug, check if user is logged in or not
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

  