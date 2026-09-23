const physicianAssistantService = require("../services/physician-assistant-details.service");
const logger = require("winston");
const wrapControllerFunctions = require('../../shared/middleware/controller-wrapper.middleware');

async function physicianAssistants(req, res, next) {
  try {
    res.json(await physicianAssistantService.physicianAssistants(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Physician Assistants list", err.message);
    next(err);
  }
}

async function loadPhysicianAssistant(req, res, next) {
  try {
    res.json(await physicianAssistantService.loadPhysicianAssistant(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Physician Assistant data", err.message);
    next(err);
  }
}

async function updatePhysicianAssistant(req, res, next) {
  try {
    res.json(await physicianAssistantService.updatePhysicianAssistant(req, res, next));
  } catch (err) {
    logger.error("Error while updating Physician Assistant", err.message);
    next(err);
  }
}

async function addPhysicianAssistant(req, res, next) {
  try {
    res.json(await physicianAssistantService.addPhysicianAssistant(req, res, next));
  } catch (err) {
    logger.error("Error while adding Physician Assistant", err.message);
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    res.json(await physicianAssistantService.updateStatus(req, res, next));
  } catch (err) {
    logger.error("Error while updating Physician Assistant status", err.message);
    next(err);
  }
}

async function deletePhysicianAssistant(req, res, next) {
  try {
    res.json(await physicianAssistantService.deletePhysicianAssistant(req, res, next));
  } catch (err) {
    logger.error("Error while deleting Physician Assistant", err.message);
    next(err);
  }
}

module.exports = wrapControllerFunctions({
  physicianAssistants,
  loadPhysicianAssistant,
  updatePhysicianAssistant,
  addPhysicianAssistant,
  updateStatus,
  deletePhysicianAssistant
}, "physician-assistant-details.controller");
