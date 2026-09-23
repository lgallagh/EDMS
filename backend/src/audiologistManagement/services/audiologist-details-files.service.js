const logger = require("winston");
const wrapServiceFunctions = require("../../shared/middleware/service-wrapper.middleware");
const db = require("../../shared/services/db.service");
const audiologistService = require("./audiologist-details.service");
const fs = require("fs");
const ExcelJS = require('exceljs');
const excelExporter = require("../../shared/util/excel-exporter.util")


/**
 * Export an Excel spreadsheet of available Audiologists
 * 
 * @param {*} req 
 * @param {*} res 
 */
async function exportAudiologists(req, res) {
  const params = new Map();
  params.set("is_active", "Y");
  params.set("type", "A");
  params.set("order_by", "last_name");
  params.set("sort_by", "ASC");
  const procResult = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetProfessionalList`, "ENTA", params);
  const audiologists = procResult.recordsets[0];

  const enrichedAudiologists = await Promise.all(
    audiologists.map(async (audiologist) => {
      const professionalId = audiologist.id;

      // Fetch related data for each audiologists
      const offices = await audiologistService.fetchAudiologistOffices(professionalId, "Primary");
      const officeNames = offices.map((office) => office.office_name);
      const languages = await audiologistService.fetchAudiologistLanguages(professionalId);
      const languageNames = languages.map((language) => language.language);


      // Manipulate and set values for export
      return {
        ...audiologist,
        offices: officeNames.join("~"),
        languages: languageNames.join("~"),
        statusText: audiologist.is_active == "Y" ? "Active" : audiologist.is_active == "P" ? "Pending-active" : "Non-active"
      };
    })
  );

  const columns = [
    { key: 'id', header: 'Ref#' },
    { key: 'NPI', header: 'NPI' },
    { key: 'first_name', header: 'Audiologist First Name' },
    { key: 'middle_name', header: 'Audiologist Middle Name' },
    { key: 'last_name', header: 'Audiologist Last Name' },
    { key: 'credential', header: 'Audiologist Credential' },
    { key: 'vanity_url', header: 'Vanity URL' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'seo_title', header: 'SEO Title' },
    { key: 'seo_description', header: 'SEO Description' },
    { key: 'seo_keywords', header: 'SEO Keywords' },
    { key: 'statusText', header: 'Status '},
    { key: 'offices', header: 'Offices' },
    { key: 'languages', header: 'Languages' },
    { key: 'biography', header: 'Biography' },
    { key: 'image_file', header: 'Image File' }
  ];

  await excelExporter.exportAndSend(enrichedAudiologists, columns, 'Audiologists', res, 'audiologists.xlsx');
}

/**
 * Import Audiologists via Excel file
 * @param {*} req 
 * @param {*} res
 */
 async function importAudiologists(req, res) {
  try {
    let userContext = req.userContext;

    // Initialize a new workbook
    const workbook = new ExcelJS.Workbook();

    // Load the Excel file
    await workbook.xlsx.readFile(req.file.path);

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

    //Set up column order
    const columnOrder = ["id", "NPI", "first_name", "middle_name", "last_name", "credential", "vanity_url", "email", "phone", "seo_title", "seo_description", "seo_keywords", "is_active", "offices", "languages", "display_in_website", "employment_status"];
    
    // Process rows (starting from the second row for data)
    const rows = [];
    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return; // Skip header row

      const rowData = {};
      row.eachCell((cell, colNumber) => {
        const columnHeader = columnOrder[colNumber - 1];
        rowData[columnHeader] = cell.text.trim();
      });
      rows.push(rowData);
    });

    logger.debug("Parsed Rows:", rows);

    // Process each row
    for (const row of rows) {
      const audiologistData = {
        id: row["id"] || null,
        NPI: row["NPI"] || null,
        first_name: row["first_name"] || "",
        middle_name: row["middle_name"] || "",
        last_name: row["last_name"] || "",
        credential: row["credential"] || "",
        email: row["email"] || "",
        phone: row["phone"] || "",
        vanity_url: row["vanity_url"] || "",
        seo_title: row["seo_title"] || "",
        seo_description: row["seo_description"] || "",
        seo_keywords: row["seo_keywords"] || "",
        display_in_website: row["display_in_website"] || "N",
        is_active: row["is_active"] || "N",
        employment_status: row["employment_status"] || "",
        type: "A"
      };

      //Parse out the concatenated strings into lists of ids
      const offices = await getOfficeIDs(row["offices"]);
      audiologistData.selectedPrimaryOffices = offices;

      const languages = await getLanguageIDs(row["languages"]);
      audiologistData.selectedLanguages = languages;

      logger.debug(`Processing Audiologist: ${JSON.stringify(audiologistData)}`);

      if (audiologistData.id) {
        // Update existing audiologist
        //Since we aren't coming from within the app, we need to load the current audiologist data to see what the changes are for the audit
        req.body.professionalId = audiologistData.id;
        let originalAudiologistData = await audiologistService.loadAudiologist(req);
        const payload = { audiologistData: audiologistData, originalAudiologistData: originalAudiologistData, userContext: userContext };
        await audiologistService.updateAudiologist(payload);
      } else {
        // Add new audiologist
        const payload = { audiologistData: audiologistData, originalAudiologistData: null, userContext: userContext };
        await audiologistService.addAudiologist(payload);
      }
    }
  } catch (error) {
    logger.error("Error processing file:", error);
    throw error;
  } finally {
    // Cleanup: remove the file after processing
    fs.unlink(req.file.path, (err) => {
      if (err) logger.error(`Error deleting file ${req.file.path}:`, err);
    });
  }
}

/**
 * Get office IDs based on office names
 * @param {string} officeNames - A single office name/vanity URL or multiple names/URLs separated by '~'.
 * @returns {Promise<number[]>} - Array of office IDs.
 */
 async function getOfficeIDs(officeNames) {
  if (!officeNames) return [];

  const officeNameList = officeNames.split("~").map((name) => name.trim());
  const officeIDs = [];

  for (const officeName of officeNameList) {
    const params = new Map();
    params.set("office_name", officeName);

    const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetOfficeList`, "ENTA", params);
    const office = result.recordsets[0]?.[0];
    if (office) {
      officeIDs.push(office.id);
    }
  }

  return officeIDs;
}

/**
 * Get language IDs based on language names
 * @param {string} languageNames - A single language name or multiple names separated by '~'.
 * @returns {Promise<number[]>} - Array of language IDs.
 */
async function getLanguageIDs(languageNames) {
  if (!languageNames) return [];

  const languageNameList = languageNames.split("~").map((name) => name.trim());
  const languageIDs = [];

  for (const languageName of languageNameList) {
    const params = new Map();
    params.set("language_name", languageName);

    const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetLanguageList`, "ENTA", params);
    const language = result.recordsets[0]?.[0];
    if (language) {
      languageIDs.push(language.id);
    }
  }

  return languageIDs;
}



module.exports = wrapServiceFunctions({
  exportAudiologists,
  importAudiologists
}, "audiologist-details-files.service");
