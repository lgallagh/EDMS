const doctorService = require("../services/doctor-management.service");
const doctorFileService = require("../services/doctor-management-files.service");
const logger = require("winston");
const wrapControllerFunctions = require('../../shared/middleware/controller-wrapper.middleware');

async function doctors(req, res, next) {
  try {
    res.json(await doctorService.doctors(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Doctors list", err.message);
    next(err);
  }
}

async function loadDoctor(req, res, next) {
  try {
    res.json(await doctorService.loadDoctor(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Doctors data", err.message);
    next(err);
  }
}

async function updateDoctor(req, res, next) {
  try {
    let doctorData = JSON.parse(req.body.doctorData);
    let originalDoctorData = JSON.parse(req.body.originalDoctorData);
    let userContext = req.userContext;

    const payload = { doctorData: doctorData, originalDoctorData: originalDoctorData, userContext: userContext };

    let file = req.file;
    res.json(await doctorService.updateDoctor(payload, file));
  } catch (err) {
    logger.error("Error while updating Doctor", err.message);
    next(err);
  }
}

async function addDoctor(req, res, next) {
  try {
    let doctorData = JSON.parse(req.body.doctorData);
    let userContext = req.userContext;

    const payload = { doctorData: doctorData, originalDoctorData: null, userContext: userContext };

    let file = req.file;
    res.json(await doctorService.addDoctor(payload, file));
  } catch (err) {
    logger.error("Error while adding Doctor", err.message);
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    res.json(await doctorService.updateStatus(req, res, next));
  } catch (err) {
    logger.error("Error while updating Doctor status", err.message);
    next(err);
  }
}

async function deleteDoctor(req, res, next) {
  try {
    res.json(await doctorService.deleteDoctor(req, res, next));
  } catch (err) {
    logger.error("Error while deleting Doctor", err.message);
    next(err);
  }
}

async function exportDoctors(req, res, next) {
  try {
   await doctorFileService.exportDoctors(req, res, next);
  } catch (err) {
    logger.error("Error while exporting Doctor data", err.message);
    next(err);
  }
}

async function importDoctors(req, res, next) {
  try {
   await doctorFileService.importDoctors(req, res, next);
   return res.status(200).send("File processed successfully.");
  } catch (err) {
    logger.error("Error while importing Doctor data", err.message);
    throw err;
  }
}

async function generateVcfZip(req, res, next) {
  try {
   await doctorFileService.generateVcfZip(req, res, next);
  } catch (err) {
    logger.error("Error while generating VCF zip file", err.message);
    next(err);
  }
}

module.exports = wrapControllerFunctions({
  doctors,
  loadDoctor,
  updateDoctor,
  addDoctor,
  updateStatus,
  deleteDoctor,
  exportDoctors,
  importDoctors,
  generateVcfZip
}, "doctor-management.controller");
