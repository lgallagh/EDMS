const express = require("express");
const router = express.Router();
const validateController = require("../controllers/validate.controller");
const authController = require("../controllers/auth.controller");


router.post("/vanityURL", [authController.verifyToken], validateController.validateVanityURL);

module.exports = router;
