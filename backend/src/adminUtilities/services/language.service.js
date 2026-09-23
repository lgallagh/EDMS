const { plainToInstance } = require("class-transformer");
const logger = require("winston");
const db = require("../../shared/services/db.service");
const LanguageData = require("../models/language.model");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const vCard = require("vcards-js");
const { v4: uuidv4 } = require("uuid");
const auditService = require("../../shared/services/audit.service");


/**
 * Retrieve list of Languages
 */
 async function languages(req, res) {
  const params = new Map();

 
  const result = await db.storedProc("usp_CMS_GetLanguages", "ENTA", params);
  let languageData = (0, plainToInstance)(LanguageData, result.recordsets[0]);
  return languageData;
}

/**
 * Load data for a particular language by ID
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
 async function loadLanguage(req, res) {
  const params = new Map();
  const languageId = req.body.languageId;

  params.set("id", languageId);
  const result = await db.storedProc(`usp_CMS_GetLanguages`, "ENTA", params);
  let resultData = (0, plainToInstance)(LanguageData, result.recordsets[0]);
  let languageData = resultData[0];

  return languageData;
}

/**
 * Delete record for a specific language
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
 async function deleteLanguage(req, res) {
  const params = new Map();
  const languageId = req.body.languageId;

  let transaction;
      try {
        let userContext = req.userContext;
        transaction = await db.beginTransaction("ENTA");
        params.set("id", languageId);
    
        //With a delete call we have not already got the data available, so we need to retrieve it first to see what it was before deletion
        let oldData = await loadLanguage(req, res);
    
        let deleteResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteLanguage`, transaction, params);
    
        await auditService.auditDelete(oldData, ["id"], auditService.Sections.USERS, userContext.username, transaction);
    
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


async function updateLanguage(req, res) {

  let languageData = req.body.languageData;
  const originalLanguageData = req.body.originalLanguageData;
  const userContext = req.userContext;
  console.log("languageData:"+JSON.stringify(languageData))
  const updateParams = new Map();

  const allowedKeys = [
    {name:"id", value:"id"},
    {name:"language_name", value:"language"},
    {name:"vanity_url", value:"vanity_url"}
   
  ];

  for (const key of allowedKeys) {
    if (languageData[key.value] !== undefined || languageData[key.value] !== null) {
      updateParams.set(key.name, languageData[key.value]);
    }
  }
  console.log("Params:", JSON.stringify(updateParams, null, 2));

  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await await db.executeInTransaction("usp_CMS_SaveLanguage", transaction, updateParams);
    //let updateResultData = (0, plainToInstance)(languageData, updateResult.recordsets[0]);
    console.log("Result:", JSON.stringify(updateResult, null, 2));
    //let updatedlanguageData = updateResultData[0];

    await auditService.auditUpdate(originalLanguageData, languageData, ["id"], auditService.Sections.LANGUAGES, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return languageData;
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

async function addLanguage(req, res) {

  let languageData = req.body.languageData;
  const userContext = req.userContext;
  console.log("languageData:"+JSON.stringify(languageData))
  const updateParams = new Map();

  const allowedKeys = [
    {name:"language_name", value:"language"},
    {name:"vanity_url", value:"vanity_url"}
   
  ];

  for (const key of allowedKeys) {
    if (languageData[key.value] !== undefined || languageData[key.value] !== null) {
      updateParams.set(key.name, languageData[key.value]);
    }
  }
  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await await db.executeInTransaction("usp_CMS_SaveLanguage", transaction, updateParams);
    let updateResultData = (0, plainToInstance)(LanguageData, updateResult.recordsets[0]);
    console.log("Result:", JSON.stringify(updateResult, null, 2));
    let updatedLanguageData = updateResultData[0];

    languageData.id = updatedLanguageData.language_id;
    await auditService.auditNew(languageData, ["id"], auditService.Sections.LANGUAGES, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return languageData;
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

module.exports = {
  updateLanguage,
  addLanguage,
  deleteLanguage,
  languages,
  loadLanguage
};
