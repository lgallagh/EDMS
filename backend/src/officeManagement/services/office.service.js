const { plainToInstance } = require("class-transformer");
const logger = require("winston");
const wrapServiceFunctions = require("../../shared/middleware/service-wrapper.middleware");
const db = require("../../shared/services/db.service");

const OfficeData = require("../models/office.model");
const auditService = require("../../shared/services/audit.service");

/**
 * Retrieve list of Offices
 */
async function offices(req, res) {
    const params = new Map();

   // params.set("type", "MD");
   // params.set("order_by", "office_last_name");
   // params.set("sort_by", "ASC");
    const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetOfficeList`, "ENTA", params);
    let officeData = (0, plainToInstance)(OfficeData, result.recordsets[0]);
    return officeData;
}

/**
 * Load data for a particular office by ID
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function loadOffice(officeId) {
  const params = new Map();
  params.set("id", officeId);
  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetOfficeList`, "ENTA", params);
  let resultData = (0, plainToInstance)(OfficeData, result.recordsets[0]);
  let officeData = resultData[0];

  

  return officeData;
}


/**
 * Update a Office record to change just a particular status value
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateStatus(req, res) {
  let transaction;
    try {
      transaction = await db.beginTransaction("ENTA");
      const params = new Map();
      const officeId = req.body.officeId;
  
      params.set("id", officeId);
      //Set the actual value we're changing, for the appropriate status field
      params.set(req.body.field, req.body.status);
  
      let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveOffice`, transaction, params);
  
      let userContext = req.userContext;
      let oldData = {id: req.body.officeId, [req.body.field]: req.body.oldStatus};
      let newData = {id: req.body.officeId, [req.body.field]: req.body.status};
      await auditService.auditUpdate(oldData, newData, ["id"], auditService.Sections.OFFICE, userContext.username, transaction);
  
      await db.commitTransaction(transaction);
      return updateResult;
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

async function updateOffice(req, res) {
  let officeData = JSON.parse(req.body.officeData);
  const originalOfficeData = JSON.parse(req.body.originalOfficeData);
  const userContext = req.userContext;

  if (req.file) {
    officeData.document_file = process.env.UPLOAD_FILE_SERVE_PATH + process.env.DOCTOR_FILE_PATH + "/" + req.file.filename;
  }

  const updateParams = new Map();

  const allowedKeys = [
    "id",
    "office_name",
    "office_iso",
    "google_street_location",
    "google_street_location2",
    "gps_street_location",
    "gps_street_location2",
    "nextgen_id",
    "street_location",
    "street_location2",
    "city",
    "county_id",
    "zip",
    "vanity_url",
    "road_direction",
    "road_landmark",
    "parking_info",
    "formatted_address",
    "phone",
    "fax",
    "administrator",
    "psa_email",
    "psa_emergency_contact",
    "patient_information",
    "regional_manager",
    "backline_phone",
    "pixcel_code_fb",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
    "lat",
    "lon",
    "is_sleep",
    "is_active",
    "is_latenight",
    "office_callcenter",
    "audio_first",
    "cc_go_live",
    "widget_code",
    "zocdoc_widget",
    "yext_schema_code",
    "financing_url",
    "prd_rep",
    "banner_image",
    "blurb",
    "seo_title",
    "seo_description",
    "seo_keywords",
    "is_callcenter_active",
    "is_submit_to_nextgen_active",
    "review_code_bottom",
    "microdata_code_seo",
    "google_map_url",
    "office_obtain_src",
    "shortened_url"
  ];

  for (const key of allowedKeys) {
    if (officeData[key] !== undefined && officeData[key] !== null) {
      updateParams.set(key, officeData[key]);
    }
  }
  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveOffice`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(OfficeData, updateResult.recordsets[0]);
    let updatedOfficeData = updateResultData[0];


    await auditService.auditUpdate(originalOfficeData, officeData, ["id"], auditService.Sections.OFFICE, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return officeData;
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

async function addOffice(req, res) {
  let officeData = JSON.parse(req.body.officeData);
  let userContext = req.userContext;

  if (req.file) {
    officeData.document_file = process.env.UPLOAD_FILE_SERVE_PATH + process.env.DOCTOR_FILE_PATH + "/" + req.file.filename;
  }

  const updateParams = new Map();

  const allowedKeys = [
    "id",
    "office_name",
    "office_iso",
    "google_street_location",
    "google_street_location2",
    "gps_street_location",
    "gps_street_location2",
    "nextgen_id",
    "street_location",
    "street_location2",
    "city",
    "county_id",
    "zip",
    "vanity_url",
    "road_direction",
    "road_landmark",
    "parking_info",
    "formatted_address",
    "phone",
    "fax",
    "administrator",
    "psa_email",
    "psa_emergency_contact",
    "patient_information",
    "regional_manager",
    "backline_phone",
    "pixcel_code_fb",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
    "lat",
    "lon",
    "is_sleep",
    "is_active",
    "is_latenight",
    "office_callcenter",
    "audio_first",
    "cc_go_live",
    "widget_code",
    "zocdoc_widget",
    "yext_schema_code",
    "financing_url",
    "prd_rep",
    "banner_image",
    "blurb",
    "seo_title",
    "seo_description",
    "seo_keywords",
    "is_callcenter_active",
    "is_submit_to_nextgen_active",
    "review_code_bottom",
    "microdata_code_seo",
    "google_map_url",
    "office_obtain_src",
    "shortened_url"
  ];

  for (const key of allowedKeys) {
    if (officeData[key] !== undefined && officeData[key] !== null) {
      updateParams.set(key, officeData[key]);
    }
  }

  updateParams.set("is_callcenter_active",officeData["is_active"] )
  updateParams.set("office_obtain_src"," " )

  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveOffice`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(OfficeData, updateResult.recordsets[0]);
    let updatedOfficeData = updateResultData[0];

    officeData.id = updatedOfficeData.office_id;

    await auditService.auditNew(officeData, ["id"], auditService.Sections.OFFICE, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return officeData;
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

/**
 * Delete record for a specific office
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function deleteOffice(req, res) {
  const params = new Map();
  const officeId = req.body.officeId;

  let transaction;
    try {
      let userContext = req.userContext;
      transaction = await db.beginTransaction("ENTA");
      params.set("office_id", officeId);
  
      //With a delete call we have not already got the data available, so we need to retrieve it first to see what it was before deletion
      let oldData = await loadOffice(officeId);
  
      let deleteResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteOffice`, transaction, params);
  
      await auditService.auditDelete(oldData, ["id"], auditService.Sections.OFFICE, userContext.username, transaction);
  
      await db.commitTransaction(transaction);
  
      return deleteResult;
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

/* Helper functions for retrieving lists of data associated with a Office */

