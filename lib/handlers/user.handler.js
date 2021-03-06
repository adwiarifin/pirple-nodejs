const _data = require('./../data');
const helpers = require('./../helpers');
const _tokens = require('./token.handler');

const userHandler = {
    // Users - post
    // Required data: firstName, lastName, phone, password, tosAgreement
    // Optional data: none
    post: function (data, callback) {
        const firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
        const lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
        const phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length >= 10 ? data.payload.phone.trim() : false;
        const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 6 ? data.payload.password.trim() : false;
        const tosAgreement = typeof(data.payload.tosAgreement) === 'boolean' && data.payload.tosAgreement === true ? true : false;

        if (firstName && lastName && phone && password && tosAgreement) {
            // Make sure that user doesn't already exist
            _data.read('users', phone, function (err, data) {
                if (err) {
                    // Hash the password
                    const hashedPassword = helpers.hash(password);

                    if (hashedPassword) {
                        const userObject = {
                            firstName,
                            lastName,
                            phone,
                            hashedPassword,
                            tosAgreement
                        };

                        _data.create('users', phone, userObject, function(err) {
                            if(!err) {
                                callback(200);
                            } else {
                                console.log(err);
                                callback(500, {'Error': 'Could not create a new user'});
                            }
                        });
                    } else {
                        callback(500, {'Error': 'Could not hash the user\'s password'});
                    }
                } else {
                    // User already exist
                    callback(400, {'Error' : 'A user exists with that phone number'});
                }
            });
        } else {
            callback(400, {'Error': 'Missing required fields'});
        }
    },
    get: function (data, callback) {
        const phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length >= 10 ? data.queryStringObject.phone : false;
        if (phone) {
            const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
            _tokens.verifyToken(token, phone, function(tokenIsValid) {
                if(tokenIsValid) {
                    _data.read('users', phone, function(err, data) {
                        if(!err && data) {
                            delete data.hashedPassword;
                            callback(200, data);
                        } else {
                            callback(404);
                        }
                    });
                } else {
                    callback(403, {'Error': 'Missing required token in header, or token is invalid'});
                }
            });
        } else {
            callback(400, {'Error': 'Missing required field'});
        }
    },
    put: function (data, callback) {
        const phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length >= 10 ? data.payload.phone : false;

        const firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
        const lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
        const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 6 ? data.payload.password.trim() : false;

        if (phone) {
            const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
            _tokens.verifyToken(token, phone, function(tokenIsValid) {
                if (tokenIsValid) {
                    if(firstName || lastName || password) {
                        _data.read('users', phone, function(err, userData) {
                            if (!err && userData) {
                                if(firstName) {
                                    userData.firstName = firstName;
                                }
                                if(lastName) {
                                    userData.lastName = lastName;
                                }
                                if(password) {
                                    userData.hashedPassword = helpers.hash(password);
                                }
        
                                _data.update('users', phone, userData, function(err) {
                                    if(!err) {
                                        callback(200);
                                    } else {
                                        console.log(err);
                                        callback(500, {'Error': 'Could not update the user'});
                                    }
                                });
                            } else {
                                callback(400, {'Error': 'The spesified user does not exist'});
                            }
                        })
                    } else {
                        callback(400, {'Error': 'Missing field to update'});
                    }
                } else {
                    callback(403, {'Error': 'Missing required token in header, or token is invalid'});
                }
            });
        } else {
            callback(400, {'Error': 'Missing required field'});
        }
    },
    delete: function (data, callback) {
        const phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length >= 10 ? data.queryStringObject.phone : false;
        if (phone) {
            const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
            _tokens.verifyToken(token, phone, function(tokenIsValid) {
                if(tokenIsValid) {
                    _data.read('users', phone, function(err, data) {
                        if(!err && data) {
                            _data.delete('users', phone, function(err) {
                                if(!err) {
                                    const userChecks = typeof(data.checks) === 'object' && data.checks instanceof Array ? data.checks : [];
                                    const checksToDelete = userChecks.length;
                                    if (checksToDelete > 0) {
                                        let checksDeleted = 0;
                                        let deletionErrors = false;

                                        userChecks.forEach(function(checkId) {
                                            _data.delete('checks', checkId, function(err) {
                                                if(err) {
                                                    deletionErrors = true;
                                                }
                                                checksDeleted++;
                                                if(checksDeleted === checksToDelete) {
                                                    if(!deletionErrors) {
                                                        callback(200);
                                                    } else {
                                                        callback(500, {'Error': 'Errors encountered while attempting to delete all of the users\'s checks. All checks may not have been deleted from the system successfully'});
                                                    }
                                                }
                                            });
                                        });
                                    } else {
                                        callback(200);
                                    }
                                } else {
                                    callback(500, {'Error': 'Could not delete the specified user'});
                                }
                            })
                        } else {
                            callback(400, {'Error': 'Could not find the specified user'});
                        }
                    });
                } else {
                    callback(403, {'Error': 'Missing required token in header, or token is invalid'});
                }
            });
        } else {
            callback(400, {'Error': 'Missing required field'});
        }
    },
}

module.exports = userHandler;