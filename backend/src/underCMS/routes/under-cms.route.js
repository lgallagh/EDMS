const express = require("express");
const router = express.Router();
const cmsController = require("../controllers/cms-content.controller");
const authController = require("../../shared/controllers/auth.controller");
const createMulterMiddleware = require("../../shared/middleware/upload.middleware");
const { verifyWrite } = require("../../shared/services/auth.service");

/** CMS Pages */
router.post("/cms", [authController.verifyToken], cmsController.contentList);
router.post("/cms/load", [authController.verifyToken], cmsController.loadCMSContent);
router.post(
  "/cms/add", [authController.verifyToken], verifyWrite, 
  createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.BANNER_FILE_PATH }).single("file"),
  async (req, res, next) => {
    await cmsController.addCMSContent(req, res, next);
  }
);
router.post(
  "/cms/update", [authController.verifyToken], verifyWrite, 
  createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.BANNER_FILE_PATH }).single("file"),
  async (req, res, next) => {
    await cmsController.updateCMSContent(req, res, next);
  }
);
router.post("/cms/status", [authController.verifyToken], verifyWrite, cmsController.updateStatus);
router.post("/cms/delete", [authController.verifyToken], verifyWrite, cmsController.deleteCMSContent);


module.exports = router;
