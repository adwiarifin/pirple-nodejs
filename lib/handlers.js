const _data = require('./data');

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
            handlers._users[data.method](data, callback);
        } else {
            callback(405);
        }
    },
    notFound: function (data, callback) {
        callback(404);
    },
    _users: {
        // Users - post
        // Required data: firstName, lastName, phone, password, tosAgreement
        // Optional data: none
        post: function (data, callback) {
            const firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
            const lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
            const phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length >= 10 ? data.payload.phone.trim() : false;
            const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 6 ? data.payload.password.trim() : false;
            const tosAgreement = typeof(data.payload.password) === 'boolean' && data.payload.password === true ? true : false;

            if (firstName && lastName && phone && password && tosAgreement) {
                // Make sure that user doesn't already exist
                _data.read('users', phone, function (err, data) {
                    if (err) {
                        // Hash the password
                    } else {
                        // User already exist
                        callback(400, {'Error' : 'A user with that phone number'});
                    }
                });
            } else {
                callback(400, {'Error': 'Missing required fields'});
            }
        },
        get: function (data, callback) {

        },
        put: function (data, callback) {

        },
        delete: function (data, callback) {

        },
    }
};

module.exports = handlers;