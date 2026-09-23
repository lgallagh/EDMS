const slpService = require("../services/slp-details.service");
const logger = require("winston");
const wrapControllerFunctions = require('../../shared/middleware/controller-wrapper.middleware');

async function slps(req, res, next) {
  try {
    res.json(await slpService.slps(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving SLPs list", err.message);
    next(err);
  }
}

async function loadSLP(req, res, next) {
  try {
    res.json(await slpService.loadSLP(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving SLPs data", err.message);
    next(err);
  }
}

async function updateSLP(req, res, next) {
  try {
    res.json(await slpService.updateSLP(req, res, next));
  } catch (err) {
    logger.error("Error while updating SLP", err.message);
    next(err);
  }
}

async function addSLP(req, res, next) {
  try {
    res.json(await slpService.addSLP(req, res, next));
  } catch (err) {
    logger.error("Error while adding SLP", err.message);
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    res.json(await slpService.updateStatus(req, res, next));
  } catch (err) {
    logger.error("Error while updating SLP status", err.message);
    next(err);
  }
}

async function deleteSLP(req, res, next) {
  try {
    res.json(await slpService.deleteSLP(req, res, next));
  } catch (err) {
    logger.error("Error while deleting SLP", err.message);
    next(err);
  }
}

module.exports = wrapControllerFunctions({
  slps,
  loadSLP,
  updateSLP,
  addSLP,
  updateStatus,
  deleteSLP
}, "slp-details.controller");
