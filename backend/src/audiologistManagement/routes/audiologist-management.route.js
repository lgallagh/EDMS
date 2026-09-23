const express = require("express");
const router = express.Router();
const audiologistController = require("../controllers/audiologist-details.controller");
const authController = require("../../shared/controllers/auth.controller");
const createMulterMiddleware = require("../../shared/middleware/upload.middleware");
const { verifyWrite } = require("../../shared/services/auth.service");

/** Audiologist Details */
router.post("/audiologists", [authController.verifyToken], audiologistController.audiologists);
router.post("/audiologists/loadAudiologist", [authController.verifyToken], audiologistController.loadAudiologist);
router.post(
  "/audiologists/add", [authController.verifyToken], verifyWrite, 
  createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.AUDIOLOGIST_FILE_PATH }).single("file"),
  async (req, res, next) => {
    await audiologistController.addAudiologist(req, res, next);
  }
);
router.post(
  "/audiologists/update", [authController.verifyToken],verifyWrite, 
  createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.AUDIOLOGIST_FILE_PATH }).single("file"),
  async (req, res, next) => {
    await audiologistController.updateAudiologist(req, res, next);
  }
);
router.post("/audiologists/status", [authController.verifyToken], verifyWrite, audiologistController.updateStatus);
router.post("/audiologists/delete", [authController.verifyToken], verifyWrite, audiologistController.deleteAudiologist);
router.get("/audiologists/export", [authController.verifyToken], verifyWrite, audiologistController.exportAudiologists);
router.post(
    "/audiologists/import", [authController.verifyToken], 
    createMulterMiddleware({ allowedTypes: ["xlsx", "xls"], uniqueName: true, destinationPath: process.env.TEMP_FILE_DIR + "/uploads" }).single("file"),
    async (req, res, next) => {
      try {
        if (!req.file) {
          return res.status(400).send("No file uploaded.");
        }
  
        await audiologistController.importAudiologists(req, res, next);
      } catch (error) {
        console.error("Error processing file:", error);
        return res.status(500).send("Error processing the file.");
      }
    }
  );


module.exports = router;
