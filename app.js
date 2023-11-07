const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const port = 3000;


const dbConfig = {
  host: '45.81.234.35',
  user: 'root',
  port: '3306',
  password: '#Jander123',
  database: 'zwitschern.chat'
};


app.get('/daten', async (req, res) => {
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

app.listen(port, () => {
  console.log(`Listen at ${port}`);
});
