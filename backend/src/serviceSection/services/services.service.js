const { plainToInstance } = require("class-transformer");
const logger = require("winston");
const wrapServiceFunctions = require("../../shared/middleware/service-wrapper.middleware");
const db = require("../../shared/services/db.service");
const ServiceData = require("../models/service.model");
const ServiceDoctorData = require("../models/service-doctor.model");
const auditService = require("../../shared/services/audit.service");

/**
 * Retrieve list of Services
 */
async function services(req, res) {
    const params = new Map();

    params.set("order_by", "sort_order");
    params.set("sort_by", "ASC");
    const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetServicesList`, "ENTA", params);
    let serviceData = (0, plainToInstance)(ServiceData, result.recordsets[0]);
    return serviceData;
}

/**
 * Load data for a particular Service by ID
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function loadService(req, res) {
  const params = new Map();
  const serviceId = req.body.serviceId;

  params.set("id", serviceId);
  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetServicesList`, "ENTA", params);
  let resultData = (0, plainToInstance)(ServiceData, result.recordsets[0]);
  let serviceData = resultData[0];

  //Load Doctor data for Service
  const serviceDoctorsResult = await fetchServiceDoctors(serviceId);
  let selectedDoctors = [];
  for (let i = 0; i < serviceDoctorsResult.length; i++) {
    selectedDoctors.push(serviceDoctorsResult[i].doctor_id);
  }
  serviceData.selectedDoctors = selectedDoctors;

  return serviceData;
}


