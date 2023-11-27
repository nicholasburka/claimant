//express server that serves the website
// and also handles 3rd party api connections when
// expedient to do so / / wel designed
const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors()); //Cross-Origin Resource Sharing: set to from anywhere

const fs = require('fs'); //file system lib
const path = require('path');
const http = require('http');
const https = require('https');
const serveStatic = require('serve-static');

app.use(express.json());
app.use(express.static('dist'));
app.use(express.static('./'));
app.use(serveStatic(path.join(__dirname, 'dist')));
app.use(serveStatic(path.join(__dirname, 'data')));

app.get('/', async (req, res) => {
    const reject = () => {
        res.setHeader('www-authenticate', "Basic");
        res.sendStatus(401);
    }

    const auth = req.headers.authorization;

    if (!auth) {
        return reject();
    }

    const [username, password] = Buffer.from(
        auth.replace("Basic ", ""),
        "base64")
        .toString()
        .split(":");

    if (!(username === "team" && password === "rambuxka")) {
        return reject();
    } else {
        res.sendFile(path.join(__dirname, '/dist/index.html'));
    }
});
app.get('/claimant', async (req, res) => {
    const reject = () => {
        res.setHeader('www-authenticate', "Basic");
        res.sendStatus(401);
    }

    const auth = req.headers.authorization;

    if (!auth) {
        return reject();
    }

    const [username, password] = Buffer.from(
        auth.replace("Basic ", ""),
        "base64")
        .toString()
        .split(":");

    if (!(username === "team" && password === "rambuxka")) {
        return reject();
    } else {
        res.sendFile(path.join(__dirname, '/dist/index.html'));
    }
});

app.get('/client', async (req, res) => {
    console.log("get client");
    let loc = req.query.loc;
    try {
        let serverClientData = fs.readFileSync(path.join(__dirname, loc));
        console.log("got file");
        console.log(serverClientData);
        res.send(serverClientData);
    } catch (err) {
        console.log("could not get file");
        console.log(err);
        res.sendStatus(500);
        //
    }
});


//app.use('/1up', 1up);
//app.use('/umls', umls);

const PORT = process.env.PORT || 4444;
const serv = http.createServer(app);
serv.listen(PORT, function() {
    console.log("listening on: " + PORT);
})
