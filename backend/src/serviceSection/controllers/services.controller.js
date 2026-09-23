const serviceService = require("../services/services.service");
const logger = require("winston");
const wrapControllerFunctions = require('../../shared/middleware/controller-wrapper.middleware');

async function services(req, res, next) {
  try {
    res.json(await serviceService.services(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Services list", err.message);
    next(err);
  }
}

async function loadService(req, res, next) {
  try {
    res.json(await serviceService.loadService(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Services data", err.message);
    next(err);
  }
}

async function updateService(req, res, next) {
  try {
    res.json(await serviceService.updateService(req, res, next));
  } catch (err) {
    logger.error("Error while updating Service", err.message);
    next(err);
  }
}

async function addService(req, res, next) {
  try {
    res.json(await serviceService.addService(req, res, next));
  } catch (err) {
    logger.error("Error while adding Service", err.message);
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    res.json(await serviceService.updateStatus(req, res, next));
  } catch (err) {
    logger.error("Error while updating Service status", err.message);
    next(err);
  }
}

async function updateSortOrder(req, res, next) {
  try {
    res.json(await serviceService.updateSortOrder(req, res, next));
  } catch (err) {
    logger.error("Error while updating Service sort orders", err.message);
    next(err);
  }
}

async function deleteService(req, res, next) {
  try {
    res.json(await serviceService.deleteService(req, res, next));
  } catch (err) {
    logger.error("Error while deleting Service", err.message);
    next(err);
  }
}

module.exports = wrapControllerFunctions({
  services,
  loadService,
  updateService,
  addService,
  updateStatus,
  updateSortOrder,
  deleteService
}, "service-details.controller");
