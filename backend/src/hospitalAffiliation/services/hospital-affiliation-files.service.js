const logger = require("winston");
const wrapServiceFunctions = require("../../shared/middleware/service-wrapper.middleware");
const db = require("../../shared/services/db.service");
const hospitalAffiliationService = require("./hospital-affiliation.service");
const fs = require("fs");
const ExcelJS = require('exceljs');
const excelExporter = require("../../shared/util/excel-exporter.util")


/**
 * Export an Excel spreadsheet of Hospital Affiliations
 * 
 * @param {*} req 
 * @param {*} res 
 */
async function exportHospitalAffiliations(req, res) {
  const params = new Map();

  params.set("order_by", "hospital_name");
  params.set("sort_by", "ASC");
  const procResult = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorHospital`, "ENTA", params);
  const hospitalAffiliations = procResult.recordsets[0];


  const columns = [
    { key: 'hospital_name', header: 'Hospital' },
    { key: 'NPI', header: 'NPI' },
    { key: 'doctor', header: 'Doctor' },
    { key: 'privilege_start_date', header: 'Start Date' },
    { key: 'privilege_end_date', header: 'End Date' },
    { key: 'staff_status', header: 'Status' }
  ];

  await excelExporter.exportAndSend(hospitalAffiliations, columns, 'Hospital Affiliation List', res, 'hospital_affiliation_list.xlsx');
}



module.exports = wrapServiceFunctions({
  exportHospitalAffiliations
}, "hospital-affiliation-files.service");
