const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
// Middleware para verificar el JWT
function verifyToken(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(403).json({ message: 'Se requiere un token' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }
    req.user = user; // Guardamos la información del usuario en la request
    next();
  });
}

module.exports = verifyToken;