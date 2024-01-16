const express = require('express');
const app = express();
const { auth, requiresAuth } = require('express-openid-connect');
require('dotenv').config()

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
  
  // req.isAuthenticated is provided from the auth router
  app.get('/check', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
  });
  
  app.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
  });

  app.post('/callback', async (req, res) => {
    // Extrahieren der Nutzerdaten aus dem Request-Objekt nach der Authentifizierung
    if (req.oidc && req.oidc.user) {
      const userData = {
        email: req.oidc.user.email, // E-Mail-Adresse des Nutzers
        userId: req.oidc.user.sub // Nutzer-ID, normalerweise im 'sub'-Feld des Tokens
      };
  
      // Senden der Nutzerdaten an den API-Endpoint
      try {
        const response = await fetch('https://zwitschern.chat/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
  
        const data = await response.json();
        console.log(data);
      } catch (error) {
        console.error('Fehler beim Senden der Nutzerdaten: ', error);
      }
    } else {
        console.error('Nutzerdaten nicht verfügbar');
        // Erweiterte Fehlerbehandlung zur Diagnose:
        console.error('req.oidc:', req.oidc);
        console.error('req.oidc.user:', req.oidc.user);
        // Senden Sie eine Fehlerantwort an den Client
        res.status(500).send('Ein interner Fehler ist aufgetreten');
      }
  });
  
  
  app.listen(port, () => {
    console.log(`Aktiviert: AUTH hört auf Port ${port}`);
  });