const logger = require("winston");
const wrapServiceFunctions = require("../../shared/middleware/service-wrapper.middleware");
const db = require("../../shared/services/db.service");
const doctorService = require("./doctor-management.service");
const fs = require("fs");
const path = require("path");
const ExcelJS = require('exceljs');
const archiver = require("archiver");
const { v4: uuidv4 } = require("uuid");
const excelExporter = require("../../shared/util/excel-exporter.util");
const EDMSError = require("../../shared/exceptions/edms-error");


/**
 * Export an Excel spreadsheet of available Doctors
 * 
 * @param {*} req 
 * @param {*} res 
 */
async function exportDoctors(req, res) {
  const params = new Map();
  params.set("is_active", "Y");
  params.set("order_by", "doctor_last_name");
  params.set("sort_by", "ASC");
  const procResult = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorList`, "ENTA", params);
  const doctors = procResult.recordsets[0];

  const enrichedDoctors = await Promise.all(
    doctors.map(async (doctor) => {
      const doctorId = doctor.id;

      // Fetch related data for each doctor
      const offices = await doctorService.fetchDoctorOffices(doctorId);
      const officeNames = offices.map((office) => office.office_name);
      const services = await doctorService.fetchDoctorServices(doctorId);
      const serviceNames = services.map((service) => service.service_name);
      const languages = await doctorService.fetchDoctorLanguages(doctorId);
      const languageNames = languages.map((language) => language.language);
      const socials = await doctorService.fetchDoctorSocialMedia(doctorId);
      const socialData = socials && socials.length > 0 ? socials[0] : {};

      // Manipulate and set values for export
      return {
        ...doctor,
        offices: officeNames.join("~"),
        services: serviceNames.join("~"),
        languages: languageNames.join("~"),
        doctor_youtube_channel_url: socialData?.doctor_youtube_channel_url || "",
        doctor_facebook_url: socialData?.doctor_facebook_url || "",
        doctor_twitter_url: socialData?.doctor_twitter_url || "",
        doctor_instagram_url: socialData?.doctor_instagram_url || "",
        doctor_google_url: socialData?.doctor_google_url || "",
        doctor_linkedin_url: socialData?.doctor_linkedin_url || "",
        review_code_top: socialData?.review_code_top || "",
        review_code_bottom: socialData?.review_code_bottom || "",
      };
    })
  );

  const columns = [
    { key: 'id', header: 'Ref#' },
    { key: 'NPI', header: 'NPI' },
    { key: 'doctor_first_name', header: 'Doctor First Name' },
    { key: 'doctor_middle_name', header: 'Doctor Middle Name' },
    { key: 'doctor_last_name', header: 'Doctor Last Name' },
    { key: 'doctor_credential', header: 'Credential' },
    { key: 'speciality', header: 'Speciality' },
    { key: 'doctor_short_name', header: 'Doctor Short Name' },
    { key: 'vanity_url', header: 'Vanity URL' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'seo_title', header: 'SEO Title' },
    { key: 'seo_description', header: 'SEO Description' },
    { key: 'seo_keywords', header: 'SEO Keywords' },
    { key: 'offices', header: 'Offices' },
    { key: 'services', header: 'Services' },
    { key: 'languages', header: 'Languages' },
    { key: 'booking_url', header: 'Booking URL' },
    { key: 'biography', header: 'Biography' },
    { key: 'zocdoc_widget', header: 'Zocdoc Widget' },
    { key: 'image_file', header: 'Image File' },
    { key: 'healthgrades_url', header: 'Healthgrades URL' },
    { key: 'doctor_youtube_channel_url', header: 'Youtube Channel URL' },
    { key: 'doctor_facebook_url', header: 'Facebook URL' },
    { key: 'doctor_twitter_url', header: 'Twitter URL' },
    { key: 'doctor_instagram_url', header: 'Instagram URL' },
    { key: 'doctor_google_url', header: 'Google+ URL' },
    { key: 'doctor_linkedin_url', header: 'LinkedIn URL' },
    { key: 'review_code_top', header: 'Top Review Code' },
    { key: 'review_code_bottom', header: 'Bottom Review Code' }
  ];

  await excelExporter.exportAndSend(enrichedDoctors, columns, 'Doctor', res, 'doctors.xlsx');
}

/**
 * Import Doctors via Excel file
 * @param {*} req
 * @param {*} res 
 */
 async function importDoctors(req, res) {
  try {
    let userContext = req.userContext;

    // Initialize a new workbook
    const workbook = new ExcelJS.Workbook();

    // Load the Excel file
    await workbook.xlsx.readFile(req.file.path);

    // Get the first worksheet (assuming data is in the first sheet)
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new EDMSError("No worksheet found in the uploaded file.");
    }

    // Extract column headers
    const headers = [];
    worksheet.getRow(1).eachCell((cell) => {
      headers.push(cell.text.trim());
    });

    //Set up column order
    const columnOrder = ["id", "NPI", "doctor_first_name", "doctor_middle_name", "doctor_last_name", "doctor_maiden_name", "doctor_credential", "speciality", "doctor_short_name", "CAQHID", "extended_shot_hours", "vanity_url", "email", "phone", "seo_title", "seo_description", "seo_keywords", "offices", "services", "languages", "provider_type", "gender", "healthgrades_url", "doctor_youtube_channel_url", "doctor_facebook_url", "doctor_twitter_url", "doctor_instagram_url", "doctor_google_url", "doctor_linkedin_url", "is_active", "is_virtual_visit", "is_submit_to_nextgen_active"];
    
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
      const doctorData = {
        id: row["id"] || null,
        NPI: row["NPI"] || null,
        doctor_first_name: row["doctor_first_name"] || "",
        doctor_middle_name: row["doctor_middle_name"] || "",
        doctor_last_name: row["doctor_last_name"] || "",
        doctor_short_name: row["doctor_short_name"] || "",
        doctor_maiden_name: row["doctor_maiden_name"] || "",
        CAQHID: row["CAQHID"] || "",
        extended_shot_hours: row["extended_shot_hours"] || "",
        doctor_credential: row["doctor_credential"] || "",
        speciality: row["speciality"] || "",
        email: row["email"] || "",
        phone: row["phone"] || "",
        vanity_url: row["vanity_url"] || "",
        seo_title: row["seo_title"] || "",
        seo_description: row["seo_description"] || "",
        seo_keywords: row["seo_keywords"] || "",
        provider_type: row["provider_type"] || "",
        gender: row["gender"] || "",
        healthgrades_url: row["healthgrades_url"] || "",
        doctor_youtube_channel_url: row["doctor_youtube_channel_url"] || "",
        doctor_facebook_url: row["doctor_facebook_url"] || "",
        doctor_twitter_url: row["doctor_twitter_url"] || "",
        doctor_instagram_url: row["doctor_instagram_url"] || "",
        doctor_google_url: row["doctor_google_url"] || "",
        doctor_linkedin_url: row["doctor_linkedin_url"] || "",
        is_active: row["is_active"] || "N",
        is_virtual_visit: row["is_virtual_visit"] || "",
        is_submit_to_nextgen_active: row["is_submit_to_nextgen_active"] || ""
      };

      //Parse out the concatenated strings into lists of ids
      const offices = await getOfficeIDs(row["offices"]);
      doctorData.selectedOffices = offices;

      const languages = await getLanguageIDs(row["languages"]);
      doctorData.selectedLanguages = languages;

      const services = await getServiceIDs(row["services"]);
      doctorData.selectedServices = services;

      logger.debug(`Processing Doctor: ${JSON.stringify(doctorData)}`);

      if (doctorData.id) {
        // Update existing doctor
        //Since we aren't coming from within the app, we need to load the current doctor data to see what the changes are for the audit
        req.body.doctorId = doctorData.id;
        let originalDoctorData = await doctorService.loadDoctor(req);
        const payload = { doctorData: doctorData, originalDoctorData: originalDoctorData, userContext: userContext };
        await doctorService.updateDoctor(payload);
      } else {
        // Add new doctor
        const payload = { doctorData: doctorData, originalDoctorData: null, userContext: userContext };
        await doctorService.addDoctor(payload);
      }
    }
  } catch (error) {
    logger.error("Error processing file:", error);
    throw error;
  } finally {
    // Cleanup: remove the file after processing
    await fs.unlink(req.file.path, (err) => {
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
 * Get service IDs based on service names
 * @param {string} serviceNames - A single service name or multiple names separated by '~'.
 * @returns {Promise<number[]>} - Array of service IDs.
 */
async function getServiceIDs(serviceNames) {
  if (!serviceNames) return [];

  const serviceNameList = serviceNames.split("~").map((name) => name.trim());
  const serviceIDs = [];

  for (const serviceName of serviceNameList) {
    const params = new Map();
    params.set("service_name", serviceName);

    const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetServicesList`, "ENTA", params);
    const service = result.recordsets[0]?.[0];
    if (service) {
      serviceIDs.push(service.id);
    }
  }

  return serviceIDs;
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

