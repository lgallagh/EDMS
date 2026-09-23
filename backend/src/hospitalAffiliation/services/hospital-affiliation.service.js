const { plainToInstance } = require("class-transformer");
const logger = require("winston");
const wrapServiceFunctions = require("../../shared/middleware/service-wrapper.middleware");
const db = require("../../shared/services/db.service");
const HospitalAffiliationData = require("../models/hospital-affiliation.model");
const auditService = require("../../shared/services/audit.service");

/**
 * Retrieve list of Hospital Affiliations
 */
async function hospitalAffiliations(req, res) {
    const params = new Map();

    const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorHospital`, "ENTA", params);
    let hospitalAffiliationData = (0, plainToInstance)(HospitalAffiliationData, result.recordsets[0]);
    return hospitalAffiliationData;
}

/**
 * Load data for a particular Hospital Affiliation by ID
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function loadHospitalAffiliation(req, res) {
  const params = new Map();
  const hospitalAffiliationId = req.body.hospitalAffiliationId;

  params.set("id", hospitalAffiliationId);
  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorHospital`, "ENTA", params);
  let resultData = (0, plainToInstance)(HospitalAffiliationData, result.recordsets[0]);
  let hospitalAffiliationData = resultData[0];

  return hospitalAffiliationData;
}


/**
 * Fully update a Hospital Affiliation record
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateHospitalAffiliation(req, res) {
  let hospitalAffiliationData = req.body.hospitalAffiliationData;
  const originalHospitalAffiliationData = req.body.originalHospitalAffiliationData;
  const userContext = req.userContext;

  const updateParams = new Map();

  const allowedKeys = [
    "id",
    "doctor_id",
    "hospital_id",
    "staff_status"
  ];

  for (const key of allowedKeys) {
    if (hospitalAffiliationData[key] !== undefined && hospitalAffiliationData[key] !== null) {
      updateParams.set(key, hospitalAffiliationData[key]);
    }
  }

  updateParams.set("start_date", hospitalAffiliationData["privilege_start_date"]);
  updateParams.set("end_date", hospitalAffiliationData["privilege_end_date"]);

  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctorHospital`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(HospitalAffiliationData, updateResult.recordsets[0]);
    let updatedHospitalAffiliationData = updateResultData[0];

    await auditService.auditUpdate(originalHospitalAffiliationData, hospitalAffiliationData, ["id"], auditService.Sections.HOSPITALS, userContext.username, transaction);
   
    await db.commitTransaction(transaction);

    return hospitalAffiliationData;
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
 * Insert records for a new Hospital Affiliation
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function addHospitalAffiliation(req, res) {
  let hospitalAffiliationData = req.body.hospitalAffiliationData;
  const userContext = req.userContext

  const updateParams = new Map();

  const allowedKeys = [
    "id",
    "doctor_id",
    "hospital_id",
    "staff_status"
  ];
  
  for (const key of allowedKeys) {
    if (hospitalAffiliationData[key] !== undefined && hospitalAffiliationData[key] !== null) {
      updateParams.set(key, hospitalAffiliationData[key]);
    }
  }

  updateParams.set("start_date", hospitalAffiliationData["privilege_start_date"]);
  updateParams.set("end_date", hospitalAffiliationData["privilege_end_date"]);

  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctorHospital`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(HospitalAffiliationData, updateResult.recordsets[0]);
    let updatedHospitalAffiliationData = updateResultData[0];

    hospitalAffiliationData.id = updatedHospitalAffiliationData.id;

    await auditService.auditNew(hospitalAffiliationData, ["id"], auditService.Sections.HOSPITALS, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return hospitalAffiliationData;
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
 * Delete record for a specific Hospital Affiliation
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function deleteHospitalAffiliation(req, res) {
  const params = new Map();
  const hospitalAffiliationId = req.body.hospitalAffiliationId;

  let transaction;
        try {
          let userContext = req.userContext;
          transaction = await db.beginTransaction("ENTA");
          params.set("id", hospitalAffiliationId);
      
          //With a delete call we have not already got the data available, so we need to retrieve it first to see what it was before deletion
          let oldData = await loadHospitalAffiliation(req, res);
      
          let deleteResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteDoctorHospital`, transaction, params);
      
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
  hospitalAffiliations,
  loadHospitalAffiliation,
  updateHospitalAffiliation,
  addHospitalAffiliation,
  deleteHospitalAffiliation
}, "hospital-affiliation.service");
