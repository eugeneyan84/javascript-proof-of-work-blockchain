const express = require('express');
const API_PORT = 5000;

var app = express();

app.get('/blockchain', (req, res) => {
    res.send('Hello Express');
});

app.post('/transaction', () => {

});

app.get('/mine', () => {
    
});

app.listen(API_PORT, () => {
    console.log(`Listening on port ${API_PORT}...`)
});