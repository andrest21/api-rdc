const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('./db');

dotenv.config();
// Middleware para verificar el JWT
async function verifyToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) 
    return res.status(403).json({ message: 'Se requiere un token' });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decodedUser) => {
    if (err)
      return res.status(401).json({ message: 'Token inválido' });
    
    try {
      await connectDB();
      const user = await User.findOne({ id_institution: decodedUser.id_institution, user_type: decodedUser.user_type, username: decodedUser.username }).exec();
      if (!user || user.sid !== token) 
        return res.status(401).json({ message: 'Sesión inválida o expirada' });

      req.user = decodedUser;
      next();
    } catch (error) {
      console.error('Error validando el token con la base de datos:', error);
      res.status(500).json({ message: 'Error del servidor' });
    }
  });
}

module.exports = verifyToken;