const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
// Middleware para verificar el JWT
let tokenSafe = '';
function verifyToken(req, res, next) {
  const token = req.cookies.token;
  if (token) {
    tokenSafe = token;
  }
  if (tokenSafe !== '') {
    jwt.verify(tokenSafe, process.env.JWT_SECRET, (err, user) => {
      if (err) {
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
        tokenSafe = '';
        return res.status(401).json({ message: 'Token inválido' });
      }
      req.user = user;
      next();
    });
  } else {
    if (!token)
      return res.status(403).json({ message: 'Se requiere un token' });
  }
}

module.exports = verifyToken;