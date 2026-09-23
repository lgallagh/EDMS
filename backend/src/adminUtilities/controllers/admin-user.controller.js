const adminUtilService = require("../services/admin-user.service");
const logger = require("winston");

async function adminUsers(req, res, next) {
  try {
    res.json(await adminUtilService.adminUsers(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving AdminUsers list", err.message);
    next(err);
  }
}

async function loadAdminUser(req, res, next) {
  try {
    res.json(await adminUtilService.loadAdminUser(req, res, next));
  } catch (err) {
    logger.error("Error while retrieving AdminUsers list", err.message);
    next(err);
  }
}



async function updateAdminUser(req, res, next) {
  try {
    res.json(await adminUtilService.updateAdminUser(req, res, next));
  } catch (err) {
    logger.error("Error while updating Admin User", err.message);
    next(err);
  }
}

async function addAdminUser(req, res, next) {
  try {
    res.json(await adminUtilService.addAdminUser(req, res, next));
  } catch (err) {
    logger.error("Error while updating Admin User", err.message);
    next(err);
  }
}


async function updateStatus(req, res, next) {
  try {
    res.json(await adminUtilService.updateStatus(req, res, next));
  } catch (err) {
    logger.error("Error while updating Admin User status", err.message);
    next(err);
  }
}

async function deleteAdminUser(req, res, next) {
  try {
    res.json(await adminUtilService.deleteAdminUser(req, res, next));
  } catch (err) {
    logger.error("Error while deleting Admin User", err.message);
    next(err);
  }
}




module.exports = {
  adminUsers,
  loadAdminUser,
  updateAdminUser,
  addAdminUser,
  updateStatus,
  deleteAdminUser
};
