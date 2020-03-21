const handlers = require('./lib/handlers');

const router = {
    ping: handlers.ping,
    hello: handlers.hello,
    users: handlers.users,
    tokens: handlers.tokens,
    notFound: handlers.notFound
};

module.exports = router;