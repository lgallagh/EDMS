const { plainToInstance } = require("class-transformer");
const logger = require("winston");
const db = require("../../shared/services/db.service");
const CountyData = require("../models/county.model");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const vCard = require("vcards-js");
const { v4: uuidv4 } = require("uuid");
const auditService = require("../../shared/services/audit.service");


/**
 * Retrieve list of Countys
 */
 async function counties(req, res) {
  const params = new Map();

 
  const result = await db.storedProc("usp_CMS_GetCountiesList", "ENTA", params);
  let countyData = (0, plainToInstance)(CountyData, result.recordsets[0]);
  return countyData;
}

/**
 * Load data for a particular county by ID
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
 async function loadCounty(req, res) {
  const params = new Map();
  const countyId = req.body.countyId;

  params.set("id", countyId);
  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetCountiesList`, "ENTA", params);
  let resultData = (0, plainToInstance)(CountyData, result.recordsets[0]);
  let countyData = resultData[0];

  return countyData;
}

/**
 * Delete record for a specific county
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
 async function deleteCounty(req, res) {
  const params = new Map();
  const countyId = req.body.countyId;

  let transaction;
    try {
      let userContext = req.userContext;
      transaction = await db.beginTransaction("ENTA");
      params.set("id", countyId);
  
      //With a delete call we have not already got the data available, so we need to retrieve it first to see what it was before deletion
      let oldData = await loadCounty(req, res);
  
      let deleteResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteCounty`, transaction, params);
  
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


async function updateCounty(req, res) {

  let countyData = req.body.countyData;
  const originalCountyData = req.body.originalCountyData;
  const userContext = req.userContext;
  console.log("countyData:"+countyData)
  const updateParams = new Map();

  const allowedKeys = [
    "id",
    "state",
    "display_name",
    "vanity_url",
    "seo_title",
    "seo_description",
    "seo_keywords"
 
  ];

  for (const key of allowedKeys) {
    if (countyData[key] !== undefined && countyData[key] !== null) {
      updateParams.set(key, countyData[key]);
    }
  }
  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await await db.executeInTransaction("usp_CMS_SaveCounties", transaction, updateParams);
    let updateResultData = (0, plainToInstance)(CountyData, updateResult.recordsets[0]);
    console.log("Result:", JSON.stringify(updateResult, null, 2));
    let updatedcountyData = updateResultData[0];


    if(countyData.id) {
      await auditService.auditUpdate(originalCountyData, countyData, ["id"], auditService.Sections.OFFICE, userContext.username, transaction);
    } else {
      countyData.id = updatedcountyData.id;
      await auditService.auditNew(countyData, ["id"], auditService.Sections.DOCTOR, userContext.username, transaction);
    }

    await db.commitTransaction(transaction);

    return countyData;
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
  updateCounty,
  deleteCounty,
  counties,
  loadCounty
};
