const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctor-management.controller");
const doctorServiceAltTextController = require("../controllers/doctor-service-alt-text.controller");
const authController = require("../../shared/controllers/auth.controller");
const createMulterMiddleware = require("../../shared/middleware/upload.middleware");
const { verifyWrite } = require("../../shared/services/auth.service");

/** Doctor Details */
router.post("/doctors", [authController.verifyToken], doctorController.doctors);
router.post("/doctors/loadDoctor", [authController.verifyToken], doctorController.loadDoctor);
router.post(
  "/doctors/add", [authController.verifyToken], verifyWrite, 
  createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.DOCTOR_FILE_PATH }).single("file"),
  async (req, res, next) => {
    await doctorController.addDoctor(req, res, next);
  }
);
router.post(
  "/doctors/update", [authController.verifyToken], verifyWrite, 
  createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.DOCTOR_FILE_PATH }).single("file"),
  async (req, res, next) => {
    await doctorController.updateDoctor(req, res, next);
  }
);
router.post("/doctors/status", [authController.verifyToken],verifyWrite,  doctorController.updateStatus);
router.post("/doctors/delete", [authController.verifyToken],verifyWrite,  doctorController.deleteDoctor);
router.get("/doctors/export", [authController.verifyToken], doctorController.exportDoctors);
router.get("/doctors/getVcfZipFile", [authController.verifyToken], doctorController.generateVcfZip);
router.post(
    "/doctors/import", [authController.verifyToken],verifyWrite, 
    createMulterMiddleware({ allowedTypes: ["xlsx", "xls"], uniqueName: true, destinationPath: process.env.TEMP_FILE_DIR + "/uploads" }).single("file"),
    async (req, res, next) => {
      try {
        if (!req.file) {
          return res.status(400).send("No file uploaded.");
        }
  
        await doctorController.importDoctors(req, res, next);
      } catch (error) {
        console.error("Error processing file:", error);
        return res.status(500).send("Error processing the file.");
      }
    }
  );

/** Doctor Service Alt Text */
router.post("/doctor-service-alt-text", [authController.verifyToken], doctorServiceAltTextController.doctorServiceAltTexts);
router.post("/doctor-service-alt-text/load", [authController.verifyToken], doctorServiceAltTextController.loadDoctorServiceAltText);
router.post(
  "/doctor-service-alt-text/update", [authController.verifyToken],verifyWrite, 
  createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.DOCTOR_FILE_PATH }).single("file"),
  async (req, res, next) => {
    await doctorServiceAltTextController.updateDoctorServiceAltText(req, res, next);
  }
);

module.exports = router;
