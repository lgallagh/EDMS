const { plainToInstance } = require("class-transformer");
const logger = require("winston");
const db = require("../../shared/services/db.service");
const OfficeWiseAlertData = require("../models/office-wise-alert.model");
const listService = require("../../shared/services/list.service");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const vCard = require("vcards-js");
const { v4: uuidv4 } = require("uuid");
const auditService = require("../../shared/services/audit.service");




/**
 * Retrieve list of OfficeWiseAlerts
 */
 async function officeWiseAlerts(req, res) {
  const params = new Map();

    const result = await db.storedProc("usp_CMS_GetOfficeWiseAlerts", "ENTA", params);
    let officeWiseAlertData = (0, plainToInstance)(OfficeWiseAlertData, result.recordsets[0]);

    // Await officeService.offices() if it returns a Promise
    const officeData = await listService.officeList();

    // Ensure officeData is an array
    if (!Array.isArray(officeData)) {
        throw new Error("officeData is not an array");
    }

    // Convert officeData array into a Map for quick lookups
    const officeDataMap = new Map(officeData.map(office => [office.id, office.office_name]));

    // Add office_name to officeWiseData using office_id
    const updatedOfficeWiseData = officeWiseAlertData.map(officeWise => ({
        ...officeWise,
        office_name: officeDataMap.get(officeWise.office_id) || null // Default to null if no match found
    }));

    console.log(updatedOfficeWiseData);
    return updatedOfficeWiseData;
}

/**
 * Load data for a particular officeWiseAlert by ID
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
 async function loadOfficeWiseAlert(req, res) {
  const params = new Map();
  const officeWiseAlertId = req.body.officeWiseAlertId;

  params.set("id", officeWiseAlertId);
  const result = await db.storedProc(`usp_CMS_GetOfficeWiseAlerts`, "ENTA", params);
  let resultData = (0, plainToInstance)(OfficeWiseAlertData, result.recordsets[0]);
  let officeWiseAlertData = resultData[0];

  return officeWiseAlertData;
}

/**
 * Delete record for a specific officeWiseAlert
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
 async function deleteOfficeWiseAlert(req, res) {
  const params = new Map();
  const officeWiseAlertId = req.body.officeWiseAlertId;

  let transaction;
      try {
        let userContext = req.userContext;
        transaction = await db.beginTransaction("ENTA");
        params.set("id", officeWiseAlertId);
    
        //With a delete call we have not already got the data available, so we need to retrieve it first to see what it was before deletion
        let oldData = await loadOfficeWiseAlert(req);
    
        let deleteResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteOfficeWiseAlert`, transaction, params);
    
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


async function updateOfficeWiseAlert(req, res) {

  let officeWiseAlertData = req.body.officeWiseAlertData;
  console.log("officeWiseAlertData:"+officeWiseAlertData)
  const originalOfficeWiseAlertData = req.body.originalOfficeWiseAlertData;
  const userContext = req.userContext;
  const updateParams = new Map();

  const allowedKeys = [
    "id",
    "office_id",
    "message",
    "start_time",
    "end_time",
    "status"
  ];

  for (const key of allowedKeys) {
    if (officeWiseAlertData[key] !== undefined && officeWiseAlertData[key] !== null) {
      updateParams.set(key, officeWiseAlertData[key]);
    }
  }
  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await await db.executeInTransaction("usp_CMS_SaveOfficeWiseAlert", transaction, updateParams);
    //let updateResultData = (0, plainToInstance)(officeWiseAlertData, updateResult.recordsets[0]);
    console.log("Result:", JSON.stringify(updateResult, null, 2));
    //let updatedofficeWiseAlertData = updateResultData[0];

    await auditService.auditUpdate(originalOfficeWiseAlertData, officeWiseAlertData, ["id"], auditService.Sections.OFFICE, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return officeWiseAlertData;
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


async function updateStatus(req, res) {
  let transaction;
      try {
        transaction = await db.beginTransaction("ENTA");
        const params = new Map();
        const officeId = req.body.id;
    
        params.set("id", officeId);
        //Set the actual value we're changing, for the appropriate status field
        params.set(req.body.field, req.body.status);
    
        let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveOfficeWiseAlert`, transaction, params);
    
        let userContext = req.userContext;
        let oldData = {id: req.body.id, [req.body.field]: req.body.oldStatus};
        let newData = {id: req.body.id, [req.body.field]: req.body.status};
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

async function addOfficeWiseAlert(req, res) {

  let officeWiseAlertData = req.body.officeWiseAlertData;
  const userContext = req.userContext;
  console.log("officeWiseAlertData:"+officeWiseAlertData)
  const updateParams = new Map();

  const allowedKeys = [
    "office_id",
    "message",
    "start_time",
    "end_time",
    "status"
  ];

  for (const key of allowedKeys) {
    if (officeWiseAlertData[key] !== undefined && officeWiseAlertData[key] !== null) {
      updateParams.set(key, officeWiseAlertData[key]);
    }
  }
  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await await db.executeInTransaction("usp_CMS_SaveOfficeWiseAlert", transaction, updateParams);
    let updateResultData = (0, plainToInstance)(officeWiseAlertData, updateResult.recordsets[0]);
    console.log("Result:", JSON.stringify(updateResult, null, 2));
    let updatedofficeWiseAlertData = updateResultData[0];

    officeWiseAlertData.id = updatedofficeWiseAlertData.id;
    
    await auditService.auditNew(officeWiseAlertData, ["id"], auditService.Sections.OFFICE, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return officeWiseAlertData;
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
  updateOfficeWiseAlert,
  deleteOfficeWiseAlert,
  officeWiseAlerts,
  loadOfficeWiseAlert,
  addOfficeWiseAlert,
  updateStatus,
  addOfficeWiseAlert
};
