const express = require('express');
const app = express();
const { auth, requiresAuth } = require('express-openid-connect');
require('dotenv').config()

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.SECRET,   //secrect import from .env file
    baseURL: 'https://zwitschern.chat/',
    clientID: '6dHWgZ691XG9pTlUar21zBrdVEvctyFP',
    issuerBaseURL: 'https://dev-x6a4ln1r3kk4uz5p.us.auth0.com'
  };
  const port = 5000;

  // auth router attaches /login, /logout, and /callback routes to the baseURL
  app.use(auth(config));
  
  // req.isAuthenticated is provided from the auth router
  app.get('/api/check', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
  });
  
  app.get('/api/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
  });

  app.listen(port, () => {
    console.log(`Aktiviert: AUTH hört auf Port ${port}`);
  });