const { plainToInstance } = require("class-transformer");
const logger = require("winston");
const db = require("../../shared/services/db.service");
const AdminUserData = require("../models/admin-user.model");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const vCard = require("vcards-js");
const { v4: uuidv4 } = require("uuid");

/**
 * Retrieve list of Admin Users
 */
async function adminUsers(req, res) {
    const params = new Map();
    //const username = req.body.username;

    params.set("order_by", "adminUser_last_name");
    params.set("sort_by", "ASC");
    const result = await db.storedProc("usp_CMS_GetUserList", "ENTA", params);
    let adminUserData = (0, plainToInstance)(AdminUserData, result.recordsets[0]);
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
  const adminUserId = req.body.adminUserId;

  params.set("id", adminUserId);
  //Set the actual value we're changing, for the appropriate status field
  params.set(req.body.field, req.body.status);

  let updateResult = await db.storedProc("usp_CMS_SaveadminUser", "ENTA", params);

  return updateResult;
}

async function updateAdminUser(req, res) {
  let adminUserData = req.body.adminUserData;
  const updateParams = new Map();

  const allowedKeys = [
    "id",
    "username",
    "password",
    "section",
    "status",
    "privilege"
 
  ];

  for (const key of allowedKeys) {
    if (adminUserData[key] !== undefined && adminUserData[key] !== null) {
      updateParams.set(key, adminUserData[key]);
    }
  }
  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await await db.executeInTransaction("usp_CMS_SaveUser", transaction, updateParams);
    let updateResultData = (0, plainToInstance)(adminUserData, updateResult.recordsets[0]);
    let updatedAdminUserData = updateResultData[0];


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

  params.set("id", adminUserId);

  let deleteResult = await db.storedProc("usp_CMS_DeleteUser", "ENTA", params);
}





module.exports = {
  adminUsers,
  updateAdminUser,
  updateStatus,
  deleteAdminUser

};
