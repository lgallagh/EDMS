const { plainToInstance } = require("class-transformer");
const logger = require("winston");
const wrapServiceFunctions = require("../../shared/middleware/service-wrapper.middleware");
const db = require("../../shared/services/db.service");
const EmailTemplateData = require("../models/email-template.model");
const auditService = require("../../shared/services/audit.service");

/**
 * Retrieve list of Email Templates
 */
async function emailTemplates(req, res) {
    const params = new Map();

    const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetEmailTemplates`, "ENTA", params);
    let doctorData = (0, plainToInstance)(EmailTemplateData, result.recordsets[0]);
    return doctorData;
}

/**
 * Load data for a particular Email Template by ID
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function loadEmailTemplate(req, res) {
  const params = new Map();
  const emailTemplateId = req.body.emailTemplateId;

  params.set("id", emailTemplateId);
  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetEmailTemplates`, "ENTA", params);
  let resultData = (0, plainToInstance)(EmailTemplateData, result.recordsets[0]);
  let emailTemplateData = resultData[0];

  return emailTemplateData;
}


/**
 * Update an Email Template record to change just a particular status value
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateStatus(req, res) {
  let transaction;
      try {
        transaction = await db.beginTransaction("ENTA");
        const params = new Map();
        const emailTemplateId = req.body.emailTemplateId;
    
        params.set("id", emailTemplateId);
        //Set the actual value we're changing, for the appropriate status field
        params.set(req.body.field, req.body.status);
    
        let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveEmailTemplate`, transaction, params);
    
        let userContext = req.userContext;
        let oldData = {id: emailTemplateId, [req.body.field]: req.body.oldStatus};
        let newData = {id: emailTemplateId, [req.body.field]: req.body.status};
        await auditService.auditUpdate(oldData, newData, ["id"], auditService.Sections.EMAIL, userContext.username, transaction);
    
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
 * Fully update an Email Template
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateEmailTemplate(req, res) {
  let emailTemplateData = req.body.emailTemplateData;
  const originalEmailTemplateData = req.body.originalEmailTemplateData;
  const userContext = req.userContext;

  const updateParams = new Map();

  const allowedKeys = [
    "id",
    "title",
    "subject_line",
    "body_text",
    "to_person",
    "from_person",
    "cc",
    "is_active",
    "email_type"
  ];

  for (const key of allowedKeys) {
    if (emailTemplateData[key] !== undefined && emailTemplateData[key] !== null) {
      updateParams.set(key, emailTemplateData[key]);
    }
  }
  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveEmailTemplate`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(EmailTemplateData, updateResult.recordsets[0]);
    let updatedEmailTemplateData = updateResultData[0];

    await auditService.auditUpdate(originalEmailTemplateData, emailTemplateData, ["id"], auditService.Sections.EMAIL, userContext.username, transaction);
   
    await db.commitTransaction(transaction);

    return emailTemplateData;
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
 * Insert records for a new Email Template
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function addEmailTemplate(req, res) {
  let emailTemplateData = req.body.emailTemplateData;
  const userContext = req.userContext;

  const updateParams = new Map();

  const allowedKeys = [
    "title",
    "subject_line",
    "body_text",
    "to_person",
    "from_person",
    "cc",
    "is_active",
    "email_type"
  ];

  for (const key of allowedKeys) {
    if (emailTemplateData[key] !== undefined && emailTemplateData[key] !== null) {
      updateParams.set(key, emailTemplateData[key]);
    }
  }

  updateParams.set("is_deleted", "N");

  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveEmailTemplate`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(EmailTemplateData, updateResult.recordsets[0]);
    let updatedEmailTemplateData = updateResultData[0];

    emailTemplateData.id = updatedEmailTemplateData.id;

    await auditService.auditNew(emailTemplateData, ["id"], auditService.Sections.EMAIL, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return emailTemplateData;
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
 * Delete record for a specific Email Template
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function deleteEmailTemplate(req, res) {
  const params = new Map();
  const emailTemplateId = req.body.emailTemplateId;

  let transaction;
      try {
        let userContext = req.userContext;
        transaction = await db.beginTransaction("ENTA");
        params.set("id", emailTemplateId);
    
        //With a delete call we have not already got the data available, so we need to retrieve it first to see what it was before deletion
        let oldData = await loadEmailTemplate(req, res);
    
        let deleteResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteEmailTemplate`, transaction, params);
    
        await auditService.auditDelete(oldData, ["id"], auditService.Sections.EMAIL, userContext.username, transaction);
    
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


module.exports = wrapServiceFunctions({
  emailTemplates,
  loadEmailTemplate,
  updateEmailTemplate,
  addEmailTemplate,
  updateStatus,
  deleteEmailTemplate
}, "cms-email-template.service");
