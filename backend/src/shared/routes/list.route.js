const express = require("express");
const router = express.Router();
const listController = require("../controllers/list.controller");
const authController = require("../controllers/auth.controller");


router.get("/officeList", [authController.verifyToken], listController.officeList);
router.get("/languageList", [authController.verifyToken], listController.languageList);
router.get("/countyList", [authController.verifyToken], listController.countyList);
router.get("/providerList", [authController.verifyToken], listController.providerList);
router.get("/insurancePlanList", [authController.verifyToken], listController.insurancePlanList);
router.get("/doctorList", [authController.verifyToken], listController.doctorList);
router.get("/hospitalList", [authController.verifyToken], listController.hospitalList);
router.get("/stateList", [authController.verifyToken], listController.stateList);


module.exports = router;
