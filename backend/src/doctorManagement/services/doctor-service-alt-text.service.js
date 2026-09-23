const { plainToInstance } = require("class-transformer");
const logger = require("winston");
const wrapServiceFunctions = require("../../shared/middleware/service-wrapper.middleware");
const db = require("../../shared/services/db.service");
const DoctorOfficeData = require("../models/doctor-service.model");
const auditService = require("../../shared/services/audit.service");

/**
 * Retrieve list of Offices for a Doctor, with Service Alt Text
 */
async function doctorServiceAltTexts(req, res) {
    const params = new Map();

    const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorOffices`, "ENTA", params);
    let doctorData = (0, plainToInstance)(DoctorOfficeData, result.recordsets[0]);
    return doctorData;
}

/**
 * Load data for a particular Doctor/Office combination
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function loadDoctorServiceAltText(req, res) {
  const params = new Map();
  const doctorOfficeId = req.body.doctorOfficeId;

  params.set("id", doctorOfficeId);
  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorOffices`, "ENTA", params);
  let resultData = (0, plainToInstance)(DoctorOfficeData, result.recordsets[0]);
  let doctorOfficeData = resultData[0];

  return doctorOfficeData;
}

/**
 * Make changes to the Service Alternate Text for a Doctor/Office combination
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateDoctorServiceAltText(req, res) {
  let doctorOfficeData = req.body.doctorOfficeData;
  let originalDoctorOfficeData = req.body.originalDoctorOfficeData;
  let userContext = req.userContext;

  //This is a helper value from the front end, but now that we're auditing we don't want to include this in the object
  doctorOfficeData.service_alternate_text_hidden = null;

  const updateParams = new Map();

  updateParams.set("id", doctorOfficeData.id);
  updateParams.set("alternate_text", doctorOfficeData.service_alternate_text);

  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction("usp_CMS_SaveDoctorOffice", transaction, updateParams);
    let updateResultData = (0, plainToInstance)(DoctorOfficeData, updateResult.recordsets[0]);
    let updatedDoctorOfficeData = updateResultData[0];

    await auditService.auditUpdate(originalDoctorOfficeData, doctorOfficeData, ["id"], auditService.Sections.DOCTORALTTEXT, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return updatedDoctorOfficeData;
  } catch (error) {
    if (transaction) {
      await db.rollbackTransaction(transaction);
      logger.error('Transaction rolled back due to an error:', error);
    } else {
      logger.error('Error occurred before transaction could start:', error);
    }

    throw error;
  }
}


module.exports = wrapServiceFunctions({
  doctorServiceAltTexts,
  loadDoctorServiceAltText,
  updateDoctorServiceAltText
}, "doctor-service-alt-text.service");
