const npService = require("../services/np-details.service");
const logger = require("winston");
const wrapControllerFunctions = require('../../shared/middleware/controller-wrapper.middleware');

async function nps(req, res, next) {
  try {
    res.json(await npService.nps(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving NPs list", err.message);
    next(err);
  }
}

async function loadNP(req, res, next) {
  try {
    res.json(await npService.loadNP(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving NP data", err.message);
    next(err);
  }
}

async function updateNP(req, res, next) {
  try {
    res.json(await npService.updateNP(req, res, next));
  } catch (err) {
    logger.error("Error while updating NP", err.message);
    next(err);
  }
}

async function addNP(req, res, next) {
  try {
    res.json(await npService.addNP(req, res, next));
  } catch (err) {
    logger.error("Error while adding NP", err.message);
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    res.json(await npService.updateStatus(req, res, next));
  } catch (err) {
    logger.error("Error while updating NP status", err.message);
    next(err);
  }
}

async function deleteNP(req, res, next) {
  try {
    res.json(await npService.deleteNP(req, res, next));
  } catch (err) {
    logger.error("Error while deleting NP", err.message);
    next(err);
  }
}

module.exports = wrapControllerFunctions({
  nps,
  loadNP,
  updateNP,
  addNP,
  updateStatus,
  deleteNP
}, "np-details.controller");
