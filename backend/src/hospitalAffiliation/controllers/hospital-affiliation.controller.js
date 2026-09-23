const hospitalAffiliationService = require("../services/hospital-affiliation.service");
const hospitalAffiliationFileService = require("../services/hospital-affiliation-files.service");
const logger = require("winston");
const wrapControllerFunctions = require('../../shared/middleware/controller-wrapper.middleware');

async function hospitalAffiliations(req, res, next) {
  try {
    res.json(await hospitalAffiliationService.hospitalAffiliations(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Hospital Affiliations list", err.message);
    next(err);
  }
}

async function loadHospitalAffiliation(req, res, next) {
  try {
    res.json(await hospitalAffiliationService.loadHospitalAffiliation(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Hospital Affiliation data", err.message);
    next(err);
  }
}

async function updateHospitalAffiliation(req, res, next) {
  try {
    res.json(await hospitalAffiliationService.updateHospitalAffiliation(req, res, next));
  } catch (err) {
    logger.error("Error while updating Hospital Affiliation", err.message);
    next(err);
  }
}

async function addHospitalAffiliation(req, res, next) {
  try {
    res.json(await hospitalAffiliationService.addHospitalAffiliation(req, res, next));
  } catch (err) {
    logger.error("Error while adding Hospital Affiliation", err.message);
    next(err);
  }
}

async function deleteHospitalAffiliation(req, res, next) {
  try {
    res.json(await hospitalAffiliationService.deleteHospitalAffiliation(req, res, next));
  } catch (err) {
    logger.error("Error while deleting Hospital Affiliation", err.message);
    next(err);
  }
}

async function exportHospitalAffiliations(req, res, next) {
    try {
     await hospitalAffiliationFileService.exportHospitalAffiliations(req, res, next);
    } catch (err) {
      logger.error("Error while exporting Hospital Affiliation data", err.message);
      next(err);
    }
  }

module.exports = wrapControllerFunctions({
  hospitalAffiliations,
  loadHospitalAffiliation,
  updateHospitalAffiliation,
  addHospitalAffiliation,
  deleteHospitalAffiliation,
  exportHospitalAffiliations
}, "hospital-affiliation.controller");
