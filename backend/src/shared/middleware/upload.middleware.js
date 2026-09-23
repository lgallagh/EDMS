const multer = require("multer");
const path = require("path");
const fs = require("fs");

function createMulterMiddleware({
  allowedTypes,
  uniqueName,
  renameFile,
  destinationPath, // default base path (for single file uploads or as fallback)
  field,         // for single file uploads (string)
  fields         // for multiple files (array of field config objects)
}) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Determine the destination path for this file.
      let destPath = destinationPath;
      if (fields && Array.isArray(fields)) {
        const fieldConfig = fields.find(f => f.name === file.fieldname);
        if (fieldConfig && fieldConfig.destinationPath) {
          destPath = fieldConfig.destinationPath;
        }
      }
      // Ensure the directory exists.
      fs.mkdirSync(destPath, { recursive: true });
      cb(null, destPath);
    },
    filename: (req, file, cb) => {
      // Create a sanitized version of the original file name.
      const originalName = file.originalname.toLowerCase().replace(/\s+/g, "-");
      const ext = path.extname(originalName);
      const baseName = path.basename(originalName, ext);

      // Determine the destination for this file (same logic as in destination callback).
      let computedDest = destinationPath;
      if (fields && Array.isArray(fields)) {
        const fieldConfig = fields.find(f => f.name === file.fieldname);
        if (fieldConfig && fieldConfig.destinationPath) {
          computedDest = fieldConfig.destinationPath;
        }
      }

      if (renameFile) {
        let finalName = originalName;
        let counter = 1;

        // Check for naming conflicts in the computed destination.
        while (fs.existsSync(path.join(computedDest, finalName))) {
          finalName = `${baseName}_${counter}${ext}`;
          counter += 1;
        }
        cb(null, finalName);
      } else if (uniqueName) {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
      } else {
        cb(null, file.originalname);
      }
    },
  });

  const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      if (allowedTypes) {
        const filetypes = new RegExp(allowedTypes.join("|"));
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (extname) {
          return cb(null, true);
        }
        return cb(new Error(`File upload only supports the following filetypes: ${allowedTypes.join(", ")}`));
      }
      cb(null, true);
    },
  });

  // If a fields array is provided, use upload.fields() so that multiple files
  // (each with possibly its own destination) are processed in one pass.
  if (fields && Array.isArray(fields)) {
    return upload.fields(fields);
  }
  // Otherwise, if a single field name is provided, use upload.single().
  if (field && typeof field === "string") {
    return upload.single(field);
  }
  // If neither is provided, return the raw multer instance so the caller can chain methods (like .any()).
  return upload;
}

module.exports = createMulterMiddleware;
