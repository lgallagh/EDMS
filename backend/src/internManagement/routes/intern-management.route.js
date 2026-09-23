const express = require("express");
const router = express.Router();
const internController = require("../controllers/intern-details.controller");
const authController = require("../../shared/controllers/auth.controller");
const createMulterMiddleware = require("../../shared/middleware/upload.middleware");
const { verifyWrite } = require("../../shared/services/auth.service");

/** Intern Details */
router.post("/interns", [authController.verifyToken], internController.interns);
router.post("/interns/loadIntern", [authController.verifyToken], internController.loadIntern);
router.post(
  "/interns/add", [authController.verifyToken],verifyWrite, 
  createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.AUDIOLOGIST_FILE_PATH }).single("file"),
  async (req, res, next) => {
    await internController.addIntern(req, res, next);
  }
);
router.post(
  "/interns/update", [authController.verifyToken],verifyWrite, 
  createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.AUDIOLOGIST_FILE_PATH }).single("file"),
  async (req, res, next) => {
    await internController.updateIntern(req, res, next);
  }
);
router.post("/interns/status", [authController.verifyToken], verifyWrite, internController.updateStatus);
router.post("/interns/delete", [authController.verifyToken], verifyWrite, internController.deleteIntern);


module.exports = router;
