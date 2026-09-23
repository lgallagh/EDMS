const { plainToInstance } = require("class-transformer");
const logger = require("winston");
const wrapServiceFunctions = require("../../shared/middleware/service-wrapper.middleware");
const db = require("../../shared/services/db.service");
const CMSContentData = require("../models/cms-content.model");
const auditService = require("../../shared/services/audit.service");

/**
 * Retrieve list of CMS Pages
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function contentList(req, res) {
    const params = new Map();

    params.set("order_by", "created");
    params.set("sort_by", "ASC");
    const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetCMSPagesList`, "ENTA", params);
    let doctorData = (0, plainToInstance)(CMSContentData, result.recordsets[0]);
    return doctorData;
}

/**
 * Load data for a particular CMS Page by ID
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function loadCMSContent(req, res) {
  const params = new Map();
  const cmsId = req.body.cmsId;

  params.set("id", cmsId);
  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetCMSPagesList`, "ENTA", params);
  let resultData = (0, plainToInstance)(CMSContentData, result.recordsets[0]);
  let cmsData = resultData[0];

  return cmsData;
}


/**
 * Update a CMS record to change just a particular status value
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateStatus(req, res) {
  let transaction;
    try {
      transaction = await db.beginTransaction("ENTA");
      const params = new Map();
      const cmsId = req.body.cmsId;
  
      params.set("id", cmsId);
      //Set the actual value we're changing, for the appropriate status field
      params.set(req.body.field, req.body.status);
  
      let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveCMSPages`, transaction, params);
  
      let userContext = req.userContext;
      let oldData = {id: cmsId, [req.body.field]: req.body.oldStatus};
      let newData = {id: cmsId, [req.body.field]: req.body.status};
      await auditService.auditUpdate(oldData, newData, ["id"], auditService.Sections.CMS, userContext.username, transaction);
  
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
 * Fully update a CMS entry
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateCMSContent(req, res) {
  let cmsData = JSON.parse(req.body.cmsData);
  const originalCMSData = JSON.parse(req.body.originalCMSData);
  const userContext = req.userContext;

  if (req.file) {
    cmsData.banner_image = process.env.UPLOAD_FILE_SERVE_PATH + process.env.BANNER_FILE_PATH + "/" + req.file.filename;
  }

  const updateParams = new Map();

  const allowedKeys = [
    "id",
    "title",
    "banner_image",
    "blurb",
    "content",
    "vanity_url",
    "seo_title",
    "seo_description",
    "seo_keywords",
    "is_active"
  ];

  for (const key of allowedKeys) {
    if (cmsData[key] !== undefined && cmsData[key] !== null) {
      updateParams.set(key, cmsData[key]);
    }
  }
  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveCMSPages`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(CMSContentData, updateResult.recordsets[0]);
    let updatedCMSData = updateResultData[0];

    await auditService.auditUpdate(originalCMSData, cmsData, ["id"], auditService.Sections.CMS, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return cmsData;
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
 * Insert records for a new CMS Page
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function addCMSContent(req, res) {
  let cmsData = JSON.parse(req.body.cmsData);
  const userContext = req.userContext;

  if (req.file) {
    cmsData.banner_image = process.env.UPLOAD_FILE_SERVE_PATH + process.env.BANNER_FILE_PATH + "/" + req.file.filename;
  }

  const updateParams = new Map();

  const allowedKeys = [
    "id",
    "title",
    "banner_image",
    "blurb",
    "content",
    "vanity_url",
    "seo_title",
    "seo_description",
    "seo_keywords",
    "is_active"
  ];

  for (const key of allowedKeys) {
    if (cmsData[key] !== undefined && cmsData[key] !== null) {
      updateParams.set(key, cmsData[key]);
    }
  }

  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveCMSPages`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(CMSContentData, updateResult.recordsets[0]);
    let updatedCMSData = updateResultData[0];

    cmsData.id = updatedCMSData.id;

    await auditService.auditNew(cmsData, ["id"], auditService.Sections.CMS, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return cmsData;
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
 * Delete record for a specific CMS Page
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function deleteCMSContent(req, res) {
  const params = new Map();
  const cmsId = req.body.cmsId;

  let transaction;
    try {
      let userContext = req.userContext;
      transaction = await db.beginTransaction("ENTA");
      params.set("id", cmsId);
  
      //With a delete call we have not already got the data available, so we need to retrieve it first to see what it was before deletion
      let oldData = await loadCMSContent(req, res);
  
      let deleteResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteCMSPage`, transaction, params);
  
      await auditService.auditDelete(oldData, ["id"], auditService.Sections.CMS, userContext.username, transaction);
  
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
  contentList,
  loadCMSContent,
  updateCMSContent,
  addCMSContent,
  updateStatus,
  deleteCMSContent
}, "cms-content.service");
