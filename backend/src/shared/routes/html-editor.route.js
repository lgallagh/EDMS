const express = require("express");
const router = express.Router();
const htmlEditorController = require("../controllers/html-editor.controller");
const authController = require("../../shared/controllers/auth.controller");
const createMulterMiddleware = require("../../shared/middleware/upload.middleware");
const { verifyWrite } = require("../services/auth.service");

/**
 * Because we don't have access to the request body at the time our file handling middleware is being set up, we use different routes for sending files
 * to different locations.
 */

router.post(
  "/uploadDoctor",
  [authController.verifyToken], verifyWrite, 
  createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.DOCTOR_FILE_PATH }).single("file"),
  async (req, res, next) => {
    req.body.uploadDirectory = process.env.DOCTOR_FILE_PATH;
    await htmlEditorController.uploadFile(req, res, next);
  }
);

router.post(
    "/uploadAudiologist",
    [authController.verifyToken], verifyWrite, 
    createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.AUDIOLOGIST_FILE_PATH }).single("file"),
    async (req, res, next) => {
        req.body.uploadDirectory = process.env.AUDIOLOGIST_FILE_PATH;
        await htmlEditorController.uploadFile(req, res, next);
    }
  );

  router.post(
    "/uploadPhysician",
    [authController.verifyToken], verifyWrite, 
    createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.PHYSICIAN_FILE_PATH }).single("file"),
    async (req, res, next) => {
        req.body.uploadDirectory = process.env.PHYSICIAN_FILE_PATH;
        await htmlEditorController.uploadFile(req, res, next);
    }
  );

  router.post(
    "/uploadSlp",
    [authController.verifyToken], verifyWrite, 
    createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.SLP_FILE_PATH }).single("file"),
    async (req, res, next) => {
        req.body.uploadDirectory = process.env.SLP_FILE_PATH;
        await htmlEditorController.uploadFile(req, res, next);
    }
  );

  router.post(
    "/uploadProvider",
    [authController.verifyToken], verifyWrite, 
    createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.PROVIDER_FILE_PATH }).single("file"),
    async (req, res, next) => {
        req.body.uploadDirectory = process.env.PROVIDER_FILE_PATH;
        await htmlEditorController.uploadFile(req, res, next);
    }
  );

  router.post(
    "/uploadService",
    [authController.verifyToken], verifyWrite, 
    createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.SERVICE_FILE_PATH }).single("file"),
    async (req, res, next) => {
        req.body.uploadDirectory = process.env.SERVICE_FILE_PATH;
        await htmlEditorController.uploadFile(req, res, next);
    }
  );

  router.post(
    "/uploadCMS",
    [authController.verifyToken], verifyWrite, 
    createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.CMS_PAGES_FILE_PATH }).single("file"),
    async (req, res, next) => {
        req.body.uploadDirectory = process.env.CMS_PAGES_FILE_PATH;
        await htmlEditorController.uploadFile(req, res, next);
    }
  );

  router.post(
    "/uploadOffice",
    [authController.verifyToken], verifyWrite, 
    createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.OFFICE_FILE_PATH }).single("file"),
    async (req, res, next) => {
        req.body.uploadDirectory = process.env.OFFICE_FILE_PATH;
        await htmlEditorController.uploadFile(req, res, next);
    }
  );

module.exports = router;
