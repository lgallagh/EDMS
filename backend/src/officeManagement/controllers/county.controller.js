const countyService = require("../services/county.service");
const logger = require("winston");

async function counties(req, res, next) {
  try {
    res.json(await countyService.counties(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving County list", err.message);
    next(err);
  }
}

async function loadCounty(req, res, next) {
  try {
    res.json(await countyService.loadCounty(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving County list", err.message);
    next(err);
  }
}



async function updateCounty(req, res, next) {
  try {
    res.json(await countyService.updateCounty(req, res, next));
  } catch (err) {
    logger.error("Error while updating County", err.message);
    next(err);
  }
}


async function deleteCounty(req, res, next) {
  try {
    res.json(await countyService.deleteCounty(req, res, next));
  } catch (err) {
    logger.error("Error while deleting County", err.message);
    next(err);
  }
}




module.exports = {
  counties,
  loadCounty,
  updateCounty,
  deleteCounty
};
