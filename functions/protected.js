const express = require('express');
const serverless = require('serverless-http');
const cookieParser = require('cookie-parser');
const verifyToken = require('./authMiddleware');

const app = express();
app.use(cookieParser());

app.get('/.netlify/functions/protected', verifyToken, (req, res) => {
  res.json({ message: 'Acceso concedido', user: req.user });
});

module.exports.handler = serverless(app);