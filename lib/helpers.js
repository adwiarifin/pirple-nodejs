const crypto = require('crypto');
const https =  require('https');
const querystring = require('querystring');
const config = require('./config');

const helpers = {
    hash: function(str) {
        if (typeof str === 'string' && str.length > 0) {
            const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
            return hash;
        } else {
            return false;
        }
    },
    parseJsonToObject: function(str) {
        try {
            const obj = JSON.parse(str);
            return obj;
        } catch (e) {
            return {}
        }
    },
    createRandomString: function(strLength) {
        strLength = typeof(strLength) === 'number' && strLength > 0 ? strLength : false;
        if(strLength) {
            const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
            let str = '';
            for(i = 1; i <= strLength; i++) {
                const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
                str += randomCharacter;
            }
            return str;
        } else {
            return false;
        }
    },
    sendTwilioSms: function(phone, msg, callback) {
        phone = typeof(phone) === 'string' && phone.trim().length >= 10 ? phone.trim() : false;
        msg = typeof(msg) === 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
        console.log('msg:', msg);
        if(phone && msg) {
            const payload = {
                'From': config.twilio.fromPhone,
                'To': phone,
                'Body': msg
            };
            const stringPayload = querystring.stringify(payload);
            const requestDetails = {
                'protocol': 'https:',
                'hostname': 'api.twilio.com',
                'method': 'POST',
                'path': '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
                'auth': config.twilio.accountSid+':'+config.twilio.authToken,
                'headers': {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-length': Buffer.byteLength(stringPayload)
                }
            }
            const req = https.request(requestDetails, function(res) {
                const status = res.statusCode;
                if(status === 200 || status === 201) {
                    callback(false)
                } else {
                    callback('Status code returned was '+status);
                }
                res.on("data", function(chunk) {
                    console.log("BODY: " + chunk);
                });
            });
            req.on('error', function(e) {
                callback(e);
            });
            req.write(stringPayload);
            req.end();
        } else {
            callback('Given parameters were missing or invalid');
        }
    }
};

module.exports = helpers;