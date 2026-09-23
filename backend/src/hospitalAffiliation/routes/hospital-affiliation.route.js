const express = require("express");
const router = express.Router();
const hospitalController = require("../controllers/hospital-list.controller");
const hospitalAffiliationController = require("../controllers/hospital-affiliation.controller");
const authController = require("../../shared/controllers/auth.controller");
const { verifyWrite } = require("../../shared/services/auth.service");

/** Hospital List */
router.post("/hospitals", [authController.verifyToken],  hospitalController.hospitals);
router.post("/hospitals/load", [authController.verifyToken], hospitalController.loadHospital);
router.post("/hospitals/add", [authController.verifyToken], verifyWrite, hospitalController.addHospital);
router.post("/hospitals/update", [authController.verifyToken], verifyWrite, hospitalController.updateHospital);
router.post("/hospitals/status", [authController.verifyToken], verifyWrite, hospitalController.updateStatus);
router.post("/hospitals/delete", [authController.verifyToken], verifyWrite, hospitalController.deleteHospital);

/** Hospital Affiliation */
router.post("/hospitalAffiliations", [authController.verifyToken], hospitalAffiliationController.hospitalAffiliations);
router.post("/hospitalAffiliations/load", [authController.verifyToken], hospitalAffiliationController.loadHospitalAffiliation);
router.post("/hospitalAffiliations/add", [authController.verifyToken], verifyWrite, hospitalAffiliationController.addHospitalAffiliation);
router.post("/hospitalAffiliations/update", [authController.verifyToken], verifyWrite, hospitalAffiliationController.updateHospitalAffiliation);
router.post("/hospitalAffiliations/delete", [authController.verifyToken], verifyWrite, hospitalAffiliationController.deleteHospitalAffiliation);
router.get("/hospitalAffiliations/export", [authController.verifyToken], hospitalAffiliationController.exportHospitalAffiliations);

module.exports = router;
