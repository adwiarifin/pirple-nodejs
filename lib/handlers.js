const _users = require('./handlers/user.handler');
const _tokens = require('./handlers/token.handler');
const _checks = require('./handlers/check.handler');

const handlers = {
    ping: function (data, callback) {
        callback(200);
    },
    hello: function (data, callback) {
        callback(200, { message: 'Hello World' });
    },
    users: function (data, callback) {
        const acceptableMethods = ['post', 'get', 'put', 'delete'];
        if (acceptableMethods.indexOf(data.method) > -1) {
            _users[data.method](data, callback);
        } else {
            callback(405);
        }
    },
    tokens: function (data, callback) {
        const acceptableMethods = ['post', 'get', 'put', 'delete'];
        if (acceptableMethods.indexOf(data.method) > -1) {
            _tokens[data.method](data, callback);
        } else {
            callback(405);
        }
    },
    checks: function (data, callback) {
        const acceptableMethods = ['post', 'get', 'put', 'delete'];
        if (acceptableMethods.indexOf(data.method) > -1) {
            _checks[data.method](data, callback);
        } else {
            callback(405);
        }
    },
    notFound: function (data, callback) {
        callback(404);
    },
};

module.exports = handlers;