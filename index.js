const server = require('./lib/server');
const worker = require('./lib/worker');

const app = {
    init: function() {
        server.init();
        worker.init();
    }
}

app.init();

module.exports = app;