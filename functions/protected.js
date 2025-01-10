const express = require('express');
const serverless = require('serverless-http');
const cookieParser = require('cookie-parser');
const verifyToken = require('../utils/authMiddleware');

const app = express();
app.use(cookieParser());

app.get('/.netlify/functions/protected', verifyToken, (req, res) => {
  res.json({ message: 'Acceso concedido' });
});

module.exports.handler = serverless(app);