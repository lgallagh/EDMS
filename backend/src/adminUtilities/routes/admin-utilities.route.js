const express = require("express");
const router = express.Router();
const adminUserController = require("../controllers/admin-user.controller");
const languageController = require("../controllers/language.controller");

const authController = require("../../shared/controllers/auth.controller");
const createMulterMiddleware = require("../../shared/middleware/upload.middleware");
const { verifyWrite } = require("../../shared/services/auth.service");


router.post("/adminUsers/getAdminUserList", [authController.verifyToken], adminUserController.adminUsers);
router.post("/adminUsers/getAdminUser", [authController.verifyToken], adminUserController.loadAdminUser);
router.post("/adminUsers/update", [authController.verifyToken], verifyWrite, adminUserController.updateAdminUser);
router.post("/adminUsers/status", [authController.verifyToken], verifyWrite, adminUserController.updateStatus);
router.post("/adminUsers/delete", [authController.verifyToken], verifyWrite, adminUserController.deleteAdminUser);
router.post("/adminUsers/add", [authController.verifyToken], verifyWrite, adminUserController.addAdminUser);


router.post("/language/getLanguageList", [authController.verifyToken], languageController.languages);
router.post("/language/getLanguage", [authController.verifyToken], languageController.loadLanguage);
router.post("/language/update", [authController.verifyToken], verifyWrite, languageController.updateLanguage);
router.post("/language/add", [authController.verifyToken], verifyWrite, languageController.addLanguage);
router.post("/language/delete", [authController.verifyToken], verifyWrite, languageController.deleteLanguage);

module.exports = router;
