const fs = require('fs');
const winston = require('winston');
require('winston-daily-rotate-file');

const { combine, timestamp, label, printf, errors } = winston.format;

// Get custom log format from environment variables
const customFormat = process.env.LOG_FORMAT;

// Define log format
const myFormat = customFormat
  ? printf(({ level, message, label, timestamp, stack }) => {
      let format = customFormat;
      format = format.replace(new RegExp('\\{level\\}', 'g'), level);
      format = format.replace(new RegExp('\\{message\\}', 'g'), message);
      format = format.replace(new RegExp('\\{label\\}', 'g'), label);
      format = format.replace(new RegExp('\\{timestamp\\}', 'g'), timestamp);
      format = format.replace(new RegExp('\\{stack\\}', 'g'), stack ? '\n' + stack : '');
      format = format.replace(new RegExp('\\{newline\\}', 'g'), '\n');
      return format;
    })
  : winston.format.simple();

// General-purpose logging
const appLog = new winston.transports.DailyRotateFile({
  level: process.env.LOG_FILE_LEVEL,
  filename: process.env.LOG_FILE_PATH,
  handleExceptions: true,
  maxSize: process.env.LOG_FILE_MAX_SIZE,
  maxFiles: process.env.LOG_FILE_MAX_FILES,
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), myFormat),
});

// Create a hard link to the latest application log
appLog.on('new', (newFilename) => {
  fs.unlink(process.env.LOG_FILE_PATH, (err) => {
    if (err) {
      winston.debug('Hard link does not exist for application log');
    }
    fs.link(newFilename, process.env.LOG_FILE_PATH, (err) => {
      if (err) throw err;
      winston.debug(`Hard link created for application log: ${newFilename}`);
    });
  });
});

// Error logging
const errorLog = new winston.transports.DailyRotateFile({
  level: 'error',
  filename: process.env.ERROR_LOG_FILE_PATH,
  handleExceptions: true,
  maxSize: process.env.LOG_FILE_MAX_SIZE,
  maxFiles: process.env.LOG_FILE_MAX_FILES,
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), myFormat),
});

// Create a hard link to the latest error log
errorLog.on('new', (newFilename) => {
  fs.unlink(process.env.ERROR_LOG_FILE_PATH, (err) => {
    if (err) {
      winston.debug('Hard link does not exist for error log');
    }
    fs.link(newFilename, process.env.ERROR_LOG_FILE_PATH, (err) => {
      if (err) throw err;
      winston.debug(`Hard link created for error log: ${newFilename}`);
    });
  });
});

// Console logging
const consoleLog = new winston.transports.Console({
  level: 'debug',
  handleExceptions: true,
  format: combine(
    errors({ stack: true }),
    winston.format.colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    myFormat
  ),
});

// Configure Winston with all transports
winston.configure({
  transports: [appLog, errorLog, consoleLog],
  exitOnError: false,
});

// Allow Morgan logging to be recorded by Winston
module.exports.stream = {
  write: function (message) {
    winston.info(message);
  },
};
