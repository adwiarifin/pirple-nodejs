const path = require('path');
const fs = require('fs');
const _data = require('./data');
const _logs = require('./logs');
const https = require('https');
const http = require('http');
const helpers = require('./helpers');
const url = require('url');
const util = require('util');
const debug = util.debuglog('workers');

const worker = {
    alertUserToStatusChange: function(newCheckData) {
        const message = `Alert: Your check for ${newCheckData.method.toUpperCase()} ${newCheckData.protocol}://${newCheckData.url} is currently ${newCheckData.state}`;
        helpers.sendTwilioSms(newCheckData.userPhone, message, function(err) {
            if(!err) {
                debug('Success: User was alerted to a status change in their check, via sms', message);
            } else {
                debug('Error: Could not sned sms alert to user who had a state changed');
            }
        })
    },
    processCheckOutcome: function(originalCheckData, checkOutcome) {
        const state = !originalCheckData.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';
        const alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;

        const timeOfCheck = Date.now();
        worker.log(originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck)

        const newCheckData = originalCheckData;
        newCheckData.state = state;
        newCheckData.lastChecked = timeOfCheck;

        _data.update('checks', newCheckData.id, newCheckData, function(err) {
            if(!err) {
                if(alertWarranted) {
                    worker.alertUserToStatusChange(newCheckData);
                } else {
                    debug('Check outcome has not changed, no alert needed');
                }
            } else {
                debug('Error trying to save updates to one of the checks');
            }
        })
    },
    performCheck: function(originalCheckData) {
        const checkOutcome = {
            error: false,
            responseCode: false,
        };
        let outcomeSent = false;

        const parsedUrl = url.parse(`${originalCheckData.protocol}://${originalCheckData.url}`, true);
        const hostname = parsedUrl.hostname;
        const path = parsedUrl.path;

        const requestDetails = {
            protocol: originalCheckData.protocol+':',
            hostname,
            method: originalCheckData.method.toUpperCase(),
            path,
            timeout: originalCheckData.timeoutSeconds * 1000
        };
        const _moduleToUse = originalCheckData.protocol === 'https' ? https : http;
        const req = _moduleToUse.request(requestDetails, function(res) {
            const status = res.statusCode;

            checkOutcome.responseCode = status;
            if (!outcomeSent) {
                worker.processCheckOutcome(originalCheckData, checkOutcome);
                outcomeSent = true;
            }
        });
        req.on('error', function(err) {
            checkOutcome.error = {
                error: true,
                value: err
            };
            if (!outcomeSent) {
                worker.processCheckOutcome(originalCheckData, checkOutcome);
                outcomeSent = true;
            }
        });
        req.on('timeout', function(err) {
            checkOutcome.error = {
                error: true,
                value: 'timeout'
            };
            if (!outcomeSent) {
                worker.processCheckOutcome(originalCheckData, checkOutcome);
                outcomeSent = true;
            }
        });
        req.end();
    },
    validateCheckData: function(originalCheckData) {
        originalCheckData = typeof(originalCheckData) === 'object' && originalCheckData !== null ? originalCheckData : {};
        originalCheckData.id = typeof(originalCheckData.id) === 'string' && originalCheckData.id.trim().length === 20 ? originalCheckData.id.trim() : false;
        originalCheckData.userPhone = typeof(originalCheckData.userPhone) === 'string' && originalCheckData.userPhone.trim().length >= 10 ? originalCheckData.userPhone.trim() : false;
        originalCheckData.protocol = typeof(originalCheckData.protocol) === 'string' && ['http', 'https'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false;
        originalCheckData.url = typeof(originalCheckData.url) === 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
        originalCheckData.method = typeof(originalCheckData.method) === 'string' && ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) ? originalCheckData.method : false;
        originalCheckData.successCodes = typeof(originalCheckData.successCodes) === 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;
        originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) === 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false;

        originalCheckData.state = typeof(originalCheckData.state) === 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
        originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) === 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

        if (originalCheckData.id 
            && originalCheckData.userPhone
            && originalCheckData.protocol
            && originalCheckData.url
            && originalCheckData.method
            && originalCheckData.successCodes 
            && originalCheckData.timeoutSeconds) {
            worker.performCheck(originalCheckData);
        } else {
            debug('Error: One of the checks is not properly formatted. Skipping it.')
        }
    },
    gatherAllChecks: function() {
        _data.list('checks', function(err, checks) {
            if (!err && checks && checks.length > 0) {
                checks.forEach(function(check) {
                    _data.read('checks', check, function(err, originalCheckData) {
                        if (!err && originalCheckData) {
                            worker.validateCheckData(originalCheckData);
                        } else {
                            debug('Error reading one of the check\'s data');
                        }
                    });
                });
            } else {
                debug('Error: Could not find any checks to process');
            }
        });
    },
    loop: function() {
        setInterval(function() {
            worker.gatherAllChecks();
        }, 1000 * 60);
    },
    logRotationLoop: function() {
        setInterval(function() {
            worker.rotateLogs();
        }, 1000 * 60 * 60 * 24);
    },
    init: function() {
        console.log('\x1b[33m%s\x1b[0m', 'Background workers are running');
        worker.gatherAllChecks();
        worker.loop();
        worker.rotateLogs();
        worker.logRotationLoop();
    },
    log: function(originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck) {
        const logData = {
            check: originalCheckData,
            outcome: checkOutcome,
            state,
            alert: alertWarranted,
            time: timeOfCheck
        }

        const logString = JSON.stringify(logData);
        const logFileName = originalCheckData.id;
        _logs.append(logFileName, logString, function(err) {
            if(!err) {
                debug('Logging to file succeeded');
            } else {
                debug('logging to file failed');
            }
        })
    },
    rotateLogs: function() {
        _logs.list(false, function(err, logs) {
            if(!err && logs && logs.length > 0) {
                logs.forEach(function(logName) {
                    const logId = logName.replace('.log', '');
                    const newFileId = logId + '-' + Date.now();
                    _logs.compress(logId, newFileId, function(err) {
                        if(!err) {
                            _logs.truncate(logId, function(err) {
                                if(!err) {
                                    debug('Success truncating logFile');
                                } else {
                                    debug('Error truncating logFile');
                                }
                            });
                        } else {
                            debug('Error compressing one of the log files', err);
                        }
                    });
                });
            } else {
                debug('Error: could not find any logs to rotate');
            }
        });
    }
};

module.exports = worker;