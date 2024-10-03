const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

// Crear superusuario y obtener token de la API
exports.createSuperUser = async (req, res) => {
    const { id_institution, username, password } = req.body;
    
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        // Llamar a la API para generar el token_access
        const apiResponse = await fetch('https://api.condusef.gob.mx/auth/users/create-super-user/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await apiResponse.json();
        if (!apiResponse.ok) {
            return res.status(400).json({ message: 'Error en la API', error: data });
        }

        // Crear usuario administrador en MongoDB
        const newUser = new User({
            id_institution,
            user_type: 'user_admin',
            username,
            password: hashedPassword,
            token_access: data.token_access
        });

        await newUser.save();
        res.status(201).json({ message: 'Superusuario creado exitosamente', token_access: data.token_access });

    } catch (error) {
        res.status(500).json({ message: 'Error al crear superusuario', error });
    }
};

// Autenticar usuarios
exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Buscar el usuario en la base de datos
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Comparar la contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        // Generar token JWT
        const token = jwt.sign({ id: user._id, user_type: user.user_type }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: 'Autenticación exitosa', token });

    } catch (error) {
        res.status(500).json({ message: 'Error al autenticar', error });
    }
};