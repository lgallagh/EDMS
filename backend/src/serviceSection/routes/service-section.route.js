const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/services.controller");
const authController = require("../../shared/controllers/auth.controller");
const createMulterMiddleware = require("../../shared/middleware/upload.middleware");
const { verifyWrite } = require("../../shared/services/auth.service");

/** Service Details */
router.post("/services", [authController.verifyToken], serviceController.services);
router.post("/services/loadService", [authController.verifyToken], serviceController.loadService);
router.post(
  "/services/add", [authController.verifyToken], verifyWrite, 
  createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR, fields: [
    { name: "menu_image_file", maxCount: 1, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.SERVICE_MENU_FILE_PATH  },
    { name: "list_image_file", maxCount: 1, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.SERVICE_LIST_FILE_PATH  },
    { name: "banner_image_file", maxCount: 1, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.SERVICE_BANNER_FILE_PATH  }
  ]}),
  async (req, res, next) => {
    await serviceController.addService(req, res, next);
  }
);
router.post(
  "/services/update", [authController.verifyToken], verifyWrite, 
  createMulterMiddleware({ renameFile: true, destinationPath: process.env.UPLOAD_FILE_DIR, fields: [
    { name: "menu_image_file", maxCount: 1, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.SERVICE_MENU_FILE_PATH  },
    { name: "list_image_file", maxCount: 1, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.SERVICE_LIST_FILE_PATH  },
    { name: "banner_image_file", maxCount: 1, destinationPath: process.env.UPLOAD_FILE_DIR + process.env.SERVICE_BANNER_FILE_PATH  }
  ]}),
  async (req, res, next) => {
    await serviceController.updateService(req, res, next);
  }
);
router.post("/services/status", [authController.verifyToken], verifyWrite, serviceController.updateStatus);
router.post("/services/updateSortOrder", [authController.verifyToken], verifyWrite, serviceController.updateSortOrder);
router.post("/services/delete", [authController.verifyToken], verifyWrite, serviceController.deleteService);


module.exports = router;
