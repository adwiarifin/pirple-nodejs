const _data = require('./../data');
const helpers = require('./../helpers');

const tokenHandler = {
    post: function(data, callback) {
        const phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length >= 10 ? data.payload.phone.trim() : false;
        const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 6 ? data.payload.password.trim() : false;
        
        if(phone && password) {
            _data.read('users', phone, function(err, userData) {
                if(!err && userData) {
                    const hashedPassword = helpers.hash(password);

                    if(hashedPassword === userData.hashedPassword) {
                        const tokenId = helpers.createRandomString(20);
                        const expires = Date.now() + 1000 * 60 * 60;
                        const tokenObject = {
                            phone,
                            id: tokenId,
                            expires
                        };

                        _data.create('tokens', tokenId, tokenObject, function(err) {
                            if(!err) {
                                callback(200, tokenObject);
                            } else {
                                callback(500, {'Error': 'Could not create the new token'});
                            }
                        })
                    } else {
                        callback(400, {'Error': 'Password did not match the specified user\'s stored password'});
                    }
                } else {
                    callback(400, {'Error': 'Could not find the specified user'});
                }
            })
        } else {
            callback(400, {'Error': 'Missing required field(s)'});
        }
    },
    get: function(data, callback) {
        const id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
        if (id) {
            _data.read('tokens', id, function(err, tokenData) {
                if(!err && tokenData) {
                    callback(200, tokenData);
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
        const extend = typeof(data.payload.extend) === 'boolean' && data.payload.extend === true ? true : false;

        if(id && extend) {
            _data.read('tokens', id, function(err, tokenData) {
                if(!err && tokenData) {
                    if(tokenData.expires > Date.now()) {
                        tokenData.expires = Date.now() + 1000 * 60 * 60;
                        _data.update('tokens', id, tokenData, function(err) {
                            if(!err) {
                                callback(200);
                            } else {
                                callback(500, {'Error': 'Could not update the token expiration'});
                            }
                        });
                    } else {
                        callback(400, {'Error': 'The token has already expired, and cannot be extended'});
                    }
                } else {
                    callback(400, {'Error': 'Specified token does not exists'});
                }
            });
        } else {
            callback(400, {'Error': 'Missing required field(s) or field(s) are invalid'});
        }
    },
    delete: function(data, callback) {
        const id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
        if (id) {
            _data.read('tokens', id, function(err, data) {
                if(!err && data) {
                    _data.delete('tokens', id, function(err) {
                        if(!err) {
                            callback(200);
                        } else {
                            callback(500, {'Error': 'Could not delete the specified token'});
                        }
                    })
                } else {
                    callback(400, {'Error': 'Could not find the specified token'});
                }
            });
        } else {
            callback(400, {'Error': 'Missing required field'});
        }
    },
    verifyToken: function(id, phone, callback) {
        _data.read('tokens', id, function(err, tokenData) {
            if(!err && tokenData) {
                if (tokenData.phone === phone && tokenData.expires > Date.now()) {
                    callback(true);
                } else {
                    callback(false);
                }
            } else {
                callback(false);
            }
        });
    }
};

module.exports = tokenHandler;