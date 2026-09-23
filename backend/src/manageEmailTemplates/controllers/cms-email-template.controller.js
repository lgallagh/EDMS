const emailTemplateService = require("../services/cms-email-template.service");
const logger = require("winston");
const wrapControllerFunctions = require('../../shared/middleware/controller-wrapper.middleware');

async function emailTemplates(req, res, next) {
  try {
    res.json(await emailTemplateService.emailTemplates(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Email Templates list", err.message);
    next(err);
  }
}

async function loadEmailTemplate(req, res, next) {
  try {
    res.json(await emailTemplateService.loadEmailTemplate(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Email Templates data", err.message);
    next(err);
  }
}

async function updateEmailTemplate(req, res, next) {
  try {
    res.json(await emailTemplateService.updateEmailTemplate(req, res, next));
  } catch (err) {
    logger.error("Error while updating Email Template", err.message);
    next(err);
  }
}

async function addEmailTemplate(req, res, next) {
  try {
    res.json(await emailTemplateService.addEmailTemplate(req, res, next));
  } catch (err) {
    logger.error("Error while adding Email Template", err.message);
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    res.json(await emailTemplateService.updateStatus(req, res, next));
  } catch (err) {
    logger.error("Error while updating Email Template status", err.message);
    next(err);
  }
}

async function deleteEmailTemplate(req, res, next) {
  try {
    res.json(await emailTemplateService.deleteEmailTemplate(req, res, next));
  } catch (err) {
    logger.error("Error while deleting Email Template", err.message);
    next(err);
  }
}

module.exports = wrapControllerFunctions({
  emailTemplates,
  loadEmailTemplate,
  updateEmailTemplate,
  addEmailTemplate,
  updateStatus,
  deleteEmailTemplate
}, "cms-email-template.controller");
