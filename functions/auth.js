const express = require('express');
const serverless = require('serverless-http');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Institution = require('../models/Institution');
const fetch = require('node-fetch');
const connectDB = require('../utils/db');

// Inicializar variables de entorno
dotenv.config();

// Crear una app Express
const app = express();
app.use(express.json());
app.use(express.text());
app.use(cookieParser());

// Definimos router de express
const router = express.Router();

// Función para generar JWT
function generateToken(user) {
  const payload = {
    id: user._id,
    username: user.username
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// Ruta para obtener todas las instituciones
router.get('/institutions', async (req, res) => {
  console.log('entro');
  try {
    await connectDB();
    console.log('conecto');
    const institutions = await Institution.find().select('_id institution');
    console.log('busco');
    res.json(institutions);
  } catch (error) {
    console.error('Error al obtener las instituciones:', error);
    res.status(500).json({ message: 'Error al obtener las instituciones' });
  }
});

// Ruta para cerrar sesión y eliminar la cookie del token
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict'
  });
  res.clearCookie('userInfo', {
    httpOnly: false,
    secure: true,
    sameSite: 'Strict'
  });
  res.json({ message: 'Sesión cerrada correctamente' });
});

// Iniciar sesión: Ruta para validar existencia de un superusuario
router.post('/super-user', async (req, res) => {
  await connectDB();
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Faltan datos' });
  const user = await User.findOne({ user_type: "user_admin", username }).exec();
  if (user) {
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      const token = generateToken(user);
      res.cookie('token', token, {
        httpOnly: true,   // Para que solo el servidor pueda acceder a la cookie
        secure: true,     // Solo se envía en HTTPS
        sameSite: 'Strict', // Ayuda a evitar ataques CSRF
        maxAge: 3600000   // 1 hora de validez
      });
      const userInfo = {
        user_admin: true,
        username: user.username,
        institution: user.id_institution
      };
      res.cookie('userInfo', JSON.stringify(userInfo), {
        httpOnly: false,  // Permitimos que el cliente acceda a esta cookie
        secure: true,     // Solo se envía en HTTPS
        sameSite: 'Strict',
        maxAge: 3600000   // 1 hora de validez
      });
      res.json({ message: 'Login exitoso' });
    } else {
      res.status(401).json({ message: 'Contraseña incorrecta' });
    }
  } else {
    res.status(404).json({ message: 'Usuario no encontrado' });
  }
});

// Iniciar sesión: Ruta para validar existencia de un usuario general
router.post('/user', async (req, res) => {
  await connectDB();
  const { id_institution, username, password } = req.body;
  if (!id_institution || !username || !password) return res.status(400).json({ message: 'Faltan datos' });

  const user = await User.findOne({ id_institution, user_type: 'user_gen', username }).exec();
  if (user) {
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      const token = generateToken(user);
      res.cookie('token', token, {
        httpOnly: true,   // Para que solo el servidor pueda acceder a la cookie
        secure: true,     // Solo se envía en HTTPS
        sameSite: 'Strict', // Ayuda a evitar ataques CSRF
        maxAge: 3600000   // 1 hora de validez
      });
      const userInfo = {
        user_admin: false,
        username: user.username,
        token_access: user.token_access
      };
      res.cookie('userInfo', JSON.stringify(userInfo), {
        httpOnly: false,  // Permitimos que el cliente acceda a esta cookie
        secure: true,     // Solo se envía en HTTPS
        sameSite: 'Strict',
        maxAge: 3600000   // 1 hora de validez
      });
      res.json({ message: 'Login exitoso' });
    } else {
      res.status(401).json({ message: 'Contraseña incorrecta' });
    }
  } else {
    res.status(404).json({ message: 'Usuario no encontrado' });
  }
});

// Ruta para crear un superusuario y obtener el token_access
router.post('/create-super-user', async (req, res) => {
  const { key, username, password, confirm_password } = req.body;
  if (!key || !username || !password) return res.status(400).json({ message: 'Faltan datos' });
  if (password !== confirm_password) return res.status(400).json({ message: 'Las contraseñas no coinciden' });
  try {
    const apiResponse = await fetch('https://api.condusef.gob.mx/auth/users/create-super-user/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ key, username, password, confirm_password })
    });

    const result = await apiResponse.json();

    if (!apiResponse.ok) {
      return res.status(400).json({ message: 'Error en la API', details: result });
    }

    const token_access = result.token_access;
    // // Guardar el superusuario en MongoDB con el token_access
    // const hashedPassword = await bcrypt.hash(password, 10);
    // const newUser = new User({
    //   username,
    //   password: hashedPassword,
    //   token_access,
    //   user_type: 'user_admin',
    //   id_institution: 'id01'
    // });

    // await newUser.save();

    res.json({ message: 'Superusuario creado', token_access });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al crear superusuario', error });
  }
});

// Ruta para crear un usuario y obtener el token_access
router.post('/create-user', async (req, res) => {
  await connectDB();
  const { token_access, username, password, confirm_password, id_institution} = req.body;
  if (!token_access || !username || !password || !id_institution) return res.status(400).json({ message: 'Faltan datos' });
  if (password !== confirm_password) return res.status(400).json({ message: 'Las contraseñas no coinciden' });
  try {
    // const apiResponse = await fetch('https://api.condusef.gob.mx/auth/users/create-user/', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `${token_access}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ username, password, confirm_password })
    // });

    // const result = await apiResponse.json();

    // if (!apiResponse.ok) {
    //   return res.status(400).json({ message: 'Error en la API', details: result });
    // }

    // const token_access = result.token_access;
    const token_access = 'testToken';
    // Guardar el superusuario en MongoDB con el token_access
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      id_institution,
      user_type: 'user_gen',
      username,
      password: hashedPassword,
      token_access
    });

    await newUser.save();

    res.json({ message: 'Usuario creado' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al crear usuario', error });
  }
});

app.use('/.netlify/functions/auth', router);
// Exportar la función para que funcione con Netlify
module.exports.handler = serverless(app);