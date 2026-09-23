const path = require("path");
const logger = require("winston");

async function uploadFile(req) {
  return new Promise((resolve, reject) => {
    try {
      if (!req.file) {
        return reject(new Error("No file uploaded."));
      }
      const destDir = process.env.UPLOAD_FILE_SERVE_PATH + req.body.uploadDirectory;
      
      // Build the file URL.
      const fileUrl = path.join(destDir, req.file.filename);
      
      resolve({ url: fileUrl });
    } catch (error) {
      logger.error("Error uploading file", error);
      reject(error);
    }
  });
}

module.exports = {
  uploadFile,
};
