const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    console.log('Conexión existente a MongoDB');
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
  }
};
module.exports = connectDB;