/**
 * Get the list of Languages associated with a Office
 * @param {number} officeId 
 * @param {object} transaction 
 * @returns {Promise<Array>}
 */
 async function fetchOfficeLanguages(officeId, transaction = null) {
  const languageParams = new Map();
  languageParams.set("office_id", officeId);
  languageParams.set("language_id", 0);

  const languageResult = transaction
    ? await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_GetOfficeLanguage`, transaction, languageParams)
    : await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetOfficeLanguage`, "ENTA", languageParams);

  const languageResultData = (0, plainToInstance)(OfficeLanguageData, languageResult.recordsets[0]);

  return languageResultData;
}

/**
 * Get the list of Offices associated with a Office
 * @param {number} officeId 
 * @param {object} transaction 
 * @returns {Promise<Array>}
 */
async function fetchOffices(officeId, transaction = null) {
  const officeParams = new Map();
  officeParams.set("office_id", officeId);
  officeParams.set("office_id", 0);

  const officeResult = transaction
    ? await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_GetOffices`, transaction, officeParams)
    : await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetOfficeList`, "ENTA", officeParams);

  const officeResultData = (0, plainToInstance)(OfficeData, officeResult.recordsets[0]);

  return officeResultData;
}

/**
 * Get the Social Media details for a Office
 * @param {number} officeId 
 * @param {object} transaction 
 * @returns {Promise<Array>}
 */
async function fetchOfficeSocialMedia(officeId, transaction = null) {
  const socialMediaParams = new Map();
  socialMediaParams.set("office_id", officeId);

  const socialMediaResult = transaction
    ? await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_GetOfficeSocialUrls`, transaction, socialMediaParams)
    : await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetOfficeSocialUrls`, "ENTA", socialMediaParams);

  const socialMediaResultData = (0, plainToInstance)(OfficeSocialsData, socialMediaResult.recordsets[0]);

  return socialMediaResultData;
}

/**
 * Get the list of Services associated with a Office
 * @param {number} officeId 
 * @param {object} transaction 
 * @returns {Promise<Array>}
 */
async function fetchOfficeServices(officeId, transaction = null) {
  const serviceParams = new Map();
  serviceParams.set("office_id", officeId);
  serviceParams.set("service_id", 0);

  const serviceResult = transaction
    ? await db.executeInTransaction("usp_CMS_GetOfficeListervicesList", transaction, serviceParams)
    : await db.storedProc("usp_CMS_GetOfficeListervicesList", "ENTA", serviceParams);

  const serviceResultData = (0, plainToInstance)(OfficeServiceData, serviceResult.recordsets[0]);

  return serviceResultData;
}

module.exports = wrapServiceFunctions({
  offices,
  loadOffice,
  updateOffice,
  addOffice,
  updateStatus,
  deleteOffice,
  fetchOfficeLanguages,
  fetchOffices,
  fetchOfficeSocialMedia,
  fetchOfficeServices
}, "office.service");
