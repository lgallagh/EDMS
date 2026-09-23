const { plainToInstance } = require("class-transformer");
const logger = require("winston");
const wrapServiceFunctions = require("../../shared/middleware/service-wrapper.middleware");
const db = require("../../shared/services/db.service");

const AffiliationData = require("../models/affiliation.model");
const auditService = require("../../shared/services/audit.service");

/**
 * Retrieve list of Affiliations
 */
async function affiliations(req, res) {
    const params = new Map();
    const type = req.body.type;
  
    params.set("type", type);

    const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetProviderInsurances`, "ENTA", params);
    let affiliationData = (0, plainToInstance)(AffiliationData, result.recordsets[0]);
    return affiliationData;
}

/**
 * Load data for a particular affiliation by ID
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function loadAffiliation(req, res) {
  const params = new Map();
  const affiliationId = req.body.affiliationId;
  const type = req.body.type;
  params.set("id", affiliationId);
  params.set("type", type);
  console.log(`Affiliation Parms ${JSON.stringify(params)}`)
  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetProviderInsurances`, "ENTA", params);
  let resultData = (0, plainToInstance)(AffiliationData, result.recordsets[0]);
  let affiliationData = resultData[0];

  

  return affiliationData;
}

async function updateAffiliation(req, res) {
  let affiliationData = req.body.affiliationData;
  const originalAffiliationData = req.body.originalAffiliationData;
  const userContext = req.userContext;


  const updateParams = new Map();

  const allowedKeys = [
    "id" ,
    "type",
    "provider_id" ,
    "insurance_id" ,
    "office_id" ,
    "plan_id" ,
    "provider_number" ,
    "plan_details" ,
    "starting_date" ,
    "deactivate_date" ,
  ];

  for (const key of allowedKeys) {
    if (affiliationData[key] !== undefined && affiliationData[key] !== null) {
      updateParams.set(key, affiliationData[key]);
    }
  }
  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProviderInsurance`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(AffiliationData, updateResult.recordsets[0]);

    await auditService.auditUpdate(originalAffiliationData, affiliationData, ["id"], auditService.Sections.INSURANCES, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return affiliationData;
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
 * Delete record for a specific affiliation
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function deleteAffiliation(req, res) {
  const params = new Map();
  const affiliationId = req.body.affiliationId;
  const type = req.body.type;

  let transaction;
      try {
        let userContext = req.userContext;
        transaction = await db.beginTransaction("ENTA");
        params.set("id", affiliationId);
        params.set("type", type);
    
        //With a delete call we have not already got the data available, so we need to retrieve it first to see what it was before deletion
        let oldData = await loadAffiliation(req, res);
    
        let deleteResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteProviderInsurances`, transaction, params);
    
        await auditService.auditDelete(oldData, ["id"], auditService.Sections.INSURANCES, userContext.username, transaction);
    
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
  affiliations,
  loadAffiliation,
  updateAffiliation,
  deleteAffiliation

}, "affiliation.service");
