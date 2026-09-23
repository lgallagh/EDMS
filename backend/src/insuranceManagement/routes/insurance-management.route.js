const express = require("express");
const router = express.Router();
const insuranceController = require("../controllers/insurance.controller");
const affiliationController = require("../controllers/affiliation.controller");


const authController = require("../../shared/controllers/auth.controller");
const createMulterMiddleware = require("../../shared/middleware/upload.middleware");
const { verifyWrite } = require("../../shared/services/auth.service");


/**Insurance Routes */
router.post("/insurances", [authController.verifyToken], insuranceController.insurances);
router.post("/insurances/loadInsurance", [authController.verifyToken], insuranceController.loadInsurance);
router.post("/insurances/add",  [authController.verifyToken], verifyWrite, insuranceController.addInsurance);
router.post("/insurances/update", [authController.verifyToken], verifyWrite, insuranceController.updateInsurance);
router.post("/insurances/status", [authController.verifyToken], verifyWrite, insuranceController.updateStatus);
router.post("/insurances/delete", [authController.verifyToken], verifyWrite, insuranceController.deleteInsurance);
router.get("/insurances/export", [authController.verifyToken], insuranceController.exportInsurances);
router.post(
    "/insurances/import", [authController.verifyToken],verifyWrite, 
    createMulterMiddleware({ allowedTypes: ["xlsx", "xls"], uniqueName: true, destinationPath: process.env.TEMP_FILE_DIR + "/uploads" }).single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).send("No file uploaded.");
        }
  
        await insuranceController.importInsurances(req, res, next);
        res.status(200).send("File processed successfully.");
      } catch (error) {
        console.error("Error processing file:", error);
        res.status(500).send("Error processing the file.");
      }
    }
  );


  /**Affiliation Routes */
router.post("/affiliations", [authController.verifyToken], affiliationController.affiliations);
router.post("/affiliations/loadAffiliation", [authController.verifyToken], affiliationController.loadAffiliation);
router.post("/affiliations/update", [authController.verifyToken], verifyWrite, affiliationController.updateAffiliation);
router.post("/affiliations/delete", [authController.verifyToken], verifyWrite, affiliationController.deleteAffiliation);
router.get("/affiliations/export", [authController.verifyToken], affiliationController.exportAffiliations);

module.exports = router;
