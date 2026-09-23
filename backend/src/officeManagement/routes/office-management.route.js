const express = require("express");
const router = express.Router();
const countyController = require("../controllers/county.controller");
const officeController = require("../controllers/office.controller");
const officeWiseAlertController = require("../controllers/office-wise-alert.controller");

const authController = require("../../shared/controllers/auth.controller");
const createMulterMiddleware = require("../../shared/middleware/upload.middleware");
const { verifyWrite } = require("../../shared/services/auth.service");


router.post("/county/getCountyList", [authController.verifyToken], countyController.counties);
router.post("/county/getCounty", [authController.verifyToken], countyController.loadCounty);
router.post("/county/update", [authController.verifyToken], verifyWrite, countyController.updateCounty);
router.post("/county/delete", [authController.verifyToken], verifyWrite, countyController.deleteCounty);
router.post("/county/add", [authController.verifyToken], verifyWrite, countyController.updateCounty);


/**Office Routes */
router.post("/offices", [authController.verifyToken], officeController.offices);
router.post("/offices/loadOffice", [authController.verifyToken], officeController.loadOffice);
router.post(
  "/offices/add", [authController.verifyToken], verifyWrite, 
  createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.DOCTOR_FILE_PATH }).single("file"),
  async (req, res, next) => {
    await officeController.addOffice(req, res, next);
  }
);
router.post(
  "/offices/update", [authController.verifyToken], verifyWrite, 
  createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.DOCTOR_FILE_PATH }).single("file"),
  async (req, res, next) => {
    await officeController.updateOffice(req, res, next);
  }
);
router.post("/offices/status", [authController.verifyToken], verifyWrite, officeController.updateStatus);
router.post("/offices/delete", [authController.verifyToken], verifyWrite,  officeController.deleteOffice);
router.get("/offices/export", [authController.verifyToken], officeController.exportOffices);
router.get("/offices/getVcfZipFile", [authController.verifyToken], officeController.generateVcfZip);
router.post(
    "/offices/import", [authController.verifyToken], verifyWrite, 
    createMulterMiddleware({ allowedTypes: ["xlsx", "xls"], uniqueName: true, destinationPath: process.env.TEMP_FILE_DIR + "/uploads" }).single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).send("No file uploaded.");
        }
  
        await officeController.importOffices(req, res, next);
        res.status(200).send("File processed successfully.");
      } catch (error) {
        console.error("Error processing file:", error);
        res.status(500).send("Error processing the file.");
      }
    }
  );

  router.post("/officeWiseAlert/getOfficeWiseAlertList", [authController.verifyToken], officeWiseAlertController.officeWiseAlerts);
  router.post("/officeWiseAlert/getOfficeWiseAlert", [authController.verifyToken], officeWiseAlertController.loadOfficeWiseAlert);
  router.post("/officeWiseAlert/update", [authController.verifyToken], verifyWrite, officeWiseAlertController.updateOfficeWiseAlert);
  router.post("/officeWiseAlert/delete", [authController.verifyToken], verifyWrite, officeWiseAlertController.deleteOfficeWiseAlert);
  router.post("/officeWiseAlert/status", [authController.verifyToken],verifyWrite,  officeWiseAlertController.updateOfficeWiseStatus);
  router.post("/officeWiseAlert/add", [authController.verifyToken], verifyWrite, officeWiseAlertController.addOfficeWiseAlert);


module.exports = router;
