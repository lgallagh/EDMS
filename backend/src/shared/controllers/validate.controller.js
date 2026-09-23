const validateService = require("../services/validate.service");
const logger = require("winston");
const wrapControllerFunctions = require('../../shared/middleware/controller-wrapper.middleware');

async function validateVanityURL(req, res, next) {
  try {
    res.json(await validateService.validateVanityURL(req, res, next));
  } catch (err) {
    logger.error("Error while validating vanity URL", err.message);
    next(err);
  }
}

module.exports = wrapControllerFunctions({
    validateVanityURL
  }, "validate.controller");
  