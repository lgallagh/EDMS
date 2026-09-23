const { plainToInstance } = require("class-transformer");
const logger = require("winston");
const wrapServiceFunctions = require("../../shared/middleware/service-wrapper.middleware");
const db = require("../../shared/services/db.service");
const DoctorData = require("../models/doctor.model");
const DoctorLanguageData = require("../models/doctor-language.model");
const DoctorOfficeData = require("../models/doctor-office.model");
const DoctorSocialsData = require("../models/doctor-socials.model");
const DoctorServiceData = require("../models/doctor-service.model");
const auditService = require("../../shared/services/audit.service");

/**
 * Retrieve list of Doctors
 */
async function doctors(req, res) {
    const params = new Map();

    params.set("type", "MD");
    params.set("order_by", "doctor_last_name");
    params.set("sort_by", "ASC");
    const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorList`, "ENTA", params);
    let doctorData = (0, plainToInstance)(DoctorData, result.recordsets[0]);
    return doctorData;
}

/**
 * Load data for a particular doctor by ID
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function loadDoctor(req, res) {
  const params = new Map();
  const doctorId = req.body.doctorId;

  params.set("doctor_id", doctorId);
  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorList`, "ENTA", params);
  let resultData = (0, plainToInstance)(DoctorData, result.recordsets[0]);
  let doctorData = resultData[0];

  //Load Office data for Doctor
  const officeParams = new Map();
  officeParams.set("doctor_id", doctorId);
  officeParams.set("office_id", 0);

  const officeResult = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorOffices`, "ENTA", officeParams);
  let officeResultData = (0, plainToInstance)(DoctorOfficeData, officeResult.recordsets[0]);
  let selectedOffices = [];
  for (let i = 0; i < officeResultData.length; i++) {
    selectedOffices.push(officeResultData[i].office_id);
  }
  doctorData.selectedOffices = selectedOffices;

  //Load Language data for Doctor
  const languageParams = new Map();
  languageParams.set("doctor_id", doctorId);
  languageParams.set("language_id", 0);

  const languageResult = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorLanguage`, "ENTA", languageParams);
  let languageResultData = (0, plainToInstance)(DoctorLanguageData, languageResult.recordsets[0]);
  let selectedLanguages = [];
  for (let i = 0; i < languageResultData.length; i++) {
    selectedLanguages.push(languageResultData[i].language_id);
  }
  doctorData.selectedLanguages = selectedLanguages;

  //Load Socials data for Doctor
  const socialParams = new Map();
  socialParams.set("doctor_id", doctorId);

  const socialResult = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorSocialUrls`, "ENTA", socialParams);
  let socialResultData = (0, plainToInstance)(DoctorSocialsData, socialResult.recordsets[0]);
  if(socialResultData && socialResultData[0]) {
    doctorData.doctor_youtube_channel_url = socialResultData[0].doctor_youtube_channel_url;
    doctorData.doctor_facebook_url = socialResultData[0].doctor_facebook_url;
    doctorData.doctor_twitter_url = socialResultData[0].doctor_twitter_url;
    doctorData.doctor_instagram_url = socialResultData[0].doctor_instagram_url;
    doctorData.doctor_google_url = socialResultData[0].doctor_google_url;
    doctorData.doctor_linkedin_url = socialResultData[0].doctor_linkedin_url;
    doctorData.review_code_top = socialResultData[0].review_code_top;
    doctorData.review_code_bottom = socialResultData[0].review_code_bottom;
  }

  return doctorData;
}


/**
 * Update a Doctor record to change just a particular status value
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
    await auditService.auditUpdate(oldData, newData, ["id"], auditService.Sections.DOCTOR, userContext.username, transaction);

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

async function updateDoctor(payload, file) {
  const doctorData = payload.doctorData;
  const originalDoctorData = payload.originalDoctorData;
  const userContext = payload.userContext;
  
  if (file) {
    doctorData.image_file = process.env.UPLOAD_FILE_SERVE_PATH + process.env.DOCTOR_FILE_PATH + "/" + file.filename;
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
    if (doctorData[key] !== undefined && doctorData[key] !== null) {
      updateParams.set(key, doctorData[key]);
    }
  }
  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctor`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(DoctorData, updateResult.recordsets[0]);
    let updatedDoctorData = updateResultData[0];

    /** Start Language Updates */
    //Check current language data for Doctor
    let languageResultData = await fetchDoctorLanguages(doctorData.id, transaction);

    //Determine which languages are newly added, and which need to be removed
    const languageResultIds = new Set(languageResultData.map(obj => obj.language_id));

    const languageAddList = [];
    const languageRemoveList = [];
    
    doctorData.selectedLanguages.forEach(id => {
      if (!languageResultIds.has(id)) {
        languageAddList.push(id);
      }
    });

    for (let i = 0; i < languageAddList.length; i++) {
      const languageAddParams = new Map();
      languageAddParams.set("doctor_id", doctorData.id);
      languageAddParams.set("language_id", languageAddList[i]);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctorLanguage`, transaction, languageAddParams);
    }
    
    languageResultData.forEach(obj => {
      if (!doctorData.selectedLanguages.includes(obj.language_id)) {
        languageRemoveList.push(obj.language_id);
      }
    });

    for (let i = 0; i < languageRemoveList.length; i++) {
      const languageRemoveParams = new Map();
      languageRemoveParams.set("doctor_id", doctorData.id);
      languageRemoveParams.set("entity_assoc_type", "Language");
      languageRemoveParams.set("entity_assoc_val", languageRemoveList[i]);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteDoctor`, transaction, languageRemoveParams);
    }

     /** End Language Updates */

    /** Start Office Updates */
    //Check current office data for Doctor
    let officeResultData = await fetchDoctorOffices(doctorData.id, transaction);

    //Determine which offices are newly added, and which need to be removed
    const officeResultIds = new Set(officeResultData.map(obj => obj.office_id));

    const officeAddList = [];
    const officeRemoveList = [];
    
    doctorData.selectedOffices.forEach(id => {
      if (!officeResultIds.has(id)) {
        officeAddList.push(id);
      }
    });

    for (let i = 0; i < officeAddList.length; i++) {
      const officeAddParams = new Map();
      officeAddParams.set("doctor_id", doctorData.id);
      officeAddParams.set("office_id", officeAddList[i]);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctorOffice`, transaction, officeAddParams);
    }
    
    officeResultData.forEach(obj => {
      if (!doctorData.selectedOffices.includes(obj.office_id)) {
        officeRemoveList.push(obj.office_id);
      }
    });

    for (let i = 0; i < officeRemoveList.length; i++) {
      const officeRemoveParams = new Map();
      officeRemoveParams.set("doctor_id", doctorData.id);
      officeRemoveParams.set("entity_assoc_type", "Office");
      officeRemoveParams.set("entity_assoc_val", officeRemoveList[i]);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteDoctor`, transaction, officeRemoveParams);
    }
    /** End Office Updates */

    /** Start Service Updates - Used in Import process */
    //If we're coming in from the doctor screen there will be no service information available, and we don't want to delete existing services.
    //This should only be reached when coming in from the Import path.
    if(doctorData.selectedServices) {
      //Check current service data for Doctor
      let serviceResultData = await fetchDoctorServices(doctorData.id, transaction);

      //Determine which languages are newly added, and which need to be removed
      const serviceResultIds = new Set(serviceResultData.map(obj => obj.service_id));

      const serviceAddList = [];
      const serviceRemoveList = [];
      
      doctorData.selectedServices.forEach(id => {
        if (!serviceResultIds.has(id)) {
          serviceAddList.push(id);
        }
      });

      for (let i = 0; i < serviceAddList.length; i++) {
        const serviceAddParams = new Map();
        serviceAddParams.set("doctor_id", doctorData.id);
        serviceAddParams.set("service_id", serviceAddList[i]);
        await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctorServices`, transaction, serviceAddParams);
      }
      
      serviceResultData.forEach(obj => {
        if (!doctorData.selectedServices.includes(obj.service_id)) {
          serviceRemoveList.push(obj.service_id);
        }
      });

      for (let i = 0; i < serviceRemoveList.length; i++) {
        const serviceRemoveParams = new Map();
        serviceRemoveParams.set("doctor_id", doctorData.id);
        serviceRemoveParams.set("entity_assoc_type", "Service");
        serviceRemoveParams.set("entity_assoc_val", serviceRemoveList[i]);
        await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteDoctor`, transaction, serviceRemoveParams);
      }
    }
     /** End Service Updates */

    /** Start Social Media Updates */
    let socialMediaResultData = await fetchDoctorSocialMedia(doctorData.id, transaction);

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
      if (doctorData[key] !== undefined && doctorData[key] !== null) {
        socialMediaUpdateParams.set(key, doctorData[key]);
      }
    }

    socialMediaUpdateParams.set("id", socialMediaResultData[0]?.id);
    socialMediaUpdateParams.set("doctor_id", doctorData.id);
    await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctorSocialUrls`, transaction, socialMediaUpdateParams);
    /** End Social Media Updates */

    await auditService.auditUpdate(originalDoctorData, doctorData, ["id"], auditService.Sections.DOCTOR, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return doctorData;
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

async function addDoctor(payload, file) {
  const doctorData = payload.doctorData;
  const userContext = payload.userContext;

  if (file) {
    doctorData.image_file = process.env.UPLOAD_FILE_SERVE_PATH + process.env.DOCTOR_FILE_PATH + "/" + file.filename;
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
    if (doctorData[key] !== undefined && doctorData[key] !== null) {
      updateParams.set(key, doctorData[key]);
    }
  }

  updateParams.set("is_callcenter_active", "Y");
  updateParams.set("provider_type", "MD");
  updateParams.set("doctor_obtain_src", "");

  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctor`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(DoctorData, updateResult.recordsets[0]);
    let updatedDoctorData = updateResultData[0];

    doctorData.id = updatedDoctorData.doctor_id;

    /** Start Language Updates */
    for (let i = 0; i < doctorData.selectedLanguages.length; i++) {
      const languageAddParams = new Map();
      languageAddParams.set("doctor_id", doctorData.id);
      languageAddParams.set("language_id", doctorData.selectedLanguages[i]);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctorLanguage`, transaction, languageAddParams);
    }
    
     /** End Language Updates */ 

    /** Start Office Updates */
    for (let i = 0; i < doctorData.selectedOffices.length; i++) {
      const officeAddParams = new Map();
      officeAddParams.set("doctor_id", doctorData.id);
      officeAddParams.set("office_id", doctorData.selectedOffices[i]);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctorOffice`, transaction, officeAddParams);
    }
    /** End Office Updates */

    /** Start Service Updates */
    //This should only be reached when coming in from the Import path.
    if(doctorData.selectedServices) {
      for (let i = 0; i < doctorData.selectedServices.length; i++) {
        const serviceAddParams = new Map();
        serviceAddParams.set("doctor_id", doctorData.id);
        serviceAddParams.set("service_id", doctorData.selectedServices[i]);
        await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctorServices`, transaction, serviceAddParams);
      }
    }
     /** End Service Updates */ 

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
      if (doctorData[key] !== undefined && doctorData[key] !== null) {
        socialMediaParams.set(key, doctorData[key]);
      }
    }

    socialMediaParams.set("doctor_id", doctorData.id);
    await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctorSocialUrls`, transaction, socialMediaParams);
    /** End Social Media Updates */

    await auditService.auditNew(doctorData, ["id"], auditService.Sections.DOCTOR, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return doctorData;
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
 * Delete record for a specific doctor
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function deleteDoctor(req, res) {
  const params = new Map();
  const doctorId = req.body.doctorId;

  let transaction;
  try {
    let userContext = req.userContext;
    transaction = await db.beginTransaction("ENTA");
    params.set("doctor_id", doctorId);

    //With a delete call we have not already got the data available, so we need to retrieve it first to see what it was before deletion
    let oldData = await loadDoctor(req, res);

    let deleteResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteDoctor`, transaction, params);

    await auditService.auditDelete(oldData, ["id"], auditService.Sections.DOCTOR, userContext.username, transaction);

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

/* Helper functions for retrieving lists of data associated with a Doctor */

/**
 * Get the list of Languages associated with a Doctor
 * @param {number} doctorId 
 * @param {object} transaction 
 * @returns {Promise<Array>}
 */
 async function fetchDoctorLanguages(doctorId, transaction = null) {
  const languageParams = new Map();
  languageParams.set("doctor_id", doctorId);
  languageParams.set("language_id", 0);

  const languageResult = transaction
    ? await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_GetDoctorLanguage`, transaction, languageParams)
    : await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorLanguage`, "ENTA", languageParams);

  const languageResultData = (0, plainToInstance)(DoctorLanguageData, languageResult.recordsets[0]);

  return languageResultData;
}

/**
 * Get the list of Offices associated with a Doctor
 * @param {number} doctorId 
 * @param {object} transaction 
 * @returns {Promise<Array>}
 */
async function fetchDoctorOffices(doctorId, transaction = null) {
  const officeParams = new Map();
  officeParams.set("doctor_id", doctorId);
  officeParams.set("office_id", 0);

  const officeResult = transaction
    ? await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_GetDoctorOffices`, transaction, officeParams)
    : await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorOffices`, "ENTA", officeParams);

  const officeResultData = (0, plainToInstance)(DoctorOfficeData, officeResult.recordsets[0]);

  return officeResultData;
}

/**
 * Get the Social Media details for a Doctor
 * @param {number} doctorId 
 * @param {object} transaction 
 * @returns {Promise<Array>}
 */
async function fetchDoctorSocialMedia(doctorId, transaction = null) {
  const socialMediaParams = new Map();
  socialMediaParams.set("doctor_id", doctorId);

  const socialMediaResult = transaction
    ? await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_GetDoctorSocialUrls`, transaction, socialMediaParams)
    : await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorSocialUrls`, "ENTA", socialMediaParams);

  const socialMediaResultData = (0, plainToInstance)(DoctorSocialsData, socialMediaResult.recordsets[0]);

  return socialMediaResultData;
}

/**
 * Get the list of Services associated with a Doctor
 * @param {number} doctorId 
 * @param {object} transaction 
 * @returns {Promise<Array>}
 */
async function fetchDoctorServices(doctorId, transaction = null) {
  const serviceParams = new Map();
  serviceParams.set("doctor_id", doctorId);
  serviceParams.set("service_id", 0);

  const serviceResult = transaction
    ? await db.executeInTransaction("usp_CMS_GetDoctorServicesList", transaction, serviceParams)
    : await db.storedProc("usp_CMS_GetDoctorServicesList", "ENTA", serviceParams);

  const serviceResultData = (0, plainToInstance)(DoctorServiceData, serviceResult.recordsets[0]);

  return serviceResultData;
}

module.exports = wrapServiceFunctions({
  doctors,
  loadDoctor,
  updateDoctor,
  addDoctor,
  updateStatus,
  deleteDoctor,
  fetchDoctorLanguages,
  fetchDoctorOffices,
  fetchDoctorSocialMedia,
  fetchDoctorServices
}, "doctor-management.service");
