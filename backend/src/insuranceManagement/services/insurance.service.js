const { plainToInstance } = require("class-transformer");
const logger = require("winston");
const wrapServiceFunctions = require("../../shared/middleware/service-wrapper.middleware");
const db = require("../../shared/services/db.service");

const InsuranceData = require("../models/insurance.model");
const InsuranceStateData = require("../models/insurance-state.model");
const InsurancePlanData = require("../models/insurance-plan.model");
const auditService = require("../../shared/services/audit.service");

/**
 * Retrieve list of Insurances
 */
async function insurances(req, res) {
    const params = new Map();

   // params.set("type", "MD");
   // params.set("order_by", "insurance_last_name");
   // params.set("sort_by", "ASC");
    const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetInsurancesList`, "ENTA", params);
    let insuranceData = (0, plainToInstance)(InsuranceData, result.recordsets[0]);
    return insuranceData;
}

/**
 * Load data for a particular insurance by ID
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function loadInsurance(req, res) {
  const params = new Map();
  const insuranceId = req.body.insuranceId;

  params.set("id", insuranceId);
  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetInsurancesList`, "ENTA", params);
  let resultData = (0, plainToInstance)(InsuranceData, result.recordsets[0]);

  let insuranceData = resultData[0];

  //Get Insurance States
  insuranceData.states = await loadInsuranceStates(insuranceId);
  insuranceData.selectedStateCodes = insuranceData.states.map(state => state.state_code);

  //Get Insurance Plans
  insuranceData.plans = await loadInsurancePlans(insuranceId);   
  insuranceData.selectedPlans = insuranceData.plans; 
  return insuranceData;
}

