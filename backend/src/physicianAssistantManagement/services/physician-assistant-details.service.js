const { plainToInstance } = require("class-transformer");
const logger = require("winston");
const wrapServiceFunctions = require("../../shared/middleware/service-wrapper.middleware");
const db = require("../../shared/services/db.service");
const PhysicianAssistantData = require("../models/physician-assistant.model");
const PhysicianAssistantLanguageData = require("../models/physician-assistant-language.model");
const PhysicianAssistantOfficeData = require("../models/physician-assistant-office.model");
const PhysicianAssistantSocialsData = require("../models/physician-assistant-socials.model");
const auditService = require("../../shared/services/audit.service");

/**
 * Retrieve list of Physician Assistants
 */
async function physicianAssistants(req, res) {
    const params = new Map();

    params.set("type", "PA");
    params.set("order_by", "doctor_last_name");
    params.set("sort_by", "ASC");
    const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorList`, "ENTA", params);
    let physicianAssistantData = (0, plainToInstance)(PhysicianAssistantData, result.recordsets[0]);
    return physicianAssistantData;
}

/**
 * Load data for a particular Physician Assistant by ID
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function loadPhysicianAssistant(req, res) {
  const params = new Map();
  const doctorId = req.body.doctorId;

  params.set("doctor_id", doctorId);
  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorList`, "ENTA", params);
  let resultData = (0, plainToInstance)(PhysicianAssistantData, result.recordsets[0]);
  let physicianAssistantData = resultData[0];

  //Load Office data for Physician Assistant
  const officeParams = new Map();
  officeParams.set("doctor_id", doctorId);
  officeParams.set("office_id", 0);

  const officeResult = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorOffices`, "ENTA", officeParams);
  let officeResultData = (0, plainToInstance)(PhysicianAssistantOfficeData, officeResult.recordsets[0]);
  let selectedOffices = [];
  for (let i = 0; i < officeResultData.length; i++) {
    selectedOffices.push(officeResultData[i].office_id);
  }
  physicianAssistantData.selectedOffices = selectedOffices;

  //Load Language data for Physician Assistant
  const languageParams = new Map();
  languageParams.set("doctor_id", doctorId);
  languageParams.set("language_id", 0);

  const languageResult = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorLanguage`, "ENTA", languageParams);
  let languageResultData = (0, plainToInstance)(PhysicianAssistantLanguageData, languageResult.recordsets[0]);
  let selectedLanguages = [];
  for (let i = 0; i < languageResultData.length; i++) {
    selectedLanguages.push(languageResultData[i].language_id);
  }
  physicianAssistantData.selectedLanguages = selectedLanguages;

  //Load Socials data for Physician Assistant
  const socialParams = new Map();
  socialParams.set("doctor_id", doctorId);

  const socialResult = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorSocialUrls`, "ENTA", socialParams);
  let socialResultData = (0, plainToInstance)(PhysicianAssistantSocialsData, socialResult.recordsets[0]);
  if(socialResultData && socialResultData[0]) {
    physicianAssistantData.doctor_youtube_channel_url = socialResultData[0].doctor_youtube_channel_url;
    physicianAssistantData.doctor_facebook_url = socialResultData[0].doctor_facebook_url;
    physicianAssistantData.doctor_twitter_url = socialResultData[0].doctor_twitter_url;
    physicianAssistantData.doctor_instagram_url = socialResultData[0].doctor_instagram_url;
    physicianAssistantData.doctor_google_url = socialResultData[0].doctor_google_url;
    physicianAssistantData.doctor_linkedin_url = socialResultData[0].doctor_linkedin_url;
    physicianAssistantData.review_code_top = socialResultData[0].review_code_top;
    physicianAssistantData.review_code_bottom = socialResultData[0].review_code_bottom;
  }

  return physicianAssistantData;
}


/**
 * Update a Physician Assistant record to change just a particular status value
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateStatus(req, res) {
  let transaction;
    try {
      transaction = await db.beginTransaction("ENTA");
      const params = new Map();
      const doctorId = req.body.doctorId;
  
      params.set("id", doctorId);
      //Set the actual value we're changing, for the appropriate status field
      params.set(req.body.field, req.body.status);
  
      let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctor`, transaction, params);
  
      let userContext = req.userContext;
      let oldData = {id: req.body.doctorId, [req.body.field]: req.body.oldStatus};
      let newData = {id: req.body.doctorId, [req.body.field]: req.body.status};
      await auditService.auditUpdate(oldData, newData, ["id"], auditService.Sections.PROFESSIONALS, userContext.username, transaction);
  
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

