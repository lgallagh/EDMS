const { plainToInstance } = require("class-transformer");
const logger = require("winston");
const wrapServiceFunctions = require("../../shared/middleware/service-wrapper.middleware");
const db = require("../../shared/services/db.service");
const SLPData = require("../models/slp.model");
const SLPLanguageData = require("../models/slp-language.model");
const SLPOfficeData = require("../models/slp-office.model");
const auditService = require("../../shared/services/audit.service");

/**
 * Retrieve list of SLPs
 */
async function slps(req, res) {
    const params = new Map();

    params.set("type", "SLP");
    params.set("order_by", "last_name");
    params.set("sort_by", "ASC");
    const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetProfessionalList`, "ENTA", params);
    let doctorData = (0, plainToInstance)(SLPData, result.recordsets[0]);
    return doctorData;
}

/**
 * Load data for a particular SLP by ID
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function loadSLP(req, res) {
  const params = new Map();
  const slpId = req.body.professionalId;

  params.set("id", slpId);
  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetProfessionalList`, "ENTA", params);
  let resultData = (0, plainToInstance)(SLPData, result.recordsets[0]);
  let slpData = resultData[0];

  //Load Office data for SLP
  const primaryOfficeResult = await fetchSLPOffices(slpId, "Primary");
  let selectedPrimaryOffices = [];
  for (let i = 0; i < primaryOfficeResult.length; i++) {
    selectedPrimaryOffices.push(primaryOfficeResult[i].office_id);
  }
  slpData.selectedPrimaryOffices = selectedPrimaryOffices;

  const secondaryOfficeResult = await fetchSLPOffices(slpId, "Secondary");
  let selectedSecondaryOffices = [];
  for (let i = 0; i < secondaryOfficeResult.length; i++) {
    selectedSecondaryOffices.push(secondaryOfficeResult[i].office_id);
  }
  slpData.selectedSecondaryOffices = selectedSecondaryOffices;

  //Load Language data for Doctor
  const languageResult = await fetchSLPLanguages(slpId);
  let selectedLanguages = [];
  for (let i = 0; i < languageResult.length; i++) {
    selectedLanguages.push(languageResult[i].language_id);
  }
  slpData.selectedLanguages = selectedLanguages;

  return slpData;
}


