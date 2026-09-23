const officeService = require("../services/office.service");
const officeFileService = require("../services/office-files.service");
const logger = require("winston");
const wrapControllerFunctions = require('../../shared/middleware/controller-wrapper.middleware');

async function offices(req, res, next) {
  try {
    res.json(await officeService.offices(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Offices list", err.message);
    next(err);
  }
}

async function loadOffice(req, res, next) {
  try {
    const officeId = req.body.officeId;
    res.json(await officeService.loadOffice(officeId));
  } catch (err) {
    logger.error("Error while retrieving Offices data", err.message);
    next(err);
  }
}

async function updateOffice(req, res, next) {
  try {
    res.json(await officeService.updateOffice(req, res, next));
  } catch (err) {
    logger.error("Error while updating Office", err.message);
    next(err);
  }
}

async function addOffice(req, res, next) {
  try {
    res.json(await officeService.addOffice(req, res, next));
  } catch (err) {
    logger.error("Error while adding Office", err.message);
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    res.json(await officeService.updateStatus(req, res, next));
  } catch (err) {
    logger.error("Error while updating Office status", err.message);
    next(err);
  }
}

async function deleteOffice(req, res, next) {
  try {
    res.json(await officeService.deleteOffice(req, res, next));
  } catch (err) {
    logger.error("Error while deleting Office", err.message);
    next(err);
  }
}

async function exportOffices(req, res, next) {
  try {
   await officeFileService.exportOffices(req, res, next);
  } catch (err) {
    logger.error("Error while exporting Office data", err.message);
    next(err);
  }
}

async function importOffices(req, res, next) {
  try {
   await officeFileService.importOffices(req, res, next);
  } catch (err) {
    logger.error("Error while importing Office data", err.message);
    throw(err);
  }
}

async function generateVcfZip(req, res, next) {
  try {
   await officeFileService.generateVcfZip(req, res, next);
  } catch (err) {
    logger.error("Error while generating VCF zip file", err.message);
    next(err);
  }
}

module.exports = wrapControllerFunctions({
  offices,
  loadOffice,
  updateOffice,
  addOffice,
  updateStatus,
  deleteOffice,
  exportOffices,
  importOffices,
  generateVcfZip
}, "office-management.controller");
