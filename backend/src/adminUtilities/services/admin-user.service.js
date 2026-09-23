const { plainToInstance } = require("class-transformer");
const logger = require("winston");
const db = require("../../shared/services/db.service");
const AdminUserData = require("../models/admin-user.model");
const LocationData = require("../models/language.model");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const vCard = require("vcards-js");
const { v4: uuidv4 } = require("uuid");
const auditService = require("../../shared/services/audit.service");

/**
 * Retrieve list of Admin Users
 */
async function adminUsers(req, res) {
    const params = new Map();
    //const username = req.body.username;

    params.set("order_by", "username");
    params.set("sort_by", "ASC");
    const result = await db.storedProc("usp_CMS_GetUserList", "ENTA", params);
    let adminUserData = (0, plainToInstance)(AdminUserData, result.recordsets[0]);
    return adminUserData;
}

/**
 * Load data for a particular admin user by ID
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
 async function loadAdminUser(req, res) {
  const params = new Map();
  const adminUserId = req.body.adminUserId;

  params.set("id", adminUserId);
  const result = await db.storedProc(`usp_CMS_GetUserList`, "ENTA", params);
  let resultData = (0, plainToInstance)(AdminUserData, result.recordsets[0]);
  let adminUserData = resultData[0];

  return adminUserData;
}



/**
 * Update a adminUser record to change just a particular status value
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateStatus(req, res) {
  const params = new Map();
  const id = req.body.id;

  params.set("id", id);
  //Set the actual value we're changing, for the appropriate status field
  params.set(req.body.field, req.body.status);

  let transaction;
      try {
        transaction = await db.beginTransaction("ENTA");
        let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveUser`, transaction, params);
  
        let userContext = req.userContext;
        let oldData = {id: req.body.serviceId, [req.body.field]: req.body.oldStatus};
        let newData = {id: req.body.serviceId, [req.body.field]: req.body.status};
        await auditService.auditUpdate(oldData, newData, ["id"], auditService.Sections.USERS, userContext.username, transaction);
  
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

async function updateAdminUser(req, res) {

  let adminUserData = req.body.adminUserData;
  const originalAdminUserData = req.body.originalAdminUserData;
  const userContext = req.userContext;

  console.log("adminUserData:"+adminUserData)

  const allowedKeys = [
    "id",
    "username",
    "password",
    "section",
    "status",
    "privilege"
 
  ];
  await saveAdminUser(allowedKeys,adminUserData, originalAdminUserData, userContext)
}

async function addAdminUser(req, res) {

  let adminUserData = req.body.adminUserData;
  const userContext = req.userContext;
  console.log("adminUserData:"+adminUserData)

  const allowedKeys = [
    "username",
    "password",
    "section",
    "status",
    "privilege"
 
  ];
  await saveAdminUser(allowedKeys,adminUserData, null, userContext)
}

async function saveAdminUser(allowedKeys, adminUserData, originalAdminUserData, userContext) {

  console.log("adminUserData:"+adminUserData)
  const updateParams = new Map();

  for (const key of allowedKeys) {
    if (adminUserData[key] !== undefined && adminUserData[key] !== null) {
      updateParams.set(key, adminUserData[key]);
    }
  }
  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await await db.executeInTransaction("usp_CMS_SaveUser", transaction, updateParams);
    console.log("Result:", JSON.stringify(updateResult, null, 2));
    let updateResultData = (0, plainToInstance)(AdminUserData, updateResult.recordsets[0]);
    let updatedAdminUserData = updateResultData[0];
    
    if(adminUserData.id) {
      await auditService.auditUpdate(originalAdminUserData, adminUserData, ["id"], auditService.Sections.USERS, userContext.username, transaction);
    } else {
      adminUserData.id = updatedAdminUserData.user_id;
      await auditService.auditNew(adminUserData, ["id"], auditService.Sections.USERS, userContext.username, transaction);
    }
    
    await db.commitTransaction(transaction);

    return adminUserData;
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
 * Delete record for a specific adminUser
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function deleteAdminUser(req, res) {
  const params = new Map();
  const adminUserId = req.body.adminUserId;
  console.log("delete user id:"+adminUserId);

  let transaction;
    try {
      let userContext = req.userContext;
      transaction = await db.beginTransaction("ENTA");
      params.set("id", adminUserId);
  
      //With a delete call we have not already got the data available, so we need to retrieve it first to see what it was before deletion
      let oldData = await loadAdminUser(req, res);
  
      let deleteResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteUser`, transaction, params);
  
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






module.exports = {
  adminUsers,
  loadAdminUser,
  updateAdminUser,
  updateStatus,
  deleteAdminUser,
  addAdminUser
};
