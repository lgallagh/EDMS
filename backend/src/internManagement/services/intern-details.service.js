const { plainToInstance } = require("class-transformer");
const logger = require("winston");
const wrapServiceFunctions = require("../../shared/middleware/service-wrapper.middleware");
const db = require("../../shared/services/db.service");
const InternData = require("../models/intern.model");
const InternOfficeData = require("../models/intern-office.model");
const auditService = require("../../shared/services/audit.service");

/**
 * Retrieve list of Interns
 */
async function interns(req, res) {
    const params = new Map();

    params.set("type", "I");
    params.set("order_by", "last_name");
    params.set("sort_by", "ASC");
    const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetProfessionalList`, "ENTA", params);
    let doctorData = (0, plainToInstance)(InternData, result.recordsets[0]);
    return doctorData;
}

/**
 * Load data for a particular Intern by ID
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function loadIntern(req, res) {
  const params = new Map();
  const internId = req.body.professionalId;

  params.set("id", internId);
  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetProfessionalList`, "ENTA", params);
  let resultData = (0, plainToInstance)(InternData, result.recordsets[0]);
  let internData = resultData[0];

  //Load Office data for Intern
  const primaryOfficeResult = await fetchInternOffices(internId, "Primary");
  let selectedPrimaryOffices = [];
  for (let i = 0; i < primaryOfficeResult.length; i++) {
    selectedPrimaryOffices.push(primaryOfficeResult[i].office_id);
  }
  internData.selectedPrimaryOffices = selectedPrimaryOffices;

  const secondaryOfficeResult = await fetchInternOffices(internId, "Secondary");
  let selectedSecondaryOffices = [];
  for (let i = 0; i < secondaryOfficeResult.length; i++) {
    selectedSecondaryOffices.push(secondaryOfficeResult[i].office_id);
  }
  internData.selectedSecondaryOffices = selectedSecondaryOffices;

  return internData;
}


