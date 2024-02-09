const express = require('express');
const app = express();
const { auth, requiresAuth } = require('express-openid-connect');
require('dotenv').config()
const mysql = require('mysql2/promise');
const sanitizeHtml = require('sanitize-html');

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
      sub: req.oidc.user.sub
    };

    try {
      const connection = await mysql.createConnection(dbConfig);
      // Überprüfen, ob ein Nutzer mit der gleichen sub bereits existiert
      const checkUserSql = `SELECT sub FROM user WHERE sub = ? LIMIT 1;`;
      const [users] = await connection.execute(checkUserSql, [userData.sub]);

      if (users.length > 0) {
        const user = users[0];
        // Benutzer existiert bereits, aktualisieren Sie ggf. den Benutzernamen und das Profilbild
        const updateSql = `UPDATE user SET username = ?, profile_picture = ? WHERE sub = ?;`;
        await connection.execute(updateSql, [userData.username, userData.profile_picture, userData.sub]);
        console.log('Benutzerdaten aktualisiert.');
      } else {
        // Benutzer existiert nicht, fügen Sie den neuen Benutzer ein
        const insertSql = `INSERT INTO user (sub, username, profile_picture) VALUES (?, ?, ?);`;
        await connection.execute(insertSql, [userData.sub, userData.username, userData.profile_picture]);
        console.log('Neuer Benutzer hinzugefügt.');
      }

      await connection.end();
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Benutzerdaten in der Datenbank: ', error.message);
    }
  }
  next();
});


// Endpoint zum Erstellen eines neuen Posts
app.post('/auth/post/:user_number/:message',  requiresAuth(), async (req, res) => {

  const sub = req.oidc.user.sub;
  const message = req.params.message;
  const user_number = req.params.user_number;

  // Überprüfen Sie, ob alle Werte vorhanden sind
  if (message === undefined || user_number === undefined) {
    return res.status(400).send('Fehlende Daten: message und user_number sind erforderlich.');
  } else {
        // Do prevent sql injection, xss and other attacks here use sanitize-html package  
        message = sanitizeHtml(message, {
          allowedTags: [],
          allowedAttributes: {}
        });
        user_number = sanitizeHtml(user_number, {
          allowedTags: [],
          allowedAttributes: {}
        });
  }
  
  // use sub for to get number to compare with user_number
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute('SELECT number FROM user WHERE sub = ?;', [sub]);
    await connection.end();

    if (rows.length === 0) {
      res.status(404).send('Benutzer nicht gefunden.');
    } else {
      number = rows[0].number;
    }
  } catch (error) {
    console.error('Fehler beim Zugriff auf die Datenbank: ', error.message);
    res.status(500).send('Fehler beim Zugriff auf die Datenbank: ' + error.message);
  }

  if (!user_number === number) {
    return res.status(403).send('Nicht autorisiert: Sie können nur Posts für Ihren eigenen Benutzer erstellen.');
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




// endpoint to get all user data from auth0 
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

  