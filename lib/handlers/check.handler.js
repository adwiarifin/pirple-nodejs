const _data = require('./../data');
const config = require('./../config');
const helpers = require('./../helpers');
const _tokens = require('./token.handler');

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
                            const userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
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
    },
    get: function(data, callback) {
        const id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
        if (id) {
            _data.read('checks', id, function(err, checkData) {
                if(!err && checkData) {
                    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
                    _tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
                        if(tokenIsValid) {
                            callback(200, checkData);
                        } else {
                            callback(403, {'Error': 'Missing required token in header, or token is invalid'});
                        }
                    });
                } else {
                    callback(404);
                }
            });
        } else {
            callback(400, {'Error': 'Missing required field'});
        }
    },
    put: function(data, callback) {
        const id = typeof(data.payload.id) === 'string' && data.payload.id.trim().length == 20 ? data.payload.id : false;

        const protocol = typeof(data.payload.protocol) === 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
        const url = typeof(data.payload.url) === 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
        const method = typeof(data.payload.method) === 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
        const successCodes = typeof(data.payload.successCodes) === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
        const timeoutSeconds = typeof(data.payload.timeoutSeconds) === 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

        if (id) {
            if(protocol || url || method || successCodes || timeoutSeconds) {
                _data.read('checks', id, function(err, checkData) {
                    if (!err && checkData) {
                        const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
                        _tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
                            if (tokenIsValid) {
                                if(protocol) {
                                    checkData.protocol = protocol;
                                }
                                if(url) {
                                    checkData.url = url;
                                }
                                if(method) {
                                    checkData.method = method;
                                }
                                if(successCodes) {
                                    checkData.successCodes = successCodes;
                                }
                                if(timeoutSeconds) {
                                    checkData.timeoutSeconds = timeoutSeconds;
                                }
                                
                                _data.update('checks', id, checkData, function(err) {
                                    if(!err) {
                                        callback(200);
                                    } else {
                                        console.log(err);
                                        callback(500, {'Error': 'Could not update the check'});
                                    }
                                });
                            } else {
                                callback(403, {'Error': 'Missing required token in header, or token is invalid'});
                            }
                        });
                    } else {
                        callback(400, {'Error': 'Check ID did not exist'});
                    }
                });
            } else {
                callback(400, {'Error': 'Missing field to update'});
            }
        } else {
            callback(400, {'Error': 'Missing required field'});
        }
    },
    delete: function(data, callback) {
        const id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length >= 10 ? data.queryStringObject.id : false;
        if (id) {
            _data.read('checks', id, function(err, checkData) {
                if(!err && checkData) {
                    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
                    _tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
                        if(tokenIsValid) {
                            _data.delete('checks', id, function(err) {
                                if(!err) {
                                    _data.read('users', checkData.userPhone, function(err, userData) {
                                        if(!err && userData) {
                                            const userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
                                            const checkPosition = userChecks.indexOf(id);
                                            if (checkPosition > -1) {
                                                userChecks.splice(checkPosition, 1);
                                                _data.update('users', checkData.userPhone, userData, function(err) {
                                                    if(!err) {
                                                        callback(200);
                                                    } else {
                                                        callback(500, {'Error': 'Could not update the user'});
                                                    }
                                                })
                                            } else {
                                                callback(500, {'Error': 'Could not find the check on the users object, so could not remove it'});
                                            }
                                        } else {
                                            callback(500, {'Error': 'Could not find the user who created the check, so could not remove the check from the list of checks on the user object'});
                                        }
                                    });
                                } else {
                                    callback(500, {'Error': 'Could not delete the check data'});
                                }
                            });
                        } else {
                            callback(403, {'Error': 'Missing required token in header, or token is invalid'});
                        }
                    });
                } else {
                    callback(400, {'Error': 'The specified check ID does not exist'});
                }
            });
        } else {
            callback(400, {'Error': 'Missing required field'});
        }
    }
};

module.exports = checkHandler;