/**
 * Update an Service record to change just a particular status value
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateStatus(req, res) {
  const params = new Map();
  const serviceId = req.body.serviceId;

  params.set("id", serviceId);
  //Set the actual value we're changing, for the appropriate status field
  params.set(req.body.field, req.body.status);

  let transaction;
    try {
      transaction = await db.beginTransaction("ENTA");
      let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveServices`, transaction, params);

      let userContext = req.userContext;
      let oldData = {id: req.body.serviceId, [req.body.field]: req.body.oldStatus};
      let newData = {id: req.body.serviceId, [req.body.field]: req.body.status};
      await auditService.auditUpdate(oldData, newData, ["id"], auditService.Sections.SERVICES, userContext.username, transaction);

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
 * Update the sort order for multiple Service records
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateSortOrder(req, res) {
  //Get record lists from requests
  let updatedRecords = req.body.updatedRecords;
  let originalRecords = req.body.originalRecords;

  //The order and size of original vs updated records may be different, so we build a map we can use to look up the original sort order by id
  const originalOrderMap = new Map(
    originalRecords.map(r => [r.id, r.sort_order])
  );

  let transaction;
    try {
      //Start a transaction that we will do all of the updates in
      transaction = await db.beginTransaction("ENTA");
      for(let i = 0; i < updatedRecords.length; i++) {
        const params = new Map();
        const serviceId = updatedRecords[i].id;
        const sortOrder = updatedRecords[i].sort_order;
        const oldSortOrder = originalOrderMap.get(serviceId);
        
        //Only update records where the order actually changed
        if(oldSortOrder != sortOrder) {
          params.set("id", serviceId);
          params.set("sort_order", sortOrder);
          
          let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveServices`, transaction, params);

          let userContext = req.userContext;
          let oldData = {id: serviceId, sort_order: oldSortOrder};
          let newData = {id: serviceId, sort_order: sortOrder};
          await auditService.auditUpdate(oldData, newData, ["id"], auditService.Sections.SERVICES, userContext.username, transaction);
        }
      }

      await db.commitTransaction(transaction);
      
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
 * Fully update an Service and child records
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function updateService(req, res) {
  let serviceData = JSON.parse(req.body.serviceData);
  let originalServiceData = JSON.parse(req.body.originalServiceData);
  let userContext = req.userContext;

  if (req.files && req.files.menu_image_file && req.files.menu_image_file.length > 0) {
    serviceData.menu_image = process.env.UPLOAD_FILE_SERVE_PATH + process.env.SERVICE_MENU_FILE_PATH + "/" + req.files.menu_image_file[0].filename;
  }

  if (req.files && req.files.list_image_file && req.files.list_image_file.length > 0) {
    serviceData.list_image = process.env.UPLOAD_FILE_SERVE_PATH + process.env.SERVICE_LIST_FILE_PATH + "/" + req.files.list_image_file[0].filename;
  }

  if (req.files && req.files.banner_image_file && req.files.banner_image_file.length > 0) {
    serviceData.banner_image = process.env.UPLOAD_FILE_SERVE_PATH + process.env.SERVICE_BANNER_FILE_PATH + "/" + req.files.banner_image_file[0].filename;
  }

  const updateParams = new Map();

  const allowedKeys = [
    "id",
    "service_name",
    "menu_image",
    "list_image",
    "banner_image",
    "icon_name",
    "blurb",
    "content",
    "vanity_url",
    "seo_title",
    "seo_description",
    "seo_keywords",
    "is_active",
    "sort_order"
  ];

  for (const key of allowedKeys) {
    if (serviceData[key] !== undefined && serviceData[key] !== null) {
      updateParams.set(key, serviceData[key]);
    }
  }
  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveServices`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(ServiceData, updateResult.recordsets[0]);
    let updatedServiceData = updateResultData[0];

    /** Start Doctor Updates */
    //Check current Doctor data for Service
    let doctorResultData = await fetchServiceDoctors(serviceData.id, transaction);

    //Determine which doctors are newly added, and which need to be removed
    const doctorResultIds = new Set(doctorResultData.map(obj => obj.doctor_id));

    const doctorAddList = [];
    const doctorRemoveList = [];
    
    serviceData.selectedDoctors.forEach(id => {
      if (!doctorResultIds.has(id)) {
        doctorAddList.push(id);
      }
    });

    for (let i = 0; i < doctorAddList.length; i++) {
      const doctorAddParams = new Map();
      doctorAddParams.set("service_id", serviceData.id);
      doctorAddParams.set("doctor_id", doctorAddList[i]);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctorServices`, transaction, doctorAddParams);
    }
    
    doctorResultData.forEach(obj => {
      if (!serviceData.selectedDoctors.includes(obj.doctor_id)) {
        doctorRemoveList.push(obj.doctor_id);
      }
    });

    for (let i = 0; i < doctorRemoveList.length; i++) {
      const doctorRemoveParams = new Map();
      doctorRemoveParams.set("doctor_id", doctorRemoveList[i]);
      doctorRemoveParams.set("entity_assoc_type", "Service");
      doctorRemoveParams.set("entity_assoc_val", serviceData.id);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteDoctor`, transaction, doctorRemoveParams);
    }

     /** End Doctor Updates */

     await auditService.auditUpdate(originalServiceData, serviceData, ["id"], auditService.Sections.SERVICES, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return serviceData;
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
 * Insert records for a new Service
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function addService(req, res) {
  let serviceData = JSON.parse(req.body.serviceData);
  let userContext = req.userContext;

  if (req.files && req.files.menu_image_file && req.files.menu_image_file.length > 0) {
    serviceData.menu_image = process.env.UPLOAD_FILE_SERVE_PATH + process.env.SERVICE_MENU_FILE_PATH + "/" + req.files.menu_image_file[0].filename;
  }

  if (req.files && req.files.list_image_file && req.files.list_image_file.length > 0) {
    serviceData.list_image = process.env.UPLOAD_FILE_SERVE_PATH + process.env.SERVICE_LIST_FILE_PATH + "/" + req.files.list_image_file[0].filename;
  }

  if (req.files && req.files.banner_image_file && req.files.banner_image_file.length > 0) {
    serviceData.banner_image = process.env.UPLOAD_FILE_SERVE_PATH + process.env.SERVICE_BANNER_FILE_PATH + "/" + req.files.banner_image_file[0].filename;
  }

  const updateParams = new Map();

  const allowedKeys = [
    "id",
    "service_name",
    "menu_image",
    "list_image",
    "banner_image",
    "icon_name",
    "blurb",
    "content",
    "vanity_url",
    "seo_title",
    "seo_description",
    "seo_keywords",
    "is_active",
    "sort_order"
  ];

  for (const key of allowedKeys) {
    if (serviceData[key] !== undefined && serviceData[key] !== null) {
      updateParams.set(key, serviceData[key]);
    }
  }

  let transaction;
  try {
    transaction = await db.beginTransaction("ENTA");

    let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveServices`, transaction, updateParams);
    let updateResultData = (0, plainToInstance)(ServiceData, updateResult.recordsets[0]);
    let updatedServiceData = updateResultData[0];

    serviceData.id = updatedServiceData.id;

    /** Start Doctor Updates */
    for (let i = 0; i < serviceData.selectedDoctors.length; i++) {
      const doctorAddParams = new Map();
      doctorAddParams.set("service_id", serviceData.id);
      doctorAddParams.set("doctor_id", serviceData.selectedDoctors[i]);
      await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveDoctorServices`, transaction, doctorAddParams);
    }
    
     /** End Doctor Updates */ 

     await auditService.auditNew(serviceData, ["id"], auditService.Sections.SERVICES, userContext.username, transaction);

    await db.commitTransaction(transaction);

    return serviceData;
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
 * Delete record for a specific Service
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function deleteService(req, res) {
  const params = new Map();
  const serviceId = req.body.serviceId;

  params.set("id", serviceId);

  let transaction;
    try {
      let userContext = req.userContext;
      transaction = await db.beginTransaction("ENTA");
  
      //With a delete call we have not already got the data available, so we need to retrieve it first to see what it was before deletion
      let oldData = await loadService(req, res);
  
      let deleteResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_DeleteService`, transaction, params);
  
      await auditService.auditDelete(oldData, ["id"], auditService.Sections.SERVICES, userContext.username, transaction);
  
      await db.commitTransaction(transaction);
  
      //return deleteResult;
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

/* Helper functions for retrieving lists of data associated with an Service */

/**
 * Get the list of Doctors associated with an Service
 * @param {number} serviceId 
 * @param {object} transaction 
 * @returns {Promise<Array>}
 */
 async function fetchServiceDoctors(serviceId, transaction = null) {
  const doctorParams = new Map();
  doctorParams.set("doctor_id", 0);
  doctorParams.set("service_id", serviceId);

  const doctorResult = transaction
    ? await db.executeInTransaction("usp_CMS_GetDoctorServicesList", transaction, doctorParams)
    : await db.storedProc("usp_CMS_GetDoctorServicesList", "ENTA", doctorParams);

  const doctorResultData = (0, plainToInstance)(ServiceDoctorData, doctorResult.recordsets[0]);

  return doctorResultData;
}

module.exports = wrapServiceFunctions({
  services,
  loadService,
  updateService,
  addService,
  updateStatus,
  updateSortOrder,
  deleteService,
  fetchServiceDoctors
}, "service.service");
