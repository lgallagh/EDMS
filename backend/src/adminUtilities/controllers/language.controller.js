const languageService = require("../services/language.service");
const logger = require("winston");

async function languages(req, res, next) {
  try {
    res.json(await languageService.languages(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Languages list", err.message);
    next(err);
  }
}

async function loadLanguage(req, res, next) {
  try {
    res.json(await languageService.loadLanguage(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Languages list", err.message);
    next(err);
  }
}



async function updateLanguage(req, res, next) {
  try {
    res.json(await languageService.updateLanguage(req, res, next));
  } catch (err) {
    logger.error("Error while updating Language", err.message);
    next(err);
  }
}

async function addLanguage(req, res, next) {
  try {
    res.json(await languageService.addLanguage(req, res, next));
  } catch (err) {
    logger.error("Error while adding Language", err.message);
    next(err);
  }
}


async function deleteLanguage(req, res, next) {
  try {
    res.json(await languageService.deleteLanguage(req, res, next));
  } catch (err) {
    logger.error("Error while deleting Language", err.message);
    next(err);
  }
}




module.exports = {
  languages,
  loadLanguage,
  updateLanguage,
  addLanguage,
  deleteLanguage
};
