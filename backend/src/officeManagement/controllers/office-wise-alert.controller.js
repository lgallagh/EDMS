const officeWiseAlertService = require("../services/office-wise-alert.service");
const logger = require("winston");

async function officeWiseAlerts(req, res, next) {
  try {
    res.json(await officeWiseAlertService.officeWiseAlerts(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving OfficeWiseAlert list", err.message);
    next(err);
  }
}

async function loadOfficeWiseAlert(req, res, next) {
  try {
    res.json(await officeWiseAlertService.loadOfficeWiseAlert(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving OfficeWiseAlert list", err.message);
    next(err);
  }
}



async function updateOfficeWiseAlert(req, res, next) {
  try {
    res.json(await officeWiseAlertService.updateOfficeWiseAlert(req, res, next));
  } catch (err) {
    logger.error("Error while updating OfficeWiseAlert", err.message);
    next(err);
  }
}


async function deleteOfficeWiseAlert(req, res, next) {
  try {
    res.json(await officeWiseAlertService.deleteOfficeWiseAlert(req, res, next));
  } catch (err) {
    logger.error("Error while deleting OfficeWiseAlert", err.message);
    next(err);
  }
}

async function updateOfficeWiseStatus(req, res, next) {
  try {
    res.json(await officeWiseAlertService.updateStatus(req, res, next));
  } catch (err) {
    logger.error("Error while updating Admin User status", err.message);
    next(err);
  }
}

async function addOfficeWiseAlert(req, res, next) {
  try {
    res.json(await officeWiseAlertService.addOfficeWiseAlert(req, res, next));
  } catch (err) {
    logger.error("Error while updating OfficeWiseAlert", err.message);
    next(err);
  }
}



module.exports = {
  officeWiseAlerts,
  loadOfficeWiseAlert,
  updateOfficeWiseAlert,
  deleteOfficeWiseAlert,
  updateOfficeWiseStatus,
  addOfficeWiseAlert
};