/**
 * Load data for a particular insurance by ID
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
 async function loadInsuranceStates(insuranceId) {
  const params = new Map();

  params.set("insurance_id", insuranceId);
  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetInsurancesState`, "ENTA", params);
  let resultData = (0, plainToInstance)(InsuranceStateData, result.recordsets[0]);

  let insuranceData = resultData;



  return insuranceData;
}

/**
 * Load data for a particular insurance by ID
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
 async function loadInsurancePlans(insuranceId) {
  const params = new Map();
  params.set("insurance_id", insuranceId);
  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetInsurancesPlan`, "ENTA", params);
  let resultData = (0, plainToInstance)(InsurancePlanData, result.recordsets[0]);

  let insuranceData = resultData;



  return insuranceData;
}


/**
 * Update a Insurance record to change just a particular status value
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateStatus(req, res) {
  let transaction;
    try {
      transaction = await db.beginTransaction("ENTA");
      const params = new Map();
      const insuranceId = req.body.insuranceId;
  
      params.set("id", insuranceId);
      //Set the actual value we're changing, for the appropriate status field
      params.set(req.body.field, req.body.status);
  
      let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveInsurances`, transaction, params);
  
      let userContext = req.userContext;
      let oldData = {id: req.body.insuranceId, [req.body.field]: req.body.oldStatus};
      let newData = {id: req.body.insuranceId, [req.body.field]: req.body.status};
      await auditService.auditUpdate(oldData, newData, ["id"], auditService.Sections.INSURANCES, userContext.username, transaction);
  
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

async function updateInsurance(req, res) {
  let insuranceData = req.body.insuranceData;
  const originalInsuranceData = req.body.originalInsuranceData;
  const userContext = req.userContext;
  let updateParams = new Map();

  const allowedKeys = [
    "id",
    "insurance_name"
  ];

  for (const key of allowedKeys) {
    if (insuranceData[key] !== undefined && insuranceData[key] !== null) {
      updateParams.set(key, insuranceData[key]);
    }
  }
  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveInsurances`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(InsuranceData, updateResult.recordsets[0]);
    let updatedInsuranceData = updateResultData[0];

    /** Start State Updates */
    // Delete States missing from Selected States
    const currentStateCodes = insuranceData.states.map(state => state.state_code);
    const statesToDelete = currentStateCodes.filter(stateCode => !insuranceData.selectedStateCodes.includes(stateCode));

    if (statesToDelete.length > 0) {
        for (const stateCode of statesToDelete) {
          updateParams = new Map();
          updateParams.set("insurance_id", insuranceData.id);
          updateParams.set("state_code", stateCode);

          await db.executeInTransaction(
              `usp_${process.env.PROC_PREFIX}_DeleteInsurancesState`, 
              transaction, updateParams);
        }
    }

    // Insert States missing in States
    const statesToInsert = insuranceData.selectedStateCodes.filter(stateCode => !currentStateCodes.includes(stateCode));

    if (statesToInsert.length > 0) {
        for (const stateCode of statesToInsert) {
          updateParams = new Map();
          updateParams.set("insurance_id", insuranceData.id);
          updateParams.set("state_code", stateCode);
          await db.executeInTransaction(
              `usp_${process.env.PROC_PREFIX}_SaveInsurancesState`, 
              transaction, 
              updateParams
          );
        }
    }

    /** Start Plan Updates */
    // Delete Plans missing from Selected Plans
    const currentPlanIds = insuranceData.plans.map(plan => plan.plan_id);
    if(insuranceData.plans != undefined || insuranceData.plans != null){
      
      const plansToDelete = currentPlanIds.filter(planId => !insuranceData.selectedPlans.some(p => p.plan_id === planId));

      if (plansToDelete.length > 0) {
          for (const planId of plansToDelete) {
            updateParams = new Map();
            updateParams.set("id", planId);
              await db.executeInTransaction(
                  `usp_${process.env.PROC_PREFIX}_DeleteInsurancePlan`, 
                  transaction, 
                  updateParams
              );
          }
      }
    
      // Update Plans where Plan Names don’t match
      if(insuranceData.selectedPlans != undefined || insuranceData.selectedPlans != null){
        for (const plan of insuranceData.selectedPlans) {
            const existingPlan = insuranceData.plans.find(p => p.plan_id === plan.plan_id);
            if (existingPlan && existingPlan.plan_name !== plan.plan_name) {
              updateParams = new Map();
              updateParams.set("insurance_id", insuranceData.id);
              updateParams.set("plan_id", plan.plan_id);
              updateParams.set("plan_name",plan.plan_name)
              await db.executeInTransaction(
                  `usp_${process.env.PROC_PREFIX}_SaveInsurancesPlan`, 
                  transaction, 
                  updateParams
              );
            }
        }
    }
      // Insert Plans missing in Plans
      const plansToInsert = insuranceData.selectedPlans.filter(plan => !currentPlanIds.includes(plan.plan_id));

      if (plansToInsert.length > 0) {
          for (const plan of plansToInsert) {
            if(plan.plan_name != undefined && plan.plan_name != null && plan.plan_name != "" ){
              updateParams = new Map();
              updateParams.set("insurance_id", insuranceData.id);
              updateParams.set("plan_name", plan.plan_name);
              await db.executeInTransaction(
                  `usp_${process.env.PROC_PREFIX}_SaveInsurancesPlan`, 
                  transaction, 
                updateParams
              );
            }
          }
      }
    }

    await auditService.auditUpdate(originalInsuranceData, insuranceData, ["id"], auditService.Sections.INSURANCES, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return insuranceData;
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

async function addInsurance(req, res) {
  let insuranceData = req.body.insuranceData;
  const userContext = req.userContext;
  let updateParams = new Map();
  console.log(`Insurance to Update: ${JSON.stringify(insuranceData)}`)
  updateParams.set("insurance_name", insuranceData.insurance_name);

  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveInsurances`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(InsuranceData, updateResult.recordsets[0]);
    let updatedInsuranceData = updateResultData[0];
    console.log(`Updated Insurance Data ${JSON.stringify(updatedInsuranceData)}`)
    /** Start State Updates */
    // Insert States missing in States
    insuranceData.id = updatedInsuranceData.id
    if (insuranceData.selectedStateCodes.length > 0) {
        for (const stateCode of insuranceData.selectedStateCodes) {
          updateParams = new Map();
          updateParams.set("insurance_id", insuranceData.id);
          updateParams.set("state_code", stateCode);
          await db.executeInTransaction(
              `usp_${process.env.PROC_PREFIX}_SaveInsurancesState`, 
              transaction, 
              updateParams
          );
        }
    }

    /** Start Plan Inserts */
    // Insert Plans missing in Plans

    if (insuranceData.selectedPlans.length > 0) {
        for (const plan of insuranceData.selectedPlans) {
          updateParams = new Map();
          updateParams.set("insurance_id", insuranceData.id);
          updateParams.set("plan_name", plan.plan_name);
          await db.executeInTransaction(
              `usp_${process.env.PROC_PREFIX}_SaveInsurancesPlan`, 
              transaction, 
             updateParams
          );
        }
    }

    await auditService.auditNew(insuranceData, ["id"], auditService.Sections.INSURANCES, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return insuranceData;
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
 * Delete record for a specific insurance
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function deleteInsurance(req, res) {
  const params = new Map();
  const insuranceId = req.body.insuranceId;

  let transaction;
    try {
      let userContext = req.userContext;
      transaction = await db.beginTransaction("ENTA");
      params.set("insurance_id", insuranceId);
  
      //With a delete call we have not already got the data available, so we need to retrieve it first to see what it was before deletion
      let oldData = await loadInsurance(req, res);
  
      let deleteResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteInsurance`, transaction, params);
  
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

/* Helper functions for retrieving lists of data associated with a Insurance */









module.exports = wrapServiceFunctions({
  insurances,
  loadInsurance,
  updateInsurance,
  addInsurance,
  updateStatus,
  deleteInsurance,
}, "insurance.service");
