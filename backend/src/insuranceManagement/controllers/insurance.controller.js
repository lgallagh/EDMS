const insuranceService = require("../services/insurance.service");
const insuranceFileService = require("../services/insurance-files.service");
const logger = require("winston");
const wrapControllerFunctions = require('../../shared/middleware/controller-wrapper.middleware');

async function insurances(req, res, next) {
  try {
    res.json(await insuranceService.insurances(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Insurances list", err.message);
    next(err);
  }
}

async function loadInsurance(req, res, next) {
  try {
    res.json(await insuranceService.loadInsurance(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Insurances data", err.message);
    next(err);
  }
}

async function updateInsurance(req, res, next) {
  try {
    res.json(await insuranceService.updateInsurance(req, res, next));
  } catch (err) {
    logger.error("Error while updating Insurance", err.message);
    next(err);
  }
}

async function addInsurance(req, res, next) {
  try {
    res.json(await insuranceService.addInsurance(req, res, next));
  } catch (err) {
    logger.error("Error while adding Insurance", err.message);
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    res.json(await insuranceService.updateStatus(req, res, next));
  } catch (err) {
    logger.error("Error while updating Insurance status", err.message);
    next(err);
  }
}

async function deleteInsurance(req, res, next) {
  try {
    res.json(await insuranceService.deleteInsurance(req, res, next));
  } catch (err) {
    logger.error("Error while deleting Insurance", err.message);
    next(err);
  }
}

async function exportInsurances(req, res, next) {
  try {
   await insuranceFileService.exportInsurances(req, res, next);
  } catch (err) {
    logger.error("Error while exporting Insurance data", err.message);
    next(err);
  }
}

async function importInsurances(req, res, next) {
  try {
   await insuranceFileService.importInsurances(req, res, next);
  } catch (err) {
    logger.error("Error while importing Insurance data", err.message);
    throw(err);
  }
}



module.exports = wrapControllerFunctions({
  insurances,
  loadInsurance,
  updateInsurance,
  addInsurance,
  updateStatus,
  deleteInsurance,
  exportInsurances,
  importInsurances
}, "insurance-management.controller");
