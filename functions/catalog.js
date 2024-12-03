const dotenv = require('dotenv');
const express = require('express');
const serverless = require('serverless-http');
const cookieParser = require('cookie-parser');
const Institution = require('../models/Institution');
const User = require('../models/User');
const fetch = require('node-fetch');
const connectDB = require('../utils/db');
const https = require('https');
const fs = require('fs');

// Carga el certificado
const agent = new https.Agent({
    ca: fs.readFileSync('./functions/certs/condusef-gob-mx-chain.pem')
});
// Inicializar variables de entorno
dotenv.config();
// Definimos entorno
const api_prod = process.env.DEBUG ? 'https://api.condusef.gob.mx':'https://api-redeco.condusef.gob.mx';

const app = express();
app.use(express.json());
app.use(express.text());
app.use(cookieParser());

const router = express.Router();

// Ruta para obtener todas las instituciones
router.get('/institutions', async (req, res) => {
    try {
        await connectDB();
        const institutions = await Institution.find().select('id_institution institution_desc');
        res.json(institutions);
    } catch (error) {
        console.error('Error al obtener las instituciones:', error);
        res.status(500).json({ message: 'Error al obtener las instituciones' });
    }
});

// Ruta para consulta de los usuarios por institución
router.get('/tokens', async (req, res) => {
    await connectDB();
    const uEnc = req.cookies.userInfo;
    if (!uEnc) {
        return res.status(400).json({ message: 'No hay información del usuario' });
    }
    const uI = JSON.parse(decodeURIComponent(uEnc));

    try {
        const users = await User.find({ id_institution: uI.institution, user_type: 'user_gen' })
            .select('createdAt updatedAt username token_access date_token_created')
            .exec();

        if (users.length > 0) {
            const usersWithVigency = users.map(user => {
                const tokenCreatedDate = new Date(user.date_token_created);
                const expirationDate = new Date(tokenCreatedDate);
                expirationDate.setDate(tokenCreatedDate.getDate() + 29);
                const remainingDays = Math.ceil((expirationDate - Date.now()) / (1000 * 60 * 60 * 24));

                const localDateCreated = new Date(user.createdAt).toLocaleDateString("en-GB");
                const localDateUpdated = new Date(user.updatedAt).toLocaleDateString("en-GB");

                return {
                    date_created: localDateCreated,
                    updatedAt: localDateUpdated,
                    username: user.username,
                    token_access: user.token_access,
                    remaining_days: remainingDays > 0 ? remainingDays : 0
                };
            });
            res.json({ tokens: usersWithVigency });
        } else {
            res.status(404).json({ message: 'No existen registros.' });
        }
    } catch (error) {
        console.error('Error al consultar registros:', error);
        res.status(500).json({ message: 'Error al consultar registros.', error });
    }
});

// Ruta para consulta de catalogo de productos
router.get('/product', async (req, res) => {
    try {
        const uEnc = req.cookies.userInfo;
        if (!uEnc) {
            return res.status(400).json({ message: 'No hay información del usuario' });
        }
        const uI = JSON.parse(decodeURIComponent(uEnc));
        const token_access = uI.token_access;

        const apiResponse = await fetch(`${api_prod}/catalogos/products-list`, {
            method: 'GET',
            headers: {
                'Authorization': `${token_access}`,
                'Content-Type': 'application/json'
            },
            agent
        });

        const result = await apiResponse.json();
        if (!apiResponse.ok) {
            return res.status(400).json({ message: 'Error en la API:'+result.error, details: result });
        }

        res.json(result);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al consultar lista de productos', error });
    }
});

// Ruta para consulta de catalogo de causas
router.post('/causas', async (req, res) => {
    const {prodId} = req.body;
    if(!prodId) return res.status(400).json({ message: 'Faltan datos' });
    try {
        const uEnc = req.cookies.userInfo;
        if (!uEnc) {
            return res.status(400).json({ message: 'No hay información del usuario' });
        }
        const uI = JSON.parse(decodeURIComponent(uEnc));
        const token_access = uI.token_access;

        const apiResponse = await fetch(`${api_prod}/catalogos/causas-list/?product=${prodId}`, {
            method: 'GET',
            headers: {
                'Authorization': `${token_access}`,
                'Content-Type': 'application/json'
            },
            agent
        });

        const result = await apiResponse.json();
        if (!apiResponse.ok) {
            return res.status(400).json({ message: 'Error en la API:'+result.error, details: result });
        }

        res.json(result);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al consultar lista de causas', error });
    }
});

app.use('/.netlify/functions/catalog', router);

module.exports.handler = serverless(app);