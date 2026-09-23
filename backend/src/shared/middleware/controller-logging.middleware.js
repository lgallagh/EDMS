const logger = require("winston");

function controllerLogger(controllerFunction, controllerName) {
  return async (req, res, next) => {
    try {
        const username = req.headers["x-username"] || "Unknown User";
        logger.info(`User: (${username}) entering (${controllerFunction.name}) function in controller (${controllerName}) from: ${req.ip}`);
        await controllerFunction(req, res, next);
    } catch (err) {
        logger.error(`Error in ${controllerFunction.name}:`, { message: err.message, stack: err.stack });
        next(err);
    }
  };
}

module.exports = controllerLogger;
