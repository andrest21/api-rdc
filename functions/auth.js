const express = require('express');
const serverless = require('serverless-http');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
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

// Ruta para cerrar sesión y eliminar la cookie del token
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict'
  });
  res.clearCookie('userInfo', {
    httpOnly: true,
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
        maxAge: 3600000,   // 1 hora de validez,
        expires: new Date(Date.now() + 3600000)
      });
      const userInfo = {
        username: user.username,
        institution: user.id_institution
      };
      res.cookie('userInfo', JSON.stringify(userInfo), {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        maxAge: 3600000,
        expires: new Date(Date.now() + 3600000)
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
        username: user.username,
        token_access: user.token_access
      };
      res.cookie('userInfo', JSON.stringify(userInfo), {
        httpOnly: true,  // NO Permitimos que el cliente acceda a esta cookie
        secure: true,
        sameSite: 'Strict',
        maxAge: 3600000
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
    // const apiResponse = await fetch('https://api.condusef.gob.mx/auth/users/create-super-user/', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ key, username, password, confirm_password })
    // });

    // const result = await apiResponse.json();

    // if (!apiResponse.ok) {
    //   return res.status(400).json({ message: 'Error en la API', details: result });
    // }

    // const token_access = result.token_access;
    const token_access = 'esto-es-prueba';

    res.json({ message: 'Superusuario creado', token_access });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al crear superusuario', error });
  }
});

// Ruta para crear un usuario y obtener el token_access
router.post('/create-user', async (req, res) => {
  await connectDB();
  const { token_access, username, password, confirm_password } = req.body;
  if (!token_access || !username || !password) return res.status(400).json({ message: 'Faltan datos' });
  if (password !== confirm_password) return res.status(400).json({ message: 'Las contraseñas no coinciden' });
  const uEnc = req.cookies.userInfo;
  if (!uEnc) {
    return res.status(400).json({ message: 'No hay información del usuario' });
  }
  const uI = JSON.parse(decodeURIComponent(uEnc));
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
    // const hashedPassword = await bcrypt.hash(password, 10);
    // const newUser = new User({
    //   id_institution:uI.id_institution,
    //   user_type: 'user_gen',
    //   username,
    //   password: hashedPassword,
    //   token_access
    // });

    // await newUser.save();

    res.json({ message: 'Usuario creado' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al crear usuario', error });
  }
});

// Ruta para renovar token
router.post('/renewal', async (req, res) => {
  await connectDB();
  const { username, password, isA } = req.body;
  if (!username || !password || !isA) return res.status(400).json({ message: 'Faltan datos' });
  const uEnc = req.cookies.userInfo;
  if (!uEnc) {
    return res.status(400).json({ message: 'No hay información del usuario' });
  }
  const uI = JSON.parse(decodeURIComponent(uEnc));
  try {
    // const apiResponse = await fetch('https://api.condusef.gob.mx/auth/users/token/', {
    //   method: 'GET',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ username, password })
    // });

    // const result = await apiResponse.json();

    // if (!apiResponse.ok) {
    //   return res.status(400).json({ message: 'Error en la API', details: result });
    // }

    // const token_access = result.token_access;
    const token_access = 'testToken2';
    if (isA == '1') {
      return res.json({ message: 'Token Access Renovado Admin', token_access });
    }
    // Buscar el usuario y actualizar solo el campo token_access
    const updUser = await User.findOneAndUpdate(
      {
        id_institution: uI.institution,
        user_type: 'user_gen',
        username
      },
      {
        $set: {
          token_access: token_access,
          date_token_created: new Date()
        }
      },
      {
        new: true
      }
    );
    if (updUser) {
      res.json({ message: 'Token Access Renovado User' });
    } else {
      res.status(404).json({ message: 'Usuario no encontrado o no se pudo actualizar el token' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al renovar Token Access', error });
  }
});

app.use('/.netlify/functions/auth', router);
// Exportar la función para que funcione con Netlify
module.exports.handler = serverless(app);