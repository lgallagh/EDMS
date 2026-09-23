const logger = require("winston");
const wrapServiceFunctions = require("../../shared/middleware/service-wrapper.middleware");
const db = require("../../shared/services/db.service");
const insuranceService = require("./insurance.service");
const fs = require("fs");
const path = require("path");
const ExcelJS = require('exceljs');
const archiver = require("archiver");
const { v4: uuidv4 } = require("uuid");
const excelExporter = require("../../shared/util/excel-exporter.util");
const auditService = require("../../shared/services/audit.service");


/**
 * Export an Excel spreadsheet of available Insurances
 * 
 * @param {*} req 
 * @param {*} res 
 */
async function exportInsurances(req, res) {
  const params = new Map();
  params.set("is_active", "Y");
  params.set("order_by", "insurance_last_name");
  params.set("sort_by", "ASC");
  const procResult = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetInsurancesList`, "ENTA", params);
  const insurances = procResult.recordsets[0];
  
  let enrichedInsurances = [];

  for (const insurance of insurances) {
    // Fetch insurance plans for each insurance
    const plans = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetInsurancesPlan`, "ENTA", new Map([["insurance_id", insurance.id]]));

    if (plans.recordsets[0] && plans.recordsets[0].length > 0) {
      // Expand insurance data by associating each plan
      for (const plan of plans.recordsets[0]) {
        enrichedInsurances.push({
          insurance_name: insurance.insurance_name,
          plan_name: plan.plan_name,
          is_active: insurance.is_active
        });
      }
    }
  }

  const columns = [
    { key: 'insurance_name', header: 'Insurance Name' },
    { key: 'plan_name', header: 'Plan Name' },
    { key: 'is_active', header: 'Status' }
  ];

  await excelExporter.exportAndSend(enrichedInsurances, columns, 'Insurance', res, 'insurances.xlsx');
}

/**
 * Import Insurances via Excel file
 * @param {*} filePath 
 */
 async function importInsurances(req, res) {
  try {
    const filePath = req.file.path;
    const userContext = req.userContext;
    //TODO: Finish implementing
    // Initialize a new workbook
    const workbook = new ExcelJS.Workbook();

    // Load the Excel file
    await workbook.xlsx.readFile(filePath);

    // Get the first worksheet (assuming data is in the first sheet)
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error("No worksheet found in the uploaded file.");
    }

    // Extract column headers
    const headers = [];
    worksheet.getRow(1).eachCell((cell) => {
      headers.push(cell.text.trim());
    });

    // Validate required columns
    const requiredHeaders = ["Insurance Name", "Plan Name", "Status"];
    const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(", ")}`);
    }

    // Process rows (starting from the second row for data)
    const rows = [];
    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return; // Skip header row

      const rowData = {};
      row.eachCell((cell, colNumber) => {
        const columnHeader = headers[colNumber - 1];
        rowData[columnHeader] = cell.text.trim();
      });
      rows.push(rowData);
    });

    logger.debug("Parsed Rows:", rows);

    // Process each row
    let transaction;
    try {
      transaction = await db.beginTransaction("ENTA");
    for (const row of rows) {
      const insuranceData = {
        id: row["ID"] || null,
        insurance_name: row["Insurance Name"] || null,
        plan_name: row["Plan Name"] || "",
        status: row["Status"] || ""  
      };

      logger.info("Processing Insurance:", insuranceData);
      const savedInsurance = loadInsurance(insuranceData.insurance_name);
      let params = new Map();
      if (savedInsurance != null || savedInsurance != undefined) {
        insuranceData.id = savedInsurance.insurance_id;
      } else {
        let updateResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_SaveInsurances`, transaction, updateParams);
        let updateResultData = (0, plainToInstance)(InsuranceData, updateResult.recordsets[0]);
        let updatedInsuranceData = updateResultData[0];
        insuranceData.id = updatedInsuranceData.id;
      }

      const savedInsurancePlan = loadInsurancePlan(insuranceData.id, insuranceData.plan_name)

      if(savedInsurancePlan ==null || savedInsurance == undefined){
        //Add New Insurance Plan
        params = new Map();
        params.set("insurance_id", insuranceData.id);
        params.set("plan_name", savedInsurancePlan.plan_name);
        await db.executeInTransaction(
            `usp_${process.env.PROC_PREFIX}_SaveInsurancesPlan`, 
            transaction, 
            params
        );
      }

      if(savedInsurance) {
        await auditService.auditUpdate(savedInsurance, insuranceData, ["id"], auditService.Sections.INSURANCES, userContext.username, transaction);
      } else {
        await auditService.auditNew(insuranceData, ["id"], auditService.Sections.INSURANCES, userContext.username, transaction);
      }

    }
  }
    catch (error) {
      if (transaction) {
        await db.rollbackTransaction(transaction);
        logger.error('Transaction rolled back due to an error:', error);
      } else {
        logger.error('Error occurred before transaction could start:', error);
      }
  
      throw error;
    }
  } catch (error) {
    logger.error("Error processing file:", error);
    throw error;
  } finally {
    // Cleanup: remove the file after processing
    fs.unlink(filePath, (err) => {
      if (err) logger.error(`Error deleting file ${filePath}:`, err);
    });
  }
}

/**
 * Load data for a particular insurance by anme
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
 async function loadInsurance(insurance_name) {
  const params = new Map();
  params.set("insurance_name", insurance_name);
  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetInsurancesList`, "ENTA", params);
  let resultData = (0, plainToInstance)(InsurancePlanData, result.recordsets[0]);

  let insuranceData = resultData && resultData.length > 0 ? resultData[0] : undefined;

  return insuranceData;
}


/**
 * Load data for a particular insurance by ID
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
 async function loadInsurancePlan(insuranceId, planName) {
  const params = new Map();
  params.set("insurance_id", insuranceId);
  params.set("plan_name",planName)
  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetInsurancesPlan`, "ENTA", params);
  let resultData = (0, plainToInstance)(InsurancePlanData, result.recordsets[0]);

  let insuranceData = resultData && resultData.length > 0 ? resultData[0] : undefined;

  return insuranceData;
}


module.exports = wrapServiceFunctions({
  exportInsurances,
  importInsurances
}, "insurance-files.service");
