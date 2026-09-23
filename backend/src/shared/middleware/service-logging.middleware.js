const logger = require("winston");

function serviceLogger(serviceFunction, serviceName) {
  return async (req, ...args) => {
    const userContext = req?.userContext || { username: "Unknown User", ip: "Unknown IP" };
    const { username, ip } = userContext;

    logger.info(
      `User: (${username}) entering (${serviceFunction.name}) function in service (${serviceName}) from: ${ip}`
    );

    try {
      return await serviceFunction(req, ...args); // Pass `req` and other arguments to the service
    } catch (err) {
      logger.error(`Error in ${serviceFunction.name}:`, { message: err.message, stack: err.stack });
      throw err;
    }
  };
}

module.exports = serviceLogger;
