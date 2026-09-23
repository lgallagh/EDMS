const audiologistService = require("../services/audiologist-details.service");
const audiologistFileService = require("../services/audiologist-details-files.service");
const logger = require("winston");
const wrapControllerFunctions = require('../../shared/middleware/controller-wrapper.middleware');

async function audiologists(req, res, next) {
  try {
    res.json(await audiologistService.audiologists(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Audiologists list", err.message);
    next(err);
  }
}

async function loadAudiologist(req, res, next) {
  try {
    res.json(await audiologistService.loadAudiologist(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Audiologists data", err.message);
    next(err);
  }
}

async function updateAudiologist(req, res, next) {
  try {
    let audiologistData = JSON.parse(req.body.audiologistData);
    let originalAudiologistData = JSON.parse(req.body.originalAudiologistData);
    let userContext = req.userContext;

    const payload = { audiologistData: audiologistData, originalAudiologistData: originalAudiologistData, userContext: userContext };
    let file = req.file;
    res.json(await audiologistService.updateAudiologist(payload, file));
  } catch (err) {
    logger.error("Error while updating Audiologist", err.message);
    next(err);
  }
}

async function addAudiologist(req, res, next) {
  try {
    let audiologistData = JSON.parse(req.body.audiologistData);
    let userContext = req.userContext;

    const payload = { audiologistData: audiologistData, originalAudiologistData: null, userContext: userContext };
    let file = req.file;
    res.json(await audiologistService.addAudiologist(payload, file));
  } catch (err) {
    logger.error("Error while adding Audiologist", err.message);
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    res.json(await audiologistService.updateStatus(req, res, next));
  } catch (err) {
    logger.error("Error while updating Audiologist status", err.message);
    next(err);
  }
}

async function deleteAudiologist(req, res, next) {
  try {
    res.json(await audiologistService.deleteAudiologist(req, res, next));
  } catch (err) {
    logger.error("Error while deleting Audiologist", err.message);
    next(err);
  }
}

async function exportAudiologists(req, res, next) {
  try {
   await audiologistFileService.exportAudiologists(req, res, next);
  } catch (err) {
    logger.error("Error while exporting Audiologist data", err.message);
    next(err);
  }
}

async function importAudiologists(req, res, next) {
  try {
    await audiologistFileService.importAudiologists(req, res, next);
    return res.status(200).send("File processed successfully.");
  } catch (err) {
    logger.error("Error while importing Audiologist data", err.message);
    return next(err);
  }
}

module.exports = wrapControllerFunctions({
  audiologists,
  loadAudiologist,
  updateAudiologist,
  addAudiologist,
  updateStatus,
  deleteAudiologist,
  exportAudiologists,
  importAudiologists
}, "audiologist-details.controller");
