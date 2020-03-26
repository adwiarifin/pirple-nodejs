const fs = require('fs');
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config =  require('./config');
const helpers = require('./helpers');
const router = require('./router');

const unifiedServer = function (req, res) {
    const parsedUrl = url.parse(req.url, true);
    
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    const queryStringObject = parsedUrl.query;

    const method = req.method.toLowerCase();

    const headers = req.headers;

    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', function (data) {
        buffer += decoder.write(data);
    });
    req.on('end', function () {
        buffer += decoder.end();

        const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : router.notFound;

        const data = {
            trimmedPath,
            queryStringObject,
            method,
            headers,
            payload: helpers.parseJsonToObject(buffer)
        };

        chosenHandler(data, function (statusCode, payload) {
            statusCode = typeof(statusCode) === 'number' ? statusCode : 200;
            payload = typeof(payload) === 'object' ? payload : {};

            const payloadString = JSON.stringify(payload);

            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            console.log('Returning this response:', statusCode, payloadString);
        });
    });
}

// create server
const httpsOptions = {
    key: fs.readFileSync('./https/key.pem'),
    cert: fs.readFileSync('./https/cert.pem')
}
const httpsServer = https.createServer(httpsOptions, unifiedServer);
const httpServer = http.createServer(unifiedServer);


const server = {
    init: function() {
        // server listen
        httpServer.listen(config.httpPort, function () {
            console.log(`The server is listening on port ${config.httpPort} in ${config.envName} now`);
        });
        httpsServer.listen(config.httpsPort, function () {
            console.log(`The server is listening on port ${config.httpsPort} in ${config.envName} now`);
        });
    }
}

module.exports = server;