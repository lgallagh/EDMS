const logger = require("winston");
const wrapServiceFunctions = require("../../shared/middleware/service-wrapper.middleware");
const db = require("../../shared/services/db.service");
const officeService = require("./office.service");
const fs = require("fs");
const ExcelJS = require('exceljs');
const excelExporter = require("../../shared/util/excel-exporter.util")
const countyService = require("./county.service")

/**
 * Export an Excel spreadsheet of available Offices
 * 
 * @param {*} req 
 * @param {*} res 
 */
 async function exportOffices(req, res) {
  const params = new Map();
  params.set("is_active", "Y");
  params.set("order_by", "office_name");
  params.set("sort_by", "ASC");
  const procResult = await db.storedProc(`usp_${process.env.PROC_PREFIX}_GetOfficeList`, "ENTA", params);
  const offices = procResult.recordsets[0];

  let enrichedOffices = [];

  for (const office of offices) {
    const appointmentPath = `/online_bookings/multi_doctors/${Buffer.from(office.id.toString()).toString('base64')}`;
    const bookingUrl = `http://www.entandallergy.com${appointmentPath}`;
    enrichedOffices.push({
      ref_number: office.id,
      nextgen_ref: office.nextgen_id,
      office_name: office.office_name,
      street_location: office.street_location,
      street_location2: office.street_location2,
      city: office.city,
      state: office.state_name,
      county: office.county_name,
      zip: office.zip,
      fax: office.fax,
      phone: office.phone,
      backline_phone: office.backline_phone,
      regional_manager: office.regional_manager,
      monday: office.monday,
      tuesday: office.tuesday,
      wednesday: office.wednesday,
      thursday: office.thursday,
      friday: office.friday,
      saturday: office.saturday,
      sunday: office.sunday,
      latitude: office.lat,
      longitude: office.lon,
      is_active: office.is_active,
      office_callcenter: office.office_callcenter,
      is_sleep_center: office.is_sleep,
      vanity_url: office.vanity_url,
      booking_url: bookingUrl,
      seo_title: office.seo_title,
      seo_keywords: office.seo_keywords,
      seo_description: office.seo_description
    });
  }

  const columns = [
    { key: 'ref_number', header: 'Ref#' },
    { key: 'nextgen_ref', header: 'NextGen Ref#' },
    { key: 'office_name', header: 'Office Name' },
    { key: 'street_location', header: 'Street Location' },
    { key: 'street_location2', header: 'Street Location2' },
    { key: 'city', header: 'City' },
    { key: 'state', header: 'State' },
    { key: 'county', header: 'County' },
    { key: 'zip', header: 'Zip' },
    { key: 'fax', header: 'Fax' },
    { key: 'phone', header: 'Phone' },
    { key: 'backline_phone', header: 'Back Line Phone' },
    { key: 'regional_manager', header: 'Regional Manager' },
    { key: 'monday', header: 'Monday' },
    { key: 'tuesday', header: 'Tuesday' },
    { key: 'wednesday', header: 'Wednesday' },
    { key: 'thursday', header: 'Thursday' },
    { key: 'friday', header: 'Friday' },
    { key: 'saturday', header: 'Saturday' },
    { key: 'sunday', header: 'Sunday' },
    { key: 'latitude', header: 'Latitude' },
    { key: 'longitude', header: 'Longitude' },
    { key: 'is_active', header: 'Is Active' },
    { key: 'office_callcenter', header: 'Office Callcenter' },
    { key: 'is_sleep_center', header: 'Is Sleep Center' },
    { key: 'vanity_url', header: 'Vanity Url' },
    { key: 'booking_url', header: 'Booking Url' },
    { key: 'seo_title', header: 'Seo Title' },
    { key: 'seo_keywords', header: 'Seo Keywords' },
    { key: 'seo_description', header: 'Seo Description' }
  ];

  await excelExporter.exportAndSend(enrichedOffices, columns, 'Office', res, 'office_list.xlsx');
}



async function loadCountyMap() {
  const countyData = await countyService.counties();
  const countyMap = new Map();
  for (const county of countyData) {
    countyMap.set(county.vanity_url, county.id);
  }
  return countyMap;
}



async function importOffices(req, res) {
  try {
    const filePath = req.file.path;
    const userContext = req.userContext;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error("No worksheet found in the uploaded file.");
    }
    const countyMap = await loadCountyMap();
    const rowsData = [];
    worksheet.eachRow({ includeEmpty: true }, (row, rowIndex) => {
      if (rowIndex === 1) return;
      // row.values is 1-indexed; slice(1) gets the actual data starting from the first column.
      const cells = row.values.slice(1).map(cell => cell !== null && cell !== undefined ? String(cell).trim() : "");
      if (cells.some(value => value !== "")) {
        rowsData.push(cells);
      }
    });
    const transaction = await db.beginTransaction("OFFICE_IMPORT");
    try {
      const procedureName = `usp_${process.env.PROC_PREFIX}_SaveOffices`;
      for (const datar of rowsData) {
        // datar[0] is the office id for checking existence.
        const targetId = parseInt(datar[0], 10);
        const officeData = {
          nextgen_id: datar[1],
          office_name: datar[2],
          street_location: datar[3],
          street_location2: datar[4],
          city: datar[5],
          county_id: countyMap.get(datar[6]) || null,
          zip: datar[7],
          fax: datar[8],
          phone: datar[9],
          backline_phone: datar[10],
          regional_manager: datar[11],
          monday: datar[12],
          tuesday: datar[13],
          wednesday: datar[14],
          thursday: datar[15],
          friday: datar[16],
          saturday: datar[17],
          sunday: datar[18],
          lat: datar[19],
          lon: datar[20],
          is_active: datar[21],
          office_callcenter: datar[22],
          is_sleep: datar[23],
          vanity_url: datar[24],
          seo_title: datar[25],
          seo_description: datar[26],
          seo_keywords: datar[27],
          is_callcenter_active: datar[28],
          is_submit_to_nextgen_active: datar[29],
          office_iso: datar[30],
          google_street_location: datar[31]
        };
         // If targetId is valid, check if an office exists using officeService.loadOffice.
         if (!isNaN(targetId) && targetId > 0) {
          const office = await officeService.loadOffice(targetId);
          if (office) {
            officeData.id = targetId;
          }
        }
        await db.executeInTransaction(procedureName, transaction, officeData);

        if (officeData.id) {
          // Update existing office
          //Since we aren't coming from within the app, we need to load the current office data to see what the changes are for the audit
          let originalOfficeData = await officeService.loadOffice(officeData.id);
          await auditService.auditUpdate(originalOfficeData, officeData, ["id"], auditService.Sections.OFFICE, userContext.username, transaction);
          
        } else {
          await auditService.auditNew(officeData, ["id"], auditService.Sections.OFFICE, userContext.username, transaction);
        }
      }
      await db.commitTransaction(transaction);
    } catch (innerError) {
      await db.rollbackTransaction(transaction);
      throw innerError;
    }
    await fs.promises.unlink(filePath);
    logger.info("Office information has been updated successfully");
  } catch (error) {
    logger.error("Error processing file:", error);
    throw error;
  }
}


module.exports = wrapServiceFunctions({
  exportOffices,
  importOffices,
}, "office-files.service");
