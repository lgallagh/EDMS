const listService = require("../services/list.service");
const logger = require("winston");
const wrapControllerFunctions = require('../../shared/middleware/controller-wrapper.middleware');

async function officeList(req, res, next) {
  try {
    res.json(await listService.officeList(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Office list", err.message);
    next(err);
  }
}

async function languageList(req, res, next) {
    try {
      res.json(await listService.languageList(req, res, next));
    } catch (err) {
      logger.error("Error while retrieving Language list", err.message);
      next(err);
    }
  }

async function doctorList(req, res, next) {
  try {
    res.json(await listService.doctorList(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Doctor list", err.message);
    next(err);
  }
}

async function hospitalList(req, res, next) {
  try {
    res.json(await listService.hospitalList(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving Hospital list", err.message);
    next(err);
  }
}

async function countyList(req, res, next) {
    try {
      res.json(await listService.countyList(req, res, next));
    } catch (err) {
      logger.error("Error while retrieving County list", err.message);
      next(err);
    }
  }

async function providerList(req, res, next) {
    try {
      res.json(await listService.providerList(req, res, next));
    } catch (err) {
      logger.error("Error while retrieving Provier list", err.message);
      next(err);
    }
  }

async function insurancePlanList(req, res, next) {
    try {
      res.json(await listService.insurancePlanList(req, res, next));
    } catch (err) {
      logger.error("Error while retrieving Insurance Plan list", err.message);
      next(err);
    }
  }

  async function stateList(req, res, next) {
    try {
      res.json(await listService.stateList(req, res, next));
    } catch (err) {
      logger.error("Error while retrieving State  list", err.message);
      next(err);
    }
  }

module.exports = wrapControllerFunctions({
    officeList,
    languageList,
    doctorList,
    hospitalList,
    countyList,
    providerList,
    insurancePlanList,
    stateList
  }, "list.controller");
  