const { plainToInstance } = require("class-transformer");
const logger = require("winston");
const wrapServiceFunctions = require("../../shared/middleware/service-wrapper.middleware");
const db = require("../../shared/services/db.service");
const AudiologistData = require("../models/audiologist.model");
const AudiologistLanguageData = require("../models/audiologist-language.model");
const AudiologistOfficeData = require("../models/audiologist-office.model");
const auditService = require("../../shared/services/audit.service");

/**
 * Retrieve list of Audiologists
 */
async function audiologists(req, res) {
    const params = new Map();

    params.set("type", "A");
    params.set("order_by", "last_name");
    params.set("sort_by", "ASC");
    const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetProfessionalList`, "ENTA", params);
    let doctorData = (0, plainToInstance)(AudiologistData, result.recordsets[0]);
    return doctorData;
}

/**
 * Load data for a particular Audiologist by ID
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function loadAudiologist(req, res) {
  const params = new Map();
  const audiologistId = req.body.professionalId;

  params.set("id", audiologistId);
  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetProfessionalList`, "ENTA", params);
  let resultData = (0, plainToInstance)(AudiologistData, result.recordsets[0]);
  let audiologistData = resultData[0];

  //Load Office data for Audiologist
  const primaryOfficeResult = await fetchAudiologistOffices(audiologistId, "Primary");
  let selectedPrimaryOffices = [];
  for (let i = 0; i < primaryOfficeResult.length; i++) {
    selectedPrimaryOffices.push(primaryOfficeResult[i].office_id);
  }
  audiologistData.selectedPrimaryOffices = selectedPrimaryOffices;

  const secondaryOfficeResult = await fetchAudiologistOffices(audiologistId, "Secondary");
  let selectedSecondaryOffices = [];
  for (let i = 0; i < secondaryOfficeResult.length; i++) {
    selectedSecondaryOffices.push(secondaryOfficeResult[i].office_id);
  }
  audiologistData.selectedSecondaryOffices = selectedSecondaryOffices;

  const floatingOfficeResult = await fetchAudiologistOffices(audiologistId, "Floating");
  let selectedFloatingOffices = [];
  for (let i = 0; i < floatingOfficeResult.length; i++) {
    selectedFloatingOffices.push(floatingOfficeResult[i].office_id);
  }
  audiologistData.selectedFloatingOffices = selectedFloatingOffices;

  //Load Language data for Audiologist
  const languageResult = await fetchAudiologistLanguages(audiologistId);
  let selectedLanguages = [];
  for (let i = 0; i < languageResult.length; i++) {
    selectedLanguages.push(languageResult[i].language_id);
  }
  audiologistData.selectedLanguages = selectedLanguages;

  return audiologistData;
}


