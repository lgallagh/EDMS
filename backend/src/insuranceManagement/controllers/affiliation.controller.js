const affiliationService = require("../services/affiliation.service");
const affiliationFileService = require("../services/affiliation-files.service");
const logger = require("winston");
const wrapControllerFunctions = require('../../shared/middleware/controller-wrapper.middleware');

async function affiliations(req, res, next) {
  try {
    res.json(await affiliationService.affiliations(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Affiliations list", err.message);
    next(err);
  }
}

async function loadAffiliation(req, res, next) {
  try {
    res.json(await affiliationService.loadAffiliation(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Affiliations data", err.message);
    next(err);
  }
}

async function updateAffiliation(req, res, next) {
  try {
    res.json(await affiliationService.updateAffiliation(req, res, next));
  } catch (err) {
    logger.error("Error while updating Affiliation", err.message);
    next(err);
  }
}



async function deleteAffiliation(req, res, next) {
  try {
    res.json(await affiliationService.deleteAffiliation(req, res, next));
  } catch (err) {
    logger.error("Error while deleting Affiliation", err.message);
    next(err);
  }
}

async function exportAffiliations(req, res, next) {
  try {
   await affiliationFileService.exportAffiliations(req, res, next);
  } catch (err) {
    logger.error("Error while exporting Affiliation data", err.message);
    next(err);
  }
}


module.exports = wrapControllerFunctions({
  affiliations,
  loadAffiliation,
  updateAffiliation,
  deleteAffiliation,
  exportAffiliations
}, "affiliation-management.controller");
