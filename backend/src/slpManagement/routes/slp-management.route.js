const express = require("express");
const router = express.Router();
const slpController = require("../controllers/slp-details.controller");
const authController = require("../../shared/controllers/auth.controller");
const createMulterMiddleware = require("../../shared/middleware/upload.middleware");
const { verifyWrite } = require("../../shared/services/auth.service");

/** SLP Details */
router.post("/slps", [authController.verifyToken], slpController.slps);
router.post("/slps/loadSLP", [authController.verifyToken], slpController.loadSLP);
router.post(
  "/slps/add", [authController.verifyToken], verifyWrite, 
  createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.AUDIOLOGIST_FILE_PATH }).single("file"),
  async (req, res, next) => {
    await slpController.addSLP(req, res, next);
  }
);
router.post(
  "/slps/update", [authController.verifyToken], verifyWrite, 
  createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.AUDIOLOGIST_FILE_PATH }).single("file"),
  async (req, res, next) => {
    await slpController.updateSLP(req, res, next);
  }
);
router.post("/slps/status", [authController.verifyToken], verifyWrite, slpController.updateStatus);
router.post("/slps/delete", [authController.verifyToken], verifyWrite, slpController.deleteSLP);


module.exports = router;
