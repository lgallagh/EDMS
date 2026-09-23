const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const morgan = require("morgan");
require("dotenv").config();

const authRouter = require("./src/shared/routes/auth.route");
const listRouter = require("./src/shared/routes/list.route");
const validateRouter = require("./src/shared/routes/validate.route");
const htmlEditorRouter = require("./src/shared/routes/html-editor.route");
const doctorManagementRouter = require("./src/doctorManagement/routes/doctor-management.route");
const adminUtilitiesRouter = require("./src/adminUtilities/routes/admin-utilities.route");
const audiologistManagementRouter = require("./src/audiologistManagement/routes/audiologist-management.route");
const physicianAssistantManagementRouter = require("./src/physicianAssistantManagement/routes/physician-assistant-management.route");
const npManagementRouter = require("./src/npManagement/routes/np-management.route");
const slpManagementRouter = require("./src/slpManagement/routes/slp-management.route");
const internManagementRouter = require("./src/internManagement/routes/intern-management.route");
const underCMSRouter = require("./src/underCMS/routes/under-cms.route");
const serviceSectionRouter = require("./src/serviceSection/routes/service-section.route");
const hospitalAffiliationRouter = require("./src/hospitalAffiliation/routes/hospital-affiliation.route");
const officeManagementRouter = require("./src/officeManagement/routes/office-management.route");
const insuranceManagementRouter = require("./src/insuranceManagement/routes/insurance-management.route");
const emailTemplateRouter = require("./src/manageEmailTemplates/routes/manage-email-templates.route");

const { PoolManager } = require('./src/shared/util/pool-manager');
// const { errorHandler } = require('./src/exceptions/error-handler');
require("console-stamp")(console, {
  format: ":date(yyyy/mm/dd HH:MM:ss.l) :label",
});

const logger = require('./src/shared/util/winston-logger');
const debugLogger = require("winston");
const routeLogger = require("./src/shared/middleware/route-logging.middleware");
const userContextMiddleware = require("./src/shared/middleware/user-context.middleware");
const { handleError } = require("./src/shared/exceptions/error-handler");

class Server {
  constructor(app) {
    this.app = app || express();

    // Setup middleware
    this.app.use(morgan("combined", { stream: logger.stream || process.stdout }));
    this.app.use(userContextMiddleware);
    this.app.use(routeLogger);
    this.app.use(express.json());
    this.app.use(require("body-parser").urlencoded({ extended: false }));
    this.app.use(cookieParser());

    // Setup custom headers for auth token
    this.app.use((req, res, next) => {
      res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
      );
      next();
    });

    // Serve static frontend files
    this.app.use(
      express.static(path.resolve("./") + process.env.APP_PATH + "/frontend")
    );

    // Setup API routes
    this.app.use((process.env.API_PATH || "") + "/auth", authRouter);
    this.app.use((process.env.API_PATH || "") + "/lists", listRouter);
    this.app.use((process.env.API_PATH || "") + "/validate", validateRouter);
    this.app.use((process.env.API_PATH || "") + "/htmlEditor", htmlEditorRouter);
    this.app.use((process.env.API_PATH || "") + "/doctorManagement", doctorManagementRouter);
    this.app.use((process.env.API_PATH || "") + "/audiologistManagement", audiologistManagementRouter);
    this.app.use((process.env.API_PATH || "") + "/adminUtilities", adminUtilitiesRouter);
    this.app.use((process.env.API_PATH || "") + "/physicianAssistantManagement", physicianAssistantManagementRouter);
    this.app.use((process.env.API_PATH || "") + "/npManagement", npManagementRouter);
    this.app.use((process.env.API_PATH || "") + "/slpManagement", slpManagementRouter);
    this.app.use((process.env.API_PATH || "") + "/internManagement", internManagementRouter);
    this.app.use((process.env.API_PATH || "") + "/underCMS", underCMSRouter);
    this.app.use((process.env.API_PATH || "") + "/serviceSection", serviceSectionRouter);
    this.app.use((process.env.API_PATH || "") + "/hospitalAffiliation", hospitalAffiliationRouter);
    this.app.use((process.env.API_PATH || "") + "/officeManagement", officeManagementRouter);
    this.app.use((process.env.API_PATH || "") + "/insuranceManagement", insuranceManagementRouter);
    this.app.use((process.env.API_PATH || "") + "/manageEmailTemplates", emailTemplateRouter);

    const uploadFileDir = process.env.UPLOAD_FILE_DIR;
    const uploadFileServePath = process.env.UPLOAD_FILE_SERVE_PATH;
    //Serve static files stored in a configurable directory, using a configurable relative path
    this.app.use((process.env.API_PATH || "") + `/${uploadFileServePath}`, express.static(uploadFileDir));

    //Serve static assets like fonts and images
    this.app.use('/assets', express.static(path.resolve("./frontend")));

    // Pool initialization on startup (optional)
    debugLogger.debug("Starting Pool configuration.");
    this.startPools();

    // Redirect other routes to the frontend application
    this.app.get("*", (req, res) => {
      res.sendFile(
        path.resolve("./") + process.env.APP_PATH + "/frontend/index.html"
      );
    });

    // Global error handler middleware
    this.app.use((err, req, res, next) => {
      handleError(err, res);
    });
  }

  /**
   * Starts the server on the specified port.
   * @param {string|number} port - The port to start the server on.
   */
  start(port) {
    this.app.listen(port, () =>
      debugLogger.debug(`Server listening on port ${port}!`)
    );
  }

  /**
   * Initialize database connection pools (Uncomment and configure as needed).
   */
  
  async startPools() {
    const { PoolManager } = require('./src/shared/util/pool-manager');
    const poolManager = new PoolManager();

    const pool = await poolManager.getPool(
      'ENTA',
      JSON.parse(process.env.ENTA_DB_CONFIG)
    );
    debugLogger.debug("ENTA pool initiated.");
  }
  
}

module.exports = { Server };
