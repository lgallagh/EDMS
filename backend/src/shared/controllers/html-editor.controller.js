const htmlEditorService = require("../services/html-editor.service");
const logger = require("winston");
const wrapControllerFunctions = require("../../shared/middleware/controller-wrapper.middleware");

async function uploadFile(req, res, next) {
  try {
    const result = await htmlEditorService.uploadFile(req);
    res.json(result);
  } catch (err) {
    logger.error("Error uploading file", err.message);
    next(err);
  }
}

module.exports = wrapControllerFunctions({
  uploadFile,
}, "html-editor.controller");
