const logger = require('winston');

function routeLogger(req, res, next) {
    const username = req.headers["x-username"] || "Unknown User";
    logger.info(`User: (${username}) entering route (${req.method} ${req.originalUrl}) from: ${req.ip}`);
    next();
}

module.exports = routeLogger;