const cmsService = require("../services/cms-content.service");
const logger = require("winston");
const wrapControllerFunctions = require('../../shared/middleware/controller-wrapper.middleware');

async function contentList(req, res, next) {
  try {
    res.json(await cmsService.contentList(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving CMS Content list", err.message);
    next(err);
  }
}

async function loadCMSContent(req, res, next) {
  try {
    res.json(await cmsService.loadCMSContent(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving CMS data", err.message);
    next(err);
  }
}

async function updateCMSContent(req, res, next) {
  try {
    res.json(await cmsService.updateCMSContent(req, res, next));
  } catch (err) {
    logger.error("Error while updating CMS Content", err.message);
    next(err);
  }
}

async function addCMSContent(req, res, next) {
  try {
    res.json(await cmsService.addCMSContent(req, res, next));
  } catch (err) {
    logger.error("Error while adding CMS Content", err.message);
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    res.json(await cmsService.updateStatus(req, res, next));
  } catch (err) {
    logger.error("Error while updating CMS status", err.message);
    next(err);
  }
}

async function deleteCMSContent(req, res, next) {
  try {
    res.json(await cmsService.deleteCMSContent(req, res, next));
  } catch (err) {
    logger.error("Error while deleting CMS Content", err.message);
    next(err);
  }
}

module.exports = wrapControllerFunctions({
  contentList,
  loadCMSContent,
  updateCMSContent,
  addCMSContent,
  updateStatus,
  deleteCMSContent
}, "cms-content.controller");
