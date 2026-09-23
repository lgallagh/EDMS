const internService = require("../services/intern-details.service");
const logger = require("winston");
const wrapControllerFunctions = require('../../shared/middleware/controller-wrapper.middleware');

async function interns(req, res, next) {
  try {
    res.json(await internService.interns(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Interns list", err.message);
    next(err);
  }
}

async function loadIntern(req, res, next) {
  try {
    res.json(await internService.loadIntern(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Interns data", err.message);
    next(err);
  }
}

async function updateIntern(req, res, next) {
  try {
    res.json(await internService.updateIntern(req, res, next));
  } catch (err) {
    logger.error("Error while updating Intern", err.message);
    next(err);
  }
}

async function addIntern(req, res, next) {
  try {
    res.json(await internService.addIntern(req, res, next));
  } catch (err) {
    logger.error("Error while adding Intern", err.message);
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    res.json(await internService.updateStatus(req, res, next));
  } catch (err) {
    logger.error("Error while updating Intern status", err.message);
    next(err);
  }
}

async function deleteIntern(req, res, next) {
  try {
    res.json(await internService.deleteIntern(req, res, next));
  } catch (err) {
    logger.error("Error while deleting Intern", err.message);
    next(err);
  }
}

module.exports = wrapControllerFunctions({
  interns,
  loadIntern,
  updateIntern,
  addIntern,
  updateStatus,
  deleteIntern
}, "intern-details.controller");