/**
 * Update an Audiologist record to change just a particular status value
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateStatus(req, res) {
  const params = new Map();
  const professionalId = req.body.professionalId;

  params.set("id", professionalId);
  //Set the actual value we're changing, for the appropriate status field
  params.set(req.body.field, req.body.status);

  let transaction;
      try {
        transaction = await db.beginTransaction("ENTA");
        let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessional`, transaction, params);
  
        let userContext = req.userContext;
        let oldData = {id: req.body.serviceId, [req.body.field]: req.body.oldStatus};
        let newData = {id: req.body.serviceId, [req.body.field]: req.body.status};
        await auditService.auditUpdate(oldData, newData, ["id"], auditService.Sections.AUDIOLOGIST, userContext.username, transaction);
  
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
 * Fully update an Audiologist and child records
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateAudiologist(payload, file) {
  const audiologistData = payload.audiologistData;
  const originalAudiologistData = payload.originalAudiologistData;
  const userContext = payload.userContext;

  if (file) {
    audiologistData.image_file = process.env.UPLOAD_FILE_SERVE_PATH + process.env.AUDIOLOGIST_FILE_PATH + "/" + file.filename;
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
    "is_active",
    "display_in_website",
    "maiden_name",
    "employment_status"
  ];

  for (const key of allowedKeys) {
    if (audiologistData[key] !== undefined && audiologistData[key] !== null) {
      updateParams.set(key, audiologistData[key]);
    }
  }
  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessional`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(AudiologistData, updateResult.recordsets[0]);
    let updatedAudiologistData = updateResultData[0];

    /** Start Language Updates */
    //Check current language data for Audiologist
    let languageResultData = await fetchAudiologistLanguages(audiologistData.id, transaction);

    //Determine which languages are newly added, and which need to be removed
    const languageResultIds = new Set(languageResultData.map(obj => obj.language_id));

    const languageAddList = [];
    const languageRemoveList = [];
    
    audiologistData.selectedLanguages.forEach(id => {
      if (!languageResultIds.has(id)) {
        languageAddList.push(id);
      }
    });

    for (let i = 0; i < languageAddList.length; i++) {
      const languageAddParams = new Map();
      languageAddParams.set("professional_id", audiologistData.id);
      languageAddParams.set("language_id", languageAddList[i]);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessionalLanguage`, transaction, languageAddParams);
    }
    
    languageResultData.forEach(obj => {
      if (!audiologistData.selectedLanguages.includes(obj.language_id)) {
        languageRemoveList.push(obj.language_id);
      }
    });

    for (let i = 0; i < languageRemoveList.length; i++) {
      const languageRemoveParams = new Map();
      languageRemoveParams.set("id", audiologistData.id);
      languageRemoveParams.set("entity_primary_assoc_type", "Language");
      languageRemoveParams.set("entity_primary_assoc_val", languageRemoveList[i]);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteProfessional`, transaction, languageRemoveParams);
    }

     /** End Language Updates */

    /** Start Office Updates */
    //Check current office data for Audiologist
    //We have three different types of office data for Professionals, so we need to track separately
    let primaryOfficeResultData = await fetchAudiologistOffices(audiologistData.id, "Primary", transaction);
    let secondaryOfficeResultData = await fetchAudiologistOffices(audiologistData.id, "Secondary", transaction);
    let floatingOfficeResultData = await fetchAudiologistOffices(audiologistData.id, "Floating", transaction);

    //Determine which offices are newly added, and which need to be removed
    const primaryOfficeResultIds = new Set(primaryOfficeResultData.map(obj => obj.office_id));
    const secondaryOfficeResultIds = new Set(secondaryOfficeResultData.map(obj => obj.office_id));
    const floatingOfficeResultIds = new Set(floatingOfficeResultData.map(obj => obj.office_id));

    const officeAddList = [];
    const officeRemoveList = [];
    
    //Check offices to add
    audiologistData.selectedPrimaryOffices.forEach(id => {
      if (!primaryOfficeResultIds.has(id)) {
        officeAddList.push({id: id, type: "Primary"});
      }
    });
    //If coming in via the Import, we may not have secondary/floating offices
    if(audiologistData.selectedSecondaryOffices) {
      audiologistData.selectedSecondaryOffices.forEach(id => {
        if (!secondaryOfficeResultIds.has(id)) {
          officeAddList.push({id: id, type: "Secondary"});
        }
      });
    }
    if(audiologistData.selectedFloatingOffices) {
      audiologistData.selectedFloatingOffices.forEach(id => {
        if (!floatingOfficeResultIds.has(id)) {
          officeAddList.push({id: id, type: "Floating"});
        }
      });
    }

    for (let i = 0; i < officeAddList.length; i++) {
      const officeAddParams = new Map();
      officeAddParams.set("professional_id", audiologistData.id);
      officeAddParams.set("office_id", officeAddList[i].id);
      officeAddParams.set("office_association_type", officeAddList[i].type);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessionalOffice`, transaction, officeAddParams);
    }
    
    //Check offices to remove
    primaryOfficeResultData.forEach(office => {
      if (!audiologistData.selectedPrimaryOffices.includes(office.office_id)) {
        officeRemoveList.push({id: office.office_id, type: "Primary"});
      }
    });
    //If coming in via the Import, we may not have secondary/floating offices. Since they aren't being specified, we don't want to lose whatever is currently there
    if(audiologistData.selectedSecondaryOffices) {
      secondaryOfficeResultData.forEach(office => {
        if (!audiologistData.selectedSecondaryOffices.includes(office.office_id)) {
          officeRemoveList.push({id: office.office_id, type: "Secondary"});
        }
      });
    }
    if(audiologistData.selectedFloatingOffices) {
      floatingOfficeResultData.forEach(office => {
        if (!audiologistData.selectedFloatingOffices.includes(office.office_id)) {
          officeRemoveList.push({id: office.office_id, type: "Floating"});
        }
      });
    }

    for (let i = 0; i < officeRemoveList.length; i++) {
      const officeRemoveParams = new Map();
      officeRemoveParams.set("id", audiologistData.id);
      officeRemoveParams.set("entity_primary_assoc_type", "Office");
      officeRemoveParams.set("entity_primary_assoc_val", officeRemoveList[i].id);
      officeRemoveParams.set("entity_secondary_assoc_type", "Office");
      officeRemoveParams.set("entity_secondary_assoc_val", officeRemoveList[i].type);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteProfessional`, transaction, officeRemoveParams);
    }
    /** End Office Updates */

    await auditService.auditUpdate(originalAudiologistData, audiologistData, ["id"], auditService.Sections.AUDIOLOGIST, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return audiologistData;
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
 * Insert records for a new Audiologist
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function addAudiologist(payload, file) {
  const audiologistData = payload.audiologistData;
  const userContext = payload.userContext;

  if (file) {
    audiologistData.image_file = process.env.UPLOAD_FILE_SERVE_PATH + process.env.AUDIOLOGIST_FILE_PATH + "/" + file.filename;
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
    "is_active",
    "display_in_website",
    "maiden_name",
    "employment_status"
  ];

  for (const key of allowedKeys) {
    if (audiologistData[key] !== undefined && audiologistData[key] !== null) {
      updateParams.set(key, audiologistData[key]);
    }
  }

  //Identify this as an Audiologist in the professionals table
  updateParams.set("type", "A");

  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessional`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(AudiologistData, updateResult.recordsets[0]);
    let updatedAudiologistData = updateResultData[0];

    audiologistData.id = updatedAudiologistData.professional_id;

    /** Start Language Updates */
    for (let i = 0; i < audiologistData.selectedLanguages.length; i++) {
      const languageAddParams = new Map();
      languageAddParams.set("professional_id", audiologistData.id);
      languageAddParams.set("language_id", audiologistData.selectedLanguages[i]);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessionalLanguage`, transaction, languageAddParams);
    }
    
     /** End Language Updates */ 

    /** Start Office Updates */
    for (let i = 0; i < audiologistData.selectedPrimaryOffices.length; i++) {
      const officeAddParams = new Map();
      officeAddParams.set("professional_id", audiologistData.id);
      officeAddParams.set("office_id", audiologistData.selectedPrimaryOffices[i]);
      officeAddParams.set("office_association_type", "Primary");
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessionalOffice`, transaction, officeAddParams);
    }
    //If coming in via the Import, we may not have secondary/floating offices
    if(audiologistData.selectedSecondaryOffices) {
      for (let i = 0; i < audiologistData.selectedSecondaryOffices.length; i++) {
        const officeAddParams = new Map();
        officeAddParams.set("professional_id", audiologistData.id);
        officeAddParams.set("office_id", audiologistData.selectedSecondaryOffices[i]);
        officeAddParams.set("office_association_type", "Secondary");
        await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessionalOffice`, transaction, officeAddParams);
      }
    }
    if(audiologistData.selectedFloatingOffices) {
      for (let i = 0; i < audiologistData.selectedFloatingOffices.length; i++) {
        const officeAddParams = new Map();
        officeAddParams.set("professional_id", audiologistData.id);
        officeAddParams.set("office_id", audiologistData.selectedFloatingOffices[i]);
        officeAddParams.set("office_association_type", "PriFloatingmary");
        await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessionalOffice`, transaction, officeAddParams);
      }
    }
    /** End Office Updates */

    await auditService.auditNew(audiologistData, ["id"], auditService.Sections.AUDIOLOGIST, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return audiologistData;
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
 * Delete record for a specific Audiologist
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function deleteAudiologist(req, res) {
  const params = new Map();
  const professionalId = req.body.professionalId;

  params.set("id", professionalId);

  let transaction;
    try {
      let userContext = req.userContext;
      transaction = await db.beginTransaction("ENTA");
  
      //With a delete call we have not already got the data available, so we need to retrieve it first to see what it was before deletion
      let oldData = await loadAudiologist(req, res);
  
      let deleteResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteProfessional`, transaction, params);
  
      await auditService.auditDelete(oldData, ["id"], auditService.Sections.AUDIOLOGIST, userContext.username, transaction);
  
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

/* Helper functions for retrieving lists of data associated with an Audiologist */

/**
 * Get the list of Languages associated with an Audiologist
 * @param {number} audiologistId 
 * @param {object} transaction 
 * @returns {Promise<Array>}
 */
 async function fetchAudiologistLanguages(audiologistId, transaction = null) {
  const languageParams = new Map();
  languageParams.set("professional_id", audiologistId);
  languageParams.set("language_id", 0);

  const languageResult = transaction
    ? await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_GetProfessionalLanguages`, transaction, languageParams)
    : await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetProfessionalLanguages`, "ENTA", languageParams);

  const languageResultData = (0, plainToInstance)(AudiologistLanguageData, languageResult.recordsets[0]);

  return languageResultData;
}

/**
 * Get the list of Offices associated with an Audiologist
 * @param {number} audiologistId 
 * @param {object} transaction 
 * @returns {Promise<Array>}
 */
async function fetchAudiologistOffices(audiologistId, associationType, transaction = null) {
  const officeParams = new Map();
  officeParams.set("professional_id", audiologistId);
  officeParams.set("office_id", 0);
  officeParams.set("office_association_type", associationType)

  const officeResult = transaction
    ? await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_GetProfessionalOffices`, transaction, officeParams)
    : await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetProfessionalOffices`, "ENTA", officeParams);

  const officeResultData = (0, plainToInstance)(AudiologistOfficeData, officeResult.recordsets[0]);

  return officeResultData;
}

module.exports = wrapServiceFunctions({
  audiologists,
  loadAudiologist,
  updateAudiologist,
  addAudiologist,
  updateStatus,
  deleteAudiologist,
  fetchAudiologistLanguages,
  fetchAudiologistOffices
}, "audiologist-details.service");
