const http = require('http');
const https = require('https');
const config =  require('./lib/config');
const server = require('./server');
const fs = require('fs');

// create server
const httpsOptions = {
    key: fs.readFileSync('./https/key.pem'),
    cert: fs.readFileSync('./https/cert.pem')
}
const httpsServer = https.createServer(httpsOptions, server);
const httpServer = http.createServer(server);

// server listen
httpServer.listen(config.httpPort, function () {
    console.log(`The server is listening on port ${config.httpPort} in ${config.envName} now`);
});
httpsServer.listen(config.httpsPort, function () {
    console.log(`The server is listening on port ${config.httpsPort} in ${config.envName} now`);
});