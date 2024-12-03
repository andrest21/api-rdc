const dotenv = require('dotenv');
const express = require('express');
const serverless = require('serverless-http');
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Carga el certificado
const agent = new https.Agent({
  ca: fs.readFileSync(path.resolve(__dirname, '../certs/condusef-gob-mx-chain.pem'))
});

// Inicializar variables de entorno
dotenv.config();
// Definimos entorno
const api_prod = process.env.DEBUG ? 'https://api.condusef.gob.mx':'https://api-redeco.condusef.gob.mx';

// Crear una app Express
const app = express();
app.use(express.json());
app.use(express.text());
app.use(cookieParser());

// Definimos router de express
const router = express.Router();

// Ruta para enviar queja
router.post('/send', async (req, res) => {
    const complaintData = req.body;
    const numericFields = [
        'QuejasNoMes', 'QuejasNum', 'QuejasMedio', 'QuejasNivelAT',
        'QuejasEstatus', 'QuejasEstados', 'QuejasMunId',
        'QuejasLocId', 'QuejasColId', 'QuejasCP',
        'QuejasTipoPersona', 'QuejasEdad', 'QuejasRespuesta'
    ];

    for (const field of numericFields) {
        if (
            complaintData[field] !== undefined &&
            complaintData[field] !== null &&
            (typeof complaintData[field] !== 'number' || isNaN(complaintData[field]))
        ) {
            return res.status(400).json({ message: `El campo ${field} debe ser numérico.` });
        }
    }

    const fieldsNotRequired = ['QuejasSexo', 'QuejasEdad', 'QuejasFecResolucion', 'QuejasRespuesta', 'QuejasNumPenal', 'QuejasPenalizacion'];
    for (const [key, value] of Object.entries(complaintData)) {
        if (!fieldsNotRequired.includes(key)) {
            if (value === '') {
                return res.status(400).json({ message: `Faltan datos en el campo ${key}` });
            }
        } else {
            if (
                (['QuejasSexo', 'QuejasEdad'].includes(key) && complaintData['QuejasTipoPersona'] === '1' && value === '') ||
                (key === 'QuejasRespuesta' && complaintData['QuejasEstatus'] === '2' && value === '')
            ) {
                return res.status(400).json({ message: `Faltan datos en el campo ${key}` });
            }
        }
    }

    const uEnc = req.cookies.userInfo;
    if (!uEnc) {
        return res.status(400).json({ message: 'No hay información del usuario' });
    }
    const uI = JSON.parse(decodeURIComponent(uEnc));
    const token_access = uI.token_access;
    try {
        const apiResponse = await fetch(`${api_prod}/redeco/quejas`, {
            method: 'POST',
            headers: {
                'Authorization': `${token_access}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([complaintData]),
            agent
        });

        const result = await apiResponse.json();
        if (!apiResponse.ok) {
            return res.status(400).json({ message: 'Error en la API:'+ result['errors'][`${complaintData['QuejasFolio']}`], details: result });
        }

        res.json({ message: 'Queja Enviada Correctamente' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al enviar la queja', error });
    }
});

// Ruta para buscar queja
router.post('/find', async (req, res) => {
    const {year, month} = req.body;
    if (!year || !month) return res.status(400).json({ message: 'Faltan datos' });
    const uEnc = req.cookies.userInfo;
    if (!uEnc) {
        return res.status(400).json({ message: 'No hay información del usuario' });
    }
    const uI = JSON.parse(decodeURIComponent(uEnc));
    const token_access = uI.token_access;
    try {
        const apiResponse = await fetch(`${api_prod}/redeco/quejas/?year=${year}&month=${month}`, {
            method: 'GET',
            headers: {
                'Authorization': `${token_access}`
            },
            agent
        });

        const result = await apiResponse.json();
        if (!apiResponse.ok) {
            return res.status(400).json({ message: 'Error en la API:'+ result.msg, details: result });
        }
        
        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al consultar queja', error });
    }
});

// Ruta para eliminar queja
router.post('/del', async (req, res) => {
    const {folio} = req.body;
    if (!folio) return res.status(400).json({ message: 'Faltan datos' });
    const uEnc = req.cookies.userInfo;
    if (!uEnc) {
        return res.status(400).json({ message: 'No hay información del usuario' });
    }
    const uI = JSON.parse(decodeURIComponent(uEnc));
    const token_access = uI.token_access;
    try {
        const apiResponse = await fetch(`${api_prod}/redeco/quejas/?quejaFolio=${folio}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `${token_access}`,
            },
            agent
        });

        const result = await apiResponse.json();

        if (!apiResponse.ok) {
            return res.status(400).json({ message: 'Error en la API:'+result.msg, details: result });
        }
        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al eliminar la queja', error });
    }
});

app.use('/.netlify/functions/complaint', router);
module.exports.handler = serverless(app);