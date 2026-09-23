const logger = require("winston");
const wrapServiceFunctions = require("../../shared/middleware/service-wrapper.middleware");
const db = require("../../shared/services/db.service");
const fs = require("fs");
const excelExporter = require("../../shared/util/excel-exporter.util")


/**
 * Export an Excel spreadsheet of available Affiliations
 * 
 * @param {*} req 
 * @param {*} res 
 */
async function exportAffiliations(req, res) {

  const params = new Map();
  const type = req.query.type;
  
  params.set("type", type);

  const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetProviderInsurances`, "ENTA", params);
  let affiliations = result.recordsets[0];

  const columns = [
    {
      key: "id",
      header: "Ref#"
    },
    {
      key: "insurance_name",
      header: "Insurance"
    },
    {
      key: "provider",
      header: "Provider"
    },
    {
      key: "office_name",
      header: "Office"
    },
    {
      key: "plan_name",
      header: "Plan"
    },
    {
      key: "provider_id",
      header: "Provider Number"
    },
    {
      key: "plan_details",
      header: "Plan Details"
    },
    {
      key: "starting_date",
      header: "Start Date"
    },
    {
      key: "deactivate_date",
      header: "End Date"
    }
  ];
  

  await excelExporter.exportAndSend(affiliations, columns, 'Affiliation', res, 'affiliations.xlsx');
}







module.exports = wrapServiceFunctions({
  exportAffiliations
}, "affiliation-files.service");