async function updatePhysicianAssistant(req, res) {
  let physicianAssistantData = JSON.parse(req.body.physicianAssistantData);
  const originalPhysicianAssistantData = JSON.parse(req.body.originalPhysicianAssistantData);
  const userContext = req.userContext;
  if (req.file) {
    physicianAssistantData.image_file = process.env.UPLOAD_FILE_SERVE_PATH + process.env.DOCTOR_FILE_PATH + "/" + req.file.filename;
  }

  const updateParams = new Map();

  const allowedKeys = [
    "id",
    "speciality",
    "doctor_first_name",
    "doctor_middle_name",
    "doctor_last_name",
    "doctor_credential",
    "gender",
    "biography",
    "biography_spanish",
    "right_column_text",
    "phone",
    "email",
    "image_file",
    "vanity_url",
    "healthgrades_url",
    "seo_title",
    "seo_description",
    "seo_keywords",
    "doctor_short_name",
    "CAQHID",
    "NPI",
    "extended_shot_hours",
    "is_active",
    "is_submit_to_nextgen_active",
    "is_virtual_visit",
    "virtual_visit_url",
    "doctor_maiden_name",
  ];

  for (const key of allowedKeys) {
    if (physicianAssistantData[key] !== undefined && physicianAssistantData[key] !== null) {
      updateParams.set(key, physicianAssistantData[key]);
    }
  }
  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctor`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(PhysicianAssistantData, updateResult.recordsets[0]);
    let updatedPhysicianAssistantData = updateResultData[0];

    /** Start Language Updates */
    //Check current language data for Physician Assistant
    let languageResultData = await fetchPhysicianAssistantLanguages(physicianAssistantData.id, transaction);

    //Determine which languages are newly added, and which need to be removed
    const languageResultIds = new Set(languageResultData.map(obj => obj.language_id));

    const languageAddList = [];
    const languageRemoveList = [];
    
    physicianAssistantData.selectedLanguages.forEach(id => {
      if (!languageResultIds.has(id)) {
        languageAddList.push(id);
      }
    });

    for (let i = 0; i < languageAddList.length; i++) {
      const languageAddParams = new Map();
      languageAddParams.set("doctor_id", physicianAssistantData.id);
      languageAddParams.set("language_id", languageAddList[i]);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctorLanguage`, transaction, languageAddParams);
    }
    
    languageResultData.forEach(obj => {
      if (!physicianAssistantData.selectedLanguages.includes(obj.language_id)) {
        languageRemoveList.push(obj.language_id);
      }
    });

    for (let i = 0; i < languageRemoveList.length; i++) {
      const languageRemoveParams = new Map();
      languageRemoveParams.set("doctor_id", physicianAssistantData.id);
      languageRemoveParams.set("entity_assoc_type", "Language");
      languageRemoveParams.set("entity_assoc_val", languageRemoveList[i]);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteDoctor`, transaction, languageRemoveParams);
    }

     /** End Language Updates */

    /** Start Office Updates */
    //Check current office data for Doctor
    let officeResultData = await fetchPhysicianAssistantOffices(physicianAssistantData.id, transaction);

    //Determine which offices are newly added, and which need to be removed
    const officeResultIds = new Set(officeResultData.map(obj => obj.office_id));

    const officeAddList = [];
    const officeRemoveList = [];
    
    physicianAssistantData.selectedOffices.forEach(id => {
      if (!officeResultIds.has(id)) {
        officeAddList.push(id);
      }
    });

    for (let i = 0; i < officeAddList.length; i++) {
      const officeAddParams = new Map();
      officeAddParams.set("doctor_id", physicianAssistantData.id);
      officeAddParams.set("office_id", officeAddList[i]);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctorOffice`, transaction, officeAddParams);
    }
    
    officeResultData.forEach(obj => {
      if (!physicianAssistantData.selectedOffices.includes(obj.office_id)) {
        officeRemoveList.push(obj.office_id);
      }
    });

    for (let i = 0; i < officeRemoveList.length; i++) {
      const officeRemoveParams = new Map();
      officeRemoveParams.set("doctor_id", physicianAssistantData.id);
      officeRemoveParams.set("entity_assoc_type", "Office");
      officeRemoveParams.set("entity_assoc_val", officeRemoveList[i]);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteDoctor`, transaction, officeRemoveParams);
    }
    /** End Office Updates */

    /** Start Social Media Updates */
    let socialMediaResultData = await fetchPhysicianAssistantSocialMedia(physicianAssistantData.id, transaction);

    const socialMediaKeys = [
      "doctor_youtube_channel_url",
      "doctor_facebook_url",
      "doctor_twitter_url",
      "doctor_instagram_url",
      "doctor_google_url",
      "doctor_linkedin_url",
      "review_code_top",
      "review_code_bottom"
    ];
  
    const socialMediaUpdateParams = new Map();
    for (const key of socialMediaKeys) {
      if (physicianAssistantData[key] !== undefined && physicianAssistantData[key] !== null) {
        socialMediaUpdateParams.set(key, physicianAssistantData[key]);
      }
    }

    socialMediaUpdateParams.set("id", socialMediaResultData[0]?.id);
    socialMediaUpdateParams.set("doctor_id", physicianAssistantData.id);
    await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctorSocialUrls`, transaction, socialMediaUpdateParams);
    /** End Social Media Updates */

    await auditService.auditUpdate(originalPhysicianAssistantData, physicianAssistantData, ["id"], auditService.Sections.PROFESSIONALS, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return physicianAssistantData;
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
 * Add records for a new Physician Assistant
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function addPhysicianAssistant(req, res) {
  let physicianAssistantData = JSON.parse(req.body.physicianAssistantData);
  const userContext = req.userContext;

  if (req.file) {
    physicianAssistantData.image_file = process.env.UPLOAD_FILE_SERVE_PATH + process.env.DOCTOR_FILE_PATH + "/" + req.file.filename;
  }

  const updateParams = new Map();

  const allowedKeys = [
    "id",
    "speciality",
    "doctor_first_name",
    "doctor_middle_name",
    "doctor_last_name",
    "doctor_credential",
    "gender",
    "biography",
    "biography_spanish",
    "right_column_text",
    "phone",
    "email",
    "image_file",
    "vanity_url",
    "healthgrades_url",
    "seo_title",
    "seo_description",
    "seo_keywords",
    "doctor_short_name",
    "CAQHID",
    "NPI",
    "extended_shot_hours",
    "is_active",
    "is_submit_to_nextgen_active",
    "is_virtual_visit",
    "virtual_visit_url",
    "doctor_maiden_name",
  ];

  for (const key of allowedKeys) {
    if (physicianAssistantData[key] !== undefined && physicianAssistantData[key] !== null) {
      updateParams.set(key, physicianAssistantData[key]);
    }
  }

  updateParams.set("is_callcenter_active", "Y");
  updateParams.set("provider_type", "PA");
  updateParams.set("doctor_obtain_src", "");

  physicianAssistantData.is_callcenter_active = "Y";
  physicianAssistantData.provider_type = "PA";
  physicianAssistantData.doctor_obtain_src = "";

  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctor`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(PhysicianAssistantData, updateResult.recordsets[0]);
    let updatedPhysicianAssistantData = updateResultData[0];

    physicianAssistantData.id = updatedPhysicianAssistantData.doctor_id;

    /** Start Language Updates */
    for (let i = 0; i < physicianAssistantData.selectedLanguages.length; i++) {
      const languageAddParams = new Map();
      languageAddParams.set("doctor_id", physicianAssistantData.id);
      languageAddParams.set("language_id", physicianAssistantData.selectedLanguages[i]);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctorLanguage`, transaction, languageAddParams);
    }
    
     /** End Language Updates */ 

    /** Start Office Updates */
    for (let i = 0; i < physicianAssistantData.selectedOffices.length; i++) {
      const officeAddParams = new Map();
      officeAddParams.set("doctor_id", physicianAssistantData.id);
      officeAddParams.set("office_id", physicianAssistantData.selectedOffices[i]);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctorOffice`, transaction, officeAddParams);
    }
    /** End Office Updates */

    /** Start Social Media Updates */
    const socialMediaKeys = [
      "doctor_youtube_channel_url",
      "doctor_facebook_url",
      "doctor_twitter_url",
      "doctor_instagram_url",
      "doctor_google_url",
      "doctor_linkedin_url",
      "review_code_top",
      "review_code_bottom"
    ];
  
    const socialMediaParams = new Map();
    for (const key of socialMediaKeys) {
      if (physicianAssistantData[key] !== undefined && physicianAssistantData[key] !== null) {
        socialMediaParams.set(key, physicianAssistantData[key]);
      }
    }

    socialMediaParams.set("doctor_id", physicianAssistantData.id);
    await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctorSocialUrls`, transaction, socialMediaParams);
    /** End Social Media Updates */

    await auditService.auditNew(physicianAssistantData, ["id"], auditService.Sections.PROFESSIONALS, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return physicianAssistantData;
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
 * Delete record for a specific Physician Assistant
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function deletePhysicianAssistant(req, res) {
  const params = new Map();
  const doctorId = req.body.doctorId;

  let transaction;
    try {
      let userContext = req.userContext;
      transaction = await db.beginTransaction("ENTA");
      params.set("doctor_id", doctorId);
  
      //With a delete call we have not already got the data available, so we need to retrieve it first to see what it was before deletion
      let oldData = await loadPhysicianAssistant(req, res);
  
      let deleteResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteDoctor`, transaction, params);
  
      await auditService.auditDelete(oldData, ["id"], auditService.Sections.PROFESSIONALS, userContext.username, transaction);
  
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

/* Helper functions for retrieving lists of data associated with a Physician Assistant */

/**
 * Get the list of Languages associated with a Physician Assistant
 * @param {number} doctorId 
 * @param {object} transaction 
 * @returns {Promise<Array>}
 */
 async function fetchPhysicianAssistantLanguages(doctorId, transaction = null) {
  const languageParams = new Map();
  languageParams.set("doctor_id", doctorId);
  languageParams.set("language_id", 0);

  const languageResult = transaction
    ? await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_GetDoctorLanguage`, transaction, languageParams)
    : await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorLanguage`, "ENTA", languageParams);

  const languageResultData = (0, plainToInstance)(PhysicianAssistantLanguageData, languageResult.recordsets[0]);

  return languageResultData;
}

/**
 * Get the list of Offices associated with a Physician Assistant
 * @param {number} doctorId 
 * @param {object} transaction 
 * @returns {Promise<Array>}
 */
async function fetchPhysicianAssistantOffices(doctorId, transaction = null) {
  const officeParams = new Map();
  officeParams.set("doctor_id", doctorId);
  officeParams.set("office_id", 0);

  const officeResult = transaction
    ? await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_GetDoctorOffices`, transaction, officeParams)
    : await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorOffices`, "ENTA", officeParams);

  const officeResultData = (0, plainToInstance)(PhysicianAssistantOfficeData, officeResult.recordsets[0]);

  return officeResultData;
}

/**
 * Get the Social Media details for a Physician Assistant
 * @param {number} doctorId 
 * @param {object} transaction 
 * @returns {Promise<Array>}
 */
async function fetchPhysicianAssistantSocialMedia(doctorId, transaction = null) {
  const socialMediaParams = new Map();
  socialMediaParams.set("doctor_id", doctorId);

  const socialMediaResult = transaction
    ? await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_GetDoctorSocialUrls`, transaction, socialMediaParams)
    : await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorSocialUrls`, "ENTA", socialMediaParams);

  const socialMediaResultData = (0, plainToInstance)(PhysicianAssistantSocialsData, socialMediaResult.recordsets[0]);

  return socialMediaResultData;
}


module.exports = wrapServiceFunctions({
  physicianAssistants,
  loadPhysicianAssistant,
  updatePhysicianAssistant,
  addPhysicianAssistant,
  updateStatus,
  deletePhysicianAssistant,
  fetchPhysicianAssistantLanguages,
  fetchPhysicianAssistantOffices,
  fetchPhysicianAssistantSocialMedia
}, "physician-assistant-details.service");