/**
 * Generate VCF files and create a zip file for all doctors.
 */
 async function generateVcfZip(req, res) {
  const uniqueDir = path.join(path.resolve(__dirname, process.env.TEMP_FILE_DIR), uuidv4());
  const zipPath = path.join(uniqueDir, "doctors.zip");

  try {
    // Ensure unique temp directory exists
    fs.mkdirSync(uniqueDir, { recursive: true });

    // Simulate fetching doctor data
    const doctors = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetDoctorList`, "ENTA", new Map());
    const doctorData = doctors.recordsets[0];

    // Generate VCF files
    doctorData.forEach((doctor) => {
      const filename = `${doctor.doctor_first_name} ${doctor.doctor_middle_name} ${doctor.doctor_last_name}, ${doctor.doctor_credential}.vcf`;
      const filepath = path.join(uniqueDir, filename);

      const vcfContent = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${doctor.doctor_first_name} ${doctor.doctor_last_name}`,
        `EMAIL;INTERNET;WORK:${doctor.email || ""}`,
        `TEL;WORK:${doctor.phone || ""}`,
        `ORG:ENT & Allergy Associates, LLP`,
        `URL;WORK:http://www.entandallergy.com`,
        "END:VCARD",
      ].join("\n");

      fs.writeFileSync(filepath, vcfContent, "utf-8");
    });

    // Create zip archive
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(output);

    fs.readdirSync(uniqueDir).forEach((file) => {
      if (file !== "doctors.zip") {
        archive.file(path.join(uniqueDir, file), { name: file });
      }
    });

    await archive.finalize();

    // Send zip file to client
    output.on("close", () => {
      res.download(zipPath, "doctors.zip", (err) => {
        if (err) {
          logger.error("Error sending ZIP file to client:", err);
          if (!res.headersSent) {
            res.status(500).send("Error sending ZIP file");
          }
        } else {
          logger.info("File sent successfully.");
        }

        // Cleanup only after file is fully sent
        clearDirectory(uniqueDir);
      });
    });
  } catch (error) {
    logger.error("Error generating VCF zip file:", error);
    clearDirectory(uniqueDir);
    res.status(500).send("Error generating VCF zip file");
  }
}

function clearDirectory(uniqueDir) {
  try {
    fs.rm(uniqueDir, { recursive: true, force: true }, (cleanupErr) => {
      if (cleanupErr) {
        logger.error("Error during directory cleanup:", cleanupErr);
      } else {
        logger.debug("Temporary directory cleaned up:", uniqueDir);
      }
    });
  } catch (cleanupErr) {
    logger.error("Error during directory cleanup:", cleanupErr);
  }
}



module.exports = wrapServiceFunctions({
  exportDoctors,
  importDoctors,
  generateVcfZip,
}, "doctor-management-files.service");
