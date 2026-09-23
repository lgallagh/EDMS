const express = require("express");
const router = express.Router();
const emailTemplateController = require("../controllers/cms-email-template.controller");
const authController = require("../../shared/controllers/auth.controller");
const createMulterMiddleware = require("../../shared/middleware/upload.middleware");
const { verifyWrite } = require("../../shared/services/auth.service");

/** CMS Email Templates */
router.post("/emailTemplates", [authController.verifyToken], emailTemplateController.emailTemplates);
router.post("/emailTemplates/load", [authController.verifyToken], emailTemplateController.loadEmailTemplate);
router.post("/emailTemplates/add", [authController.verifyToken],verifyWrite, emailTemplateController.addEmailTemplate);
router.post("/emailTemplates/update", [authController.verifyToken], verifyWrite, emailTemplateController.updateEmailTemplate);
router.post("/emailTemplates/status", [authController.verifyToken],verifyWrite,  emailTemplateController.updateStatus);
router.post("/emailTemplates/delete", [authController.verifyToken], verifyWrite, emailTemplateController.deleteEmailTemplate);


module.exports = router;
