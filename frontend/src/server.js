//express server that serves the website
// and also handles 3rd party api connections when
// expedient to do so / / wel designed
const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors()); //Cross-Origin Resource Sharing: set to from anywhere

const fs = require('fs'); //file system lib
const http = require('http');
const https = require('https');

app.use(express.json());

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, '/dist/index.html'));
});
//app.use('/1up', 1up);
//app.use('/umls', umls);
