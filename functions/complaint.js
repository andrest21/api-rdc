const express = require('express');
const serverless = require('serverless-http');
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');

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
    const fieldsNotRequired = ['QuejasSexo', 'QuejasEdad', 'QuejasFecResolucion', 'QuejasRespuesta', 'QuejasNumPenal', 'QuejasPenalizacion'];
    for (const [key, value] of Object.entries(complaintData)) {
        if (!fieldsNotRequired.includes(key)) {
            if (value.trim() === '') {
                return res.status(400).json({ message: `Faltan datos en el campo ${key}` });
            }
        } else {
            if (
                (['QuejasSexo', 'QuejasEdad'].includes(key) && complaintData['QuejasTipoPersona'] === '1' && value.trim() === '') ||
                (key === 'QuejasRespuesta' && complaintData['QuejasEstatus'] === '2' && value.trim() === '')
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
        const apiResponse = await fetch('https://api.condusef.gob.mx/redeco/quejas', {
            method: 'POST',
            headers: {
                'Authorization': `${token_access}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ complaintData })
        });

        const result = await apiResponse.json();

        if (!apiResponse.ok) {
            return res.status(400).json({ message: 'Error en la API', details: result });
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
        // const apiResponse = await fetch(`https://api.condusef.gob.mx/redeco/quejas/?year=${year}&month=${month}`, {
        //     method: 'GET',
        //     headers: {
        //         'Authorization': `${token_access}`
        //     }
        // });

        // const result = await apiResponse.json();

        // if (!apiResponse.ok) {
        //     return res.status(400).json({ message: 'Error en la API', details: result });
        // }
        console.log(year);
        console.log(month);
        const result = true;
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
        // const apiResponse = await fetch(`https://api.condusef.gob.mx/redeco/quejas/?quejaFolio=${folio}`, {
        //     method: 'DELETE',
        //     headers: {
        //         'Authorization': `${token_access}`,
        //     }
        // });

        // const result = await apiResponse.json();

        // if (!apiResponse.ok) {
        //     return res.status(400).json({ message: 'Error en la API', details: result });
        // }
        console.log(folio);
        const result = true;
        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al eliminar la queja', error });
    }
});

app.use('/.netlify/functions/complaint', router);
module.exports.handler = serverless(app);