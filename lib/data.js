const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

const lib = {
  baseDir: path.join(__dirname, '/../.data/'),
  create: function (dir, file, data, callback) {
    if (!fs.existsSync(lib.baseDir + dir)) {
      console.log('Directory not exists, creating directory ' + dir);
      fs.mkdirSync(lib.baseDir + dir);
    }
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', function (err, fileDescriptor) {
      if (!err && fileDescriptor) {
        const stringData = JSON.stringify(data);
        fs.writeFile(fileDescriptor, stringData, function (err) {
          if (!err) {
            fs.close(fileDescriptor, function (err) {
              if (!err) {
                callback(false);
              } else {
                callback('Error closing new file');
              }
            })
          } else {
            callback('Error writing to new file');
          }
        });
      } else {
        callback('Could not create new file, it may already exist');
      }
    });
  },
  read: function (dir, file, callback) {
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf-8', function (err, data) {
      if (!err && data) {
        const parsedData = helpers.parseJsonToObject(data);
        callback(false, parsedData);
      } else {
        callback(err, data);
      }
    })
  },
  update: function (dir, file, data, callback) {
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', function (err, fileDescriptor) {
      if (!err && fileDescriptor) {
        const stringData = JSON.stringify(data);

        fs.ftruncate(fileDescriptor, function (err) {
          if (!err) {
            fs.writeFile(fileDescriptor, stringData, function (err) {
              if (!err) {
                fs.close(fileDescriptor, function (err) {
                  if (!err) {
                    callback(false);
                  } else {
                    callback('Error closing existing file');
                  }
                })
              } else {
                callback('Error writing to existing file');
              }
            });
          } else {
            callback('Error truncating file');
          }
        })
      } else {
        callback('Could not create new file, it may already exist');
      }
    });
  },
  delete: function (dir, file, callback) {
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', function (err) {
      if (!err) {
        callback(false);
      } else {
        callback('Error deleting file');
      }
    })
  }
};

module.exports = lib;