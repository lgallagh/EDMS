const doctorServiceAltTextService = require("../services/doctor-service-alt-text.service");
const logger = require("winston");
const wrapControllerFunctions = require('../../shared/middleware/controller-wrapper.middleware');

async function doctorServiceAltTexts(req, res, next) {
  try {
    res.json(await doctorServiceAltTextService.doctorServiceAltTexts(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Doctor Service Alt Text list", err.message);
    next(err);
  }
}

async function loadDoctorServiceAltText(req, res, next) {
  try {
    res.json(await doctorServiceAltTextService.loadDoctorServiceAltText(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Doctor Servie Alt Text data", err.message);
    next(err);
  }
}

async function updateDoctorServiceAltText(req, res, next) {
  try {
    res.json(await doctorServiceAltTextService.updateDoctorServiceAltText(req, res, next));
  } catch (err) {
    logger.error("Error while updating Doctor Service Alt Text", err.message);
    next(err);
  }
}

module.exports = wrapControllerFunctions({
  doctorServiceAltTexts,
  loadDoctorServiceAltText,
  updateDoctorServiceAltText
}, "doctorservice-alt-text.controller");
