const express = require("express");
const router = express.Router();
const npController = require("../controllers/np-details.controller");
const authController = require("../../shared/controllers/auth.controller");
const createMulterMiddleware = require("../../shared/middleware/upload.middleware");
const { verifyWrite } = require("../../shared/services/auth.service");

/** Physician Assistant Details */
router.post("/nps", [authController.verifyToken], npController.nps);
router.post("/nps/load", [authController.verifyToken], npController.loadNP);
router.post(
  "/nps/add", [authController.verifyToken], verifyWrite, 
  createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.DOCTOR_FILE_PATH }).single("file"),
  async (req, res, next) => {
    await npController.addNP(req, res, next);
  }
);
router.post(
  "/nps/update", [authController.verifyToken], verifyWrite, 
  createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.DOCTOR_FILE_PATH }).single("file"),
  async (req, res, next) => {
    await npController.updateNP(req, res, next);
  }
);
router.post("/nps/status", [authController.verifyToken], verifyWrite, npController.updateStatus);
router.post("/nps/delete", [authController.verifyToken], verifyWrite, npController.deleteNP);


module.exports = router;
