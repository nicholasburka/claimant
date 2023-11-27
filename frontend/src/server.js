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

app.get('/client', async (req, res) => {
    let loc = req.query.loc;
    try {
        let serverClientData = await fs.readFile(loc);
        console.log("got file");
        console.log(serverClientData);
        res.send(serverClientData);
    } catch (err) {
        console.log("could not get file");
        console.log(err);
        res.sendStatus(500);
        //
    }
})
//app.use('/1up', 1up);
//app.use('/umls', umls);
