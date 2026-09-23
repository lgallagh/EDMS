const { plainToInstance } = require("class-transformer");
const logger = require("winston");
const wrapServiceFunctions = require("../../shared/middleware/service-wrapper.middleware");
const db = require("../../shared/services/db.service");
const HospitalData = require("../models/hospital.model");
const auditService = require("../../shared/services/audit.service");

/**
 * Retrieve list of Hospitals
 */
async function hospitals(req, res) {
    const params = new Map();

    params.set("order_by", "id");
    params.set("sort_by", "ASC");
    const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetHospitalList`, "ENTA", params);
    let hospitalData = (0, plainToInstance)(HospitalData, result.recordsets[0]);
    return hospitalData;
}

/**
 * Load data for a particular Hospital by ID
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function loadHospital(req, res) {
  const params = new Map();
  const hospitalId = req.body.hospitalId;

  params.set("id", hospitalId);
  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetHospitalList`, "ENTA", params);
  let resultData = (0, plainToInstance)(HospitalData, result.recordsets[0]);
  let hospitalData = resultData[0];

  return hospitalData;
}


/**
 * Update an Hospital record to change just a particular status value
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateStatus(req, res) {
   let transaction;
      try {
        transaction = await db.beginTransaction("ENTA");
        const params = new Map();
        const hospitalId = req.body.hospitalId;
    
        params.set("id", hospitalId);
        //Set the actual value we're changing, for the appropriate status field
        params.set(req.body.field, req.body.status);
    
        let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveHospital`, transaction, params);
    
        let userContext = req.userContext;
        let oldData = {id: hospitalId, [req.body.field]: req.body.oldStatus};
        let newData = {id: hospitalId, [req.body.field]: req.body.status};
        await auditService.auditUpdate(oldData, newData, ["id"], auditService.Sections.HOSPITALS, userContext.username, transaction);
    
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
 * Fully update a Hospital record
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateHospital(req, res) {
  let hospitalData = req.body.hospitalData;
  const originalHospitalData = req.body.originalHospitalData;
  const userContext = req.userContext;

  const updateParams = new Map();

  const allowedKeys = [
    "id",
    "hospital_name"
  ];

  for (const key of allowedKeys) {
    if (hospitalData[key] !== undefined && hospitalData[key] !== null) {
      updateParams.set(key, hospitalData[key]);
    }
  }
  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveHospital`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(HospitalData, updateResult.recordsets[0]);
    let updatedHospitalData = updateResultData[0];

    await auditService.auditUpdate(originalHospitalData, hospitalData, ["id"], auditService.Sections.HOSPITALS, userContext.username, transaction);
   
    await db.commitTransaction(transaction);

    return hospitalData;
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
 * Insert records for a new Hospital
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function addHospital(req, res) {
  let hospitalData = req.body.hospitalData;
  const userContext = req.userContext;

  const updateParams = new Map();

  const allowedKeys = [
    "id",
    "hospital_name"
  ];

  for (const key of allowedKeys) {
    if (hospitalData[key] !== undefined && hospitalData[key] !== null) {
      updateParams.set(key, hospitalData[key]);
    }
  }

  //Default to active
  updateParams.set("is_active", "Y");
  hospitalData.is_active = "Y";

  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveHospital`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(HospitalData, updateResult.recordsets[0]);
    let updatedHospitalData = updateResultData[0];

    hospitalData.id = updatedHospitalData.hospital_id;

    await auditService.auditNew(hospitalData, ["id"], auditService.Sections.HOSPITALS, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return hospitalData;
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
 * Delete record for a specific Hospital
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function deleteHospital(req, res) {
  const params = new Map();
  const hospitalId = req.body.hospitalId;

  let transaction;
      try {
        let userContext = req.userContext;
        transaction = await db.beginTransaction("ENTA");
        params.set("id", hospitalId);
    
        //With a delete call we have not already got the data available, so we need to retrieve it first to see what it was before deletion
        let oldData = await loadHospital(req, res);
    
        let deleteResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteHospital`, transaction, params);
    
        await auditService.auditDelete(oldData, ["id"], auditService.Sections.HOSPITALS, userContext.username, transaction);
    
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
  hospitals,
  loadHospital,
  updateHospital,
  addHospital,
  updateStatus,
  deleteHospital
}, "hospital-list.service");