/**
 * Update an SLP record to change just a particular status value
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateStatus(req, res) {
  let transaction;
    try {
      transaction = await db.beginTransaction("ENTA");
      const params = new Map();
      const professionalId = req.body.professionalId;
  
      params.set("id", professionalId);
      //Set the actual value we're changing, for the appropriate status field
      params.set(req.body.field, req.body.status);
  
      let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessional`, transaction, params);
  
      let userContext = req.userContext;
      let oldData = {id: professionalId, [req.body.field]: req.body.oldStatus};
      let newData = {id: professionalId, [req.body.field]: req.body.status};
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

/**
 * Fully update an SLP and child records
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateSLP(req, res) {
  let slpData = JSON.parse(req.body.slpData);
  const originalSLPData = JSON.parse(req.body.originalSLPData);
  const userContext = req.userContext;

  if (req.file) {
    slpData.image_file = process.env.UPLOAD_FILE_SERVE_PATH + process.env.AUDIOLOGIST_FILE_PATH + "/" + req.file.filename;
  }

  const updateParams = new Map();

  const allowedKeys = [
    "id",
    "type",
    "first_name",
    "middle_name",
    "last_name",
    "credential",
    "biography",
    "phone",
    "email",
    "image_file",
    "vanity_url",
    "seo_title",
    "seo_description",
    "seo_keywords",
    "professional_short_name",
    "NPI",
    "is_active"
  ];

  for (const key of allowedKeys) {
    if (slpData[key] !== undefined && slpData[key] !== null) {
      updateParams.set(key, slpData[key]);
    }
  }
  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessional`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(SLPData, updateResult.recordsets[0]);
    let updatedSLPData = updateResultData[0];

    /** Start Language Updates */
    //Check current language data for SLP
    let languageResultData = await fetchSLPLanguages(slpData.id, transaction);

    //Determine which languages are newly added, and which need to be removed
    const languageResultIds = new Set(languageResultData.map(obj => obj.language_id));

    const languageAddList = [];
    const languageRemoveList = [];
    
    slpData.selectedLanguages.forEach(id => {
      if (!languageResultIds.has(id)) {
        languageAddList.push(id);
      }
    });

    for (let i = 0; i < languageAddList.length; i++) {
      const languageAddParams = new Map();
      languageAddParams.set("professional_id", slpData.id);
      languageAddParams.set("language_id", languageAddList[i]);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessionalLanguage`, transaction, languageAddParams);
    }
    
    languageResultData.forEach(obj => {
      if (!slpData.selectedLanguages.includes(obj.language_id)) {
        languageRemoveList.push(obj.language_id);
      }
    });

    for (let i = 0; i < languageRemoveList.length; i++) {
      const languageRemoveParams = new Map();
      languageRemoveParams.set("id", slpData.id);
      languageRemoveParams.set("entity_primary_assoc_type", "Language");
      languageRemoveParams.set("entity_primary_assoc_val", languageRemoveList[i]);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteProfessional`, transaction, languageRemoveParams);
    }

     /** End Language Updates */

    /** Start Office Updates */
    //Check current office data for SLP
    //We have three different types of office data for Professionals, so we need to track separately
    let primaryOfficeResultData = await fetchSLPOffices(slpData.id, "Primary", transaction);
    let secondaryOfficeResultData = await fetchSLPOffices(slpData.id, "Secondary", transaction);

    //Determine which offices are newly added, and which need to be removed
    const primaryOfficeResultIds = new Set(primaryOfficeResultData.map(obj => obj.office_id));
    const secondaryOfficeResultIds = new Set(secondaryOfficeResultData.map(obj => obj.office_id));

    const officeAddList = [];
    const officeRemoveList = [];
    
    //Check offices to add
    slpData.selectedPrimaryOffices.forEach(id => {
      if (!primaryOfficeResultIds.has(id)) {
        officeAddList.push({id: id, type: "Primary"});
      }
    });
    slpData.selectedSecondaryOffices.forEach(id => {
      if (!secondaryOfficeResultIds.has(id)) {
        officeAddList.push({id: id, type: "Secondary"});
      }
    });

    for (let i = 0; i < officeAddList.length; i++) {
      const officeAddParams = new Map();
      officeAddParams.set("professional_id", slpData.id);
      officeAddParams.set("office_id", officeAddList[i].id);
      officeAddParams.set("office_association_type", officeAddList[i].type);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessionalOffice`, transaction, officeAddParams);
    }
    
    //Check offices to remove
    primaryOfficeResultData.forEach(office => {
      if (!slpData.selectedPrimaryOffices.includes(office.office_id)) {
        officeRemoveList.push({id: office.office_id, type: "Primary"});
      }
    });
    secondaryOfficeResultData.forEach(office => {
      if (!slpData.selectedSecondaryOffices.includes(office.office_id)) {
        officeRemoveList.push({id: office.office_id, type: "Secondary"});
      }
    });

    for (let i = 0; i < officeRemoveList.length; i++) {
      const officeRemoveParams = new Map();
      officeRemoveParams.set("id", slpData.id);
      officeRemoveParams.set("entity_primary_assoc_type", "Office");
      officeRemoveParams.set("entity_primary_assoc_val", officeRemoveList[i].id);
      officeRemoveParams.set("entity_secondary_assoc_type", "Office");
      officeRemoveParams.set("entity_secondary_assoc_val", officeRemoveList[i].type);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteProfessional`, transaction, officeRemoveParams);
    }
    /** End Office Updates */

    await auditService.auditUpdate(originalSLPData, slpData, ["id"], auditService.Sections.PROFESSIONALS, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return slpData;
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
 * Insert records for a new SLP
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function addSLP(req, res) {
  let slpData = JSON.parse(req.body.slpData);
  const userContext = req.userContext;

  if (req.file) {
    slpData.image_file = process.env.UPLOAD_FILE_SERVE_PATH + process.env.AUDIOLOGIST_FILE_PATH + "/" + req.file.filename;
  }

  const updateParams = new Map();

  const allowedKeys = [
    "id",
    "first_name",
    "middle_name",
    "last_name",
    "credential",
    "biography",
    "phone",
    "email",
    "image_file",
    "vanity_url",
    "seo_title",
    "seo_description",
    "seo_keywords",
    "professional_short_name",
    "NPI",
    "is_active"
  ];

  for (const key of allowedKeys) {
    if (slpData[key] !== undefined && slpData[key] !== null) {
      updateParams.set(key, slpData[key]);
    }
  }

  //Identify this as an SLP in the professionals table
  updateParams.set("type", "SLP");
  slpData.type = "SLP";

  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessional`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(SLPData, updateResult.recordsets[0]);
    let updatedSLPData = updateResultData[0];

    slpData.id = updatedSLPData.professional_id;

    /** Start Language Updates */
    for (let i = 0; i < slpData.selectedLanguages.length; i++) {
      const languageAddParams = new Map();
      languageAddParams.set("professional_id", slpData.id);
      languageAddParams.set("language_id", slpData.selectedLanguages[i]);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessionalLanguage`, transaction, languageAddParams);
    }
    
     /** End Language Updates */ 

    /** Start Office Updates */
    for (let i = 0; i < slpData.selectedPrimaryOffices.length; i++) {
      const officeAddParams = new Map();
      officeAddParams.set("professional_id", slpData.id);
      officeAddParams.set("office_id", slpData.selectedPrimaryOffices[i]);
      officeAddParams.set("office_association_type", "Primary");
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessionalOffice`, transaction, officeAddParams);
    }
    for (let i = 0; i < slpData.selectedSecondaryOffices.length; i++) {
      const officeAddParams = new Map();
      officeAddParams.set("professional_id", slpData.id);
      officeAddParams.set("office_id", slpData.selectedSecondaryOffices[i]);
      officeAddParams.set("office_association_type", "Secondary");
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessionalOffice`, transaction, officeAddParams);
    }
    /** End Office Updates */

    await auditService.auditNew(slpData, ["id"], auditService.Sections.PROFESSIONALS, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return slpData;
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
 * Delete record for a specific SLP
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function deleteSLP(req, res) {
  const params = new Map();
  const professionalId = req.body.professionalId;

  let transaction;
    try {
      let userContext = req.userContext;
      transaction = await db.beginTransaction("ENTA");
      params.set("id", professionalId);
  
      //With a delete call we have not already got the data available, so we need to retrieve it first to see what it was before deletion
      let oldData = await loadSLP(req, res);
  
      let deleteResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteProfessional`, transaction, params);
  
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

/* Helper functions for retrieving lists of data associated with an SLP */

/**
 * Get the list of Languages associated with an SLP
 * @param {number} slpId 
 * @param {object} transaction 
 * @returns {Promise<Array>}
 */
 async function fetchSLPLanguages(slpId, transaction = null) {
  const languageParams = new Map();
  languageParams.set("professional_id", slpId);
  languageParams.set("language_id", 0);

  const languageResult = transaction
    ? await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_GetProfessionalLanguages`, transaction, languageParams)
    : await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetProfessionalLanguages`, "ENTA", languageParams);

  const languageResultData = (0, plainToInstance)(SLPLanguageData, languageResult.recordsets[0]);

  return languageResultData;
}

/**
 * Get the list of Offices associated with an SLP
 * @param {number} slpId 
 * @param {object} transaction 
 * @returns {Promise<Array>}
 */
async function fetchSLPOffices(slpId, associationType, transaction = null) {
  const officeParams = new Map();
  officeParams.set("professional_id", slpId);
  officeParams.set("office_id", 0);
  officeParams.set("office_association_type", associationType)

  const officeResult = transaction
    ? await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_GetProfessionalOffices`, transaction, officeParams)
    : await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetProfessionalOffices`, "ENTA", officeParams);

  const officeResultData = (0, plainToInstance)(SLPOfficeData, officeResult.recordsets[0]);

  return officeResultData;
}

module.exports = wrapServiceFunctions({
  slps,
  loadSLP,
  updateSLP,
  addSLP,
  updateStatus,
  deleteSLP,
  fetchSLPLanguages,
  fetchSLPOffices
}, "slp-details.service");
