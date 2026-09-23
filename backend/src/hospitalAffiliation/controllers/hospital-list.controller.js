const hospitalService = require("../services/hospital-list.service");
const logger = require("winston");
const wrapControllerFunctions = require('../../shared/middleware/controller-wrapper.middleware');

async function hospitals(req, res, next) {
  try {
    res.json(await hospitalService.hospitals(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Hospitals list", err.message);
    next(err);
  }
}

async function loadHospital(req, res, next) {
  try {
    res.json(await hospitalService.loadHospital(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Hospitals data", err.message);
    next(err);
  }
}

async function updateHospital(req, res, next) {
  try {
    res.json(await hospitalService.updateHospital(req, res, next));
  } catch (err) {
    logger.error("Error while updating Hospital", err.message);
    next(err);
  }
}

async function addHospital(req, res, next) {
  try {
    res.json(await hospitalService.addHospital(req, res, next));
  } catch (err) {
    logger.error("Error while adding Hospital", err.message);
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    res.json(await hospitalService.updateStatus(req, res, next));
  } catch (err) {
    logger.error("Error while updating Hospital status", err.message);
    next(err);
  }
}

async function deleteHospital(req, res, next) {
  try {
    res.json(await hospitalService.deleteHospital(req, res, next));
  } catch (err) {
    logger.error("Error while deleting Hospital", err.message);
    next(err);
  }
}

module.exports = wrapControllerFunctions({
  hospitals,
  loadHospital,
  updateHospital,
  addHospital,
  updateStatus,
  deleteHospital
}, "hospital-list.controller");
