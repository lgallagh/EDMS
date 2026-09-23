const express = require("express");
const router = express.Router();
const physicianAssistantController = require("../controllers/physician-assistant-details.controller");
const authController = require("../../shared/controllers/auth.controller");
const createMulterMiddleware = require("../../shared/middleware/upload.middleware");
const { verifyWrite } = require("../../shared/services/auth.service");

/** Physician Assistant Details */
router.post("/physicianAssistants", [authController.verifyToken], physicianAssistantController.physicianAssistants);
router.post("/physicianAssistants/load", [authController.verifyToken], physicianAssistantController.loadPhysicianAssistant);
router.post(
  "/physicianAssistants/add", [authController.verifyToken], verifyWrite, 
  createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.DOCTOR_FILE_PATH }).single("file"),
  async (req, res, next) => {
    await physicianAssistantController.addPhysicianAssistant(req, res, next);
  }
);
router.post(
  "/physicianAssistants/update", [authController.verifyToken], verifyWrite, 
  createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.DOCTOR_FILE_PATH }).single("file"),
  async (req, res, next) => {
    await physicianAssistantController.updatePhysicianAssistant(req, res, next);
  }
);
router.post("/physicianAssistants/status", [authController.verifyToken], verifyWrite, physicianAssistantController.updateStatus);
router.post("/physicianAssistants/delete", [authController.verifyToken], verifyWrite, physicianAssistantController.deletePhysicianAssistant);


module.exports = router;
