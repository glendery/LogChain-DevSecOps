const express = require('express');
const app = express();
const port = 3000;
const crypto = require('crypto');
const metrics = require('express-prometheus-middleware');

app.use(express.json());

app.use(metrics({
    metricsPath: '/metrics',
    collectDefaultMetrics: true,
    requestDurationMetrics: true,
}));

let transactionLog = [];

function createLogEntry(data) {
    const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    const entry = {
        timestamp: new Date().toISOString(),
        data: data,
        hash: hash
    };
    transactionLog.push(entry);
    return entry;
}

app.post('/api/record', (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader !== 'Bearer ROLE1_SECRET') {
        return res.status(401).send({ message: 'Akses Ditolak: Hanya untuk Pencatat.' });
    }
    
    if (!req.body.event) {
        return res.status(400).send({ message: 'Input "event" dibutuhkan.' });
    }

    const newEntry = createLogEntry(req.body);
    console.log(`Pencatatan Baru oleh Pencatat: ${newEntry.hash}`);
    res.status(201).send({ 
        message: 'Log berhasil dicatat.', 
        entry: newEntry 
    });
});

app.get('/api/logs', (req, res) => {
    res.status(200).send({
        total_entries: transactionLog.length,
        logs: transactionLog.map(log => ({ 
            timestamp: log.timestamp, 
            data: log.data, 
            hash_id: log.hash.substring(0, 10) + '...'
        })) 
    });
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.get('/vulnerable', (req, res) => {
    res.send(`<h1>Hello ${req.query.name || 'Guest'}</h1>`); 
});


app.listen(port, () => {
    console.log(`Aplikasi LogChain berjalan di http://localhost:${port}`);
});