/**
 * Update an Intern record to change just a particular status value
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateStatus(req, res) {
  let transaction;
      try {
        transaction = await db.beginTransaction("ENTA");
        const params = new Map();
        const professionalId = req.body.professionalId;
    
        params.set("id", professionalId);
        //Set the actual value we're changing, for the appropriate status field
        params.set(req.body.field, req.body.status);
    
        let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessional`, transaction, params);
    
        let userContext = req.userContext;
        let oldData = {id: professionalId, [req.body.field]: req.body.oldStatus};
        let newData = {id: professionalId, [req.body.field]: req.body.status};
        await auditService.auditUpdate(oldData, newData, ["id"], auditService.Sections.PROFESSIONALS, userContext.username, transaction);
    
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
 * Fully update an Intern and child records
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateIntern(req, res) {
  let internData = JSON.parse(req.body.internData);
  const originalInternData = JSON.parse(req.body.originalInternData);
  const userContext = req.userContext;

  if (req.file) {
    internData.image_file = process.env.UPLOAD_FILE_SERVE_PATH + process.env.AUDIOLOGIST_FILE_PATH + "/" + req.file.filename;
  }

  const updateParams = new Map();

  const allowedKeys = [
    "id",
    "type",
    "first_name",
    "middle_name",
    "last_name",
    "phone",
    "email",
    "is_active"
  ];

  for (const key of allowedKeys) {
    if (internData[key] !== undefined && internData[key] !== null) {
      updateParams.set(key, internData[key]);
    }
  }
  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessional`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(InternData, updateResult.recordsets[0]);
    let updatedInternData = updateResultData[0];

    /** Start Office Updates */
    //Check current office data for Intern
    //We have three different types of office data for Professionals, so we need to track separately
    let primaryOfficeResultData = await fetchInternOffices(internData.id, "Primary", transaction);
    let secondaryOfficeResultData = await fetchInternOffices(internData.id, "Secondary", transaction);

    //Determine which offices are newly added, and which need to be removed
    const primaryOfficeResultIds = new Set(primaryOfficeResultData.map(obj => obj.office_id));
    const secondaryOfficeResultIds = new Set(secondaryOfficeResultData.map(obj => obj.office_id));

    const officeAddList = [];
    const officeRemoveList = [];
    
    //Check offices to add
    internData.selectedPrimaryOffices.forEach(id => {
      if (!primaryOfficeResultIds.has(id)) {
        officeAddList.push({id: id, type: "Primary"});
      }
    });
    internData.selectedSecondaryOffices.forEach(id => {
      if (!secondaryOfficeResultIds.has(id)) {
        officeAddList.push({id: id, type: "Secondary"});
      }
    });

    for (let i = 0; i < officeAddList.length; i++) {
      const officeAddParams = new Map();
      officeAddParams.set("professional_id", internData.id);
      officeAddParams.set("office_id", officeAddList[i].id);
      officeAddParams.set("office_association_type", officeAddList[i].type);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessionalOffice`, transaction, officeAddParams);
    }
    
    //Check offices to remove
    primaryOfficeResultData.forEach(office => {
      if (!internData.selectedPrimaryOffices.includes(office.office_id)) {
        officeRemoveList.push({id: office.office_id, type: "Primary"});
      }
    });
    secondaryOfficeResultData.forEach(office => {
      if (!internData.selectedSecondaryOffices.includes(office.office_id)) {
        officeRemoveList.push({id: office.office_id, type: "Secondary"});
      }
    });

    for (let i = 0; i < officeRemoveList.length; i++) {
      const officeRemoveParams = new Map();
      officeRemoveParams.set("id", internData.id);
      officeRemoveParams.set("entity_primary_assoc_type", "Office");
      officeRemoveParams.set("entity_primary_assoc_val", officeRemoveList[i].id);
      officeRemoveParams.set("entity_secondary_assoc_type", "Office");
      officeRemoveParams.set("entity_secondary_assoc_val", officeRemoveList[i].type);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteProfessional`, transaction, officeRemoveParams);
    }
    /** End Office Updates */

    await auditService.auditUpdate(originalInternData, internData, ["id"], auditService.Sections.PROFESSIONALS, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return internData;
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
 * Insert records for a new Intern
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function addIntern(req, res) {
  let internData = JSON.parse(req.body.internData);
  const userContext = req.userContext;

  if (req.file) {
    internData.image_file = process.env.UPLOAD_FILE_SERVE_PATH + process.env.AUDIOLOGIST_FILE_PATH + "/" + req.file.filename;
  }

  const updateParams = new Map();

  const allowedKeys = [
    "id",
    "first_name",
    "middle_name",
    "last_name",
    "phone",
    "email",
    "is_active"
  ];

  for (const key of allowedKeys) {
    if (internData[key] !== undefined && internData[key] !== null) {
      updateParams.set(key, internData[key]);
    }
  }

  //Identify this as an Intern in the professionals table
  updateParams.set("type", "I");
  internData.type = "I";

  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessional`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(InternData, updateResult.recordsets[0]);
    let updatedInternData = updateResultData[0];

    internData.id = updatedInternData.professional_id;


    /** Start Office Updates */
    for (let i = 0; i < internData.selectedPrimaryOffices.length; i++) {
      const officeAddParams = new Map();
      officeAddParams.set("professional_id", internData.id);
      officeAddParams.set("office_id", internData.selectedPrimaryOffices[i]);
      officeAddParams.set("office_association_type", "Primary");
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessionalOffice`, transaction, officeAddParams);
    }
    for (let i = 0; i < internData.selectedSecondaryOffices.length; i++) {
      const officeAddParams = new Map();
      officeAddParams.set("professional_id", internData.id);
      officeAddParams.set("office_id", internData.selectedSecondaryOffices[i]);
      officeAddParams.set("office_association_type", "Secondary");
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveProfessionalOffice`, transaction, officeAddParams);
    }
    /** End Office Updates */

    await auditService.auditNew(internData, ["id"], auditService.Sections.PROFESSIONALS, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return internData;
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
 * Delete record for a specific Intern
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function deleteIntern(req, res) {
  const params = new Map();
  const professionalId = req.body.professionalId;

  let transaction;
      try {
        let userContext = req.userContext;
        transaction = await db.beginTransaction("ENTA");
        params.set("id", professionalId);
    
        //With a delete call we have not already got the data available, so we need to retrieve it first to see what it was before deletion
        let oldData = await loadIntern(req, res);
    
        let deleteResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteProfessional`, transaction, params);
    
        await auditService.auditDelete(oldData, ["id"], auditService.Sections.PROFESSIONALS, userContext.username, transaction);
    
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

/* Helper functions for retrieving lists of data associated with an Intern */

/**
 * Get the list of Offices associated with an Intern
 * @param {number} internId 
 * @param {object} transaction 
 * @returns {Promise<Array>}
 */
async function fetchInternOffices(internId, associationType, transaction = null) {
  const officeParams = new Map();
  officeParams.set("professional_id", internId);
  officeParams.set("office_id", 0);
  officeParams.set("office_association_type", associationType)

  const officeResult = transaction
    ? await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_GetProfessionalOffices`, transaction, officeParams)
    : await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetProfessionalOffices`, "ENTA", officeParams);

  const officeResultData = (0, plainToInstance)(InternOfficeData, officeResult.recordsets[0]);

  return officeResultData;
}

module.exports = wrapServiceFunctions({
  interns,
  loadIntern,
  updateIntern,
  addIntern,
  updateStatus,
  deleteIntern,
  fetchInternOffices
}, "intern-details.service");
