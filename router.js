const handlers = require('./lib/handlers');

const router = {
    ping: handlers.ping,
    hello: handlers.hello,
    users: handlers.users,
    tokens: handlers.tokens,
    checks: handlers.checks,
    notFound: handlers.notFound
};

module.exports = router;