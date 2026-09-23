const { plainToInstance } = require("class-transformer");
const logger = require("winston");
const wrapServiceFunctions = require("../../shared/middleware/service-wrapper.middleware");
const db = require("../../shared/services/db.service");
const { OfficeListEntry } = require("../models/office-list.model");
const { LanguageListEntry } = require("../models/language-list.model")
const { DoctorListEntry } = require("../models/doctor-list.model");
const { HospitalListEntry } = require("../models/hospital-list.model");
const { CountyListEntry } = require("../models/county-list.model");
const { InsurancePlanListEntry } = require("../models/insurance-plan-list.model");
const { ProviderListEntry } = require("../models/provider-list.model");
const { StateListEntry} = require("../models/state-list.model");
/**
 * Retrieve list of Offices to populate select field on multiple pages
 */
async function officeList(req, res) {
    const params = new Map();

    //params.set("is_active", "Y");
    params.set("order_by", "office_name");
    params.set("sort_by", "ASC");
    const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetOfficeList`, "ENTA", params);
    let officeData = (0, plainToInstance)(OfficeListEntry, result.recordsets[0]);
    return officeData;
}

/**
 * Retrieve list of Languages to populate select field on multiple pages
 */
 async function languageList(req, res) {
    const params = new Map();

    const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetLanguageList`, "ENTA", params);
    let languageData = (0, plainToInstance)(LanguageListEntry, result.recordsets[0]);
    return languageData;
}


/**
 * Retrieve list of Doctors to populate select field on multiple pages
 */
 async function doctorList(req, res) {
  const params = new Map();

  params.set("order_by", "doctor_first_name");
  params.set("sort_by", "ASC");
  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorList`, "ENTA", params);
  let doctorData = (0, plainToInstance)(DoctorListEntry, result.recordsets[0]);
  return doctorData;
}

/**
 * Retrieve list of Hospitals to populate select field on multiple pages
 */
 async function hospitalList(req, res) {
  const params = new Map();

  params.set("order_by", "hospital_name");
  params.set("sort_by", "ASC");
  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetHospitalList`, "ENTA", params);
  let hospitalData = (0, plainToInstance)(HospitalListEntry, result.recordsets[0]);
  return hospitalData;
}

/**
 * Retrieve list of Counties to populate select field on multiple pages
 */
 async function countyList(req, res) {
  const params = new Map();

  //params.set("is_active", "Y");
  params.set("order_by", "display_name");
  params.set("sort_by", "ASC");
  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetCountiesList`, "ENTA", params);
  let countyData = (0, plainToInstance)(CountyListEntry, result.recordsets[0]);
  return countyData;
}

/**
 * Retrieve list of Providers to populate select field on multiple pages
 */
 async function providerList(req, res) {
  const params = new Map();
  const type = req.query.type;
  console.log(`Provider List Type: ${type}`);
  let result;
  if(type!=='doctor'){
    params.set("order_by", "first_name");
    params.set("sort_by", "ASC");
    result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetProfessionalList`, "ENTA", params);
    let providerData = (0, plainToInstance)(ProviderListEntry, result.recordsets[0]);
    return providerData;
  }else{
    params.set("order_by", "doctor_first_name");
    params.set("sort_by", "ASC");
    result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorList`, "ENTA", params);
    let providerData = (0, plainToInstance)(ProviderListEntry, result.recordsets[0]);
    return providerData;
  }
  
}

/**
 * Retrieve list of Insurance Plans to populate select field on multiple pages
 */
 async function insurancePlanList(req, res) {
  const params = new Map();

  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetInsurancesPlan`, "ENTA", params);
  let insurancePlanData = (0, plainToInstance)(InsurancePlanListEntry, result.recordsets[0]);
  return insurancePlanData;
}

/**
 * Retrieve list of States to populate select field on multiple pages
 */
 async function stateList(req, res) {
  const params = new Map();

  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetStates`, "ENTA", params);
  let stateData = (0, plainToInstance)(StateListEntry, result.recordsets[0]);
  return stateData;
}

module.exports = wrapServiceFunctions({
  officeList,
  languageList,
  doctorList,
  hospitalList,
  countyList,
  providerList,
  insurancePlanList,
  stateList
}, "list.service.js");
