const controllerLogger = require("./controller-logging.middleware");

function wrapControllerFunctions(controllerModule, controllerName) {
  const wrappedControllers = {};
  for (const key in controllerModule) {
    if (typeof controllerModule[key] === "function") {
      wrappedControllers[key] = controllerLogger(controllerModule[key], controllerName);
    }
  }
  return wrappedControllers;
}

module.exports = wrapControllerFunctions;
