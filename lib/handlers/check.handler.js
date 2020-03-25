const _data = require('./../data');
const config = require('./../config');
const helpers = require('./../helpers');

const checkHandler = {
    post: function(data, callback) {
        const protocol = typeof(data.payload.protocol) === 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
        const url = typeof(data.payload.url) === 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
        const method = typeof(data.payload.method) === 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
        const successCodes = typeof(data.payload.successCodes) === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
        const timeoutSeconds = typeof(data.payload.timeoutSeconds) === 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

        if (protocol && url && method && successCodes && timeoutSeconds) {
            const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
            _data.read('tokens', token, function(err, tokenData) {
                if(!err && tokenData) {
                    const userPhone = tokenData.phone;
                    _data.read('users', userPhone, function(err, userData) {
                        if(!err && userData) {
                            const userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof 'Array' ? userData.checks : [];
                            if (userChecks.length < config.maxChecks) {
                                const checkId = helpers.createRandomString(20);
                                const checkObject = {
                                    id: checkId,
                                    userPhone,
                                    protocol,
                                    url,
                                    method,
                                    successCodes,
                                    timeoutSeconds
                                };

                                _data.create('checks', checkId, checkObject, function(err) {
                                    if(!err) {
                                        userData.checks = userChecks;
                                        userData.checks.push(checkId);

                                        _data.update('users', userPhone, userData, function(err) {
                                            if(!err) {
                                                callback(200, checkObject);
                                            } else {
                                                callback(500, {'Error': 'Could not update the user with the new check'});
                                            }
                                        });
                                    } else {
                                        callback(500, {'Error': 'Could not create the new check'});
                                    }
                                })
                            } else {
                                callback(400, {'Error': 'The user already has the maximum number of checks ('+config.maxChecks+')'});
                            }
                        } else {
                            callback(403);
                        }
                    });
                } else {
                    callback(403);
                }
            });
        } else {
            callback(400, {'Error': 'Missing required inputs, or inputs are invalid'});
        }
    }
};

module.exports = checkHandler;