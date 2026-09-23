const serviceLogger = require("./service-logging.middleware");

function wrapServiceFunctions(serviceModule, serviceName) {
  const wrappedServices = {};
  for (const key in serviceModule) {
    if (typeof serviceModule[key] === "function") {
      wrappedServices[key] = serviceLogger(serviceModule[key], serviceName);
    } else {
      wrappedServices[key] = serviceModule[key];
    }
  }
  return wrappedServices;
}

module.exports = wrapServiceFunctions;
