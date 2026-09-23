const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { EDMSError, HttpCode } = require('../exceptions/edms-error');

class ExcelExporter {
  /**
   * Exports data to an Excel file and streams it in response.
   * 
   * @param {Array<Object>} data - The list of objects to export.
   * @param {Array<Object>} columns - The column definitions.
   * @param {String} worksheetName - The name to put on the worksheet
   * @param {Response} res - The Express response object.
   * @param {string} fileName - The name of the Excel file to be sent to the client.
   */
  static async exportAndSend(data, columns, worksheetName, res, fileName) {
    const tempDir = process.env.TEMP_FILE_DIR;

    // Throw error if TEMP_FILE_DIR is not set
    if (!tempDir) {
      throw new EDMSError({
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        message: 'TEMP_FILE_DIR is not set in the environment variables.',
      });
    }

    const tempPath = path.join(tempDir, `${uuidv4()}_${fileName}.xlsx`);

    // Ensure the directory exists
    fs.mkdirSync(tempDir, { recursive: true });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(worksheetName);

    // Define columns in the worksheet
    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 20, // Default column width
    }));

    // Add rows to the worksheet
    data.forEach((item) => {
      const row = {};
      columns.forEach((col) => {
        if (col.value) {
          // Use the custom value function if provided
          row[col.key] = truncate(col.value(item) ? col.value(item) : "");
        } else {
          // Use the key to extract the value from the data object
          row[col.key] = truncate(item[col.key] ? item[col.key] : "");
        }
      });
      worksheet.addRow(row);
    });

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true }; // Make header row bold
    });

    try {
      // Write to the temporary file
      await workbook.xlsx.writeFile(tempPath);

      // Stream the file to the response
      res.download(tempPath, fileName, (err) => {
        // Clean up the temporary file
        fs.unlink(tempPath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting temporary file:', unlinkErr);
          }
        });

        if (err) {
          console.error('Error sending file to client:', err);
          res.status(500).send('Error sending file');
        }
      });
    } catch (error) {
      console.error('Error generating Excel file:', error);

      // Ensure cleanup in case of error
      if (fs.existsSync(tempPath)) {
        fs.unlink(tempPath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting temporary file on error:', unlinkErr);
          }
        });
      }

      throw new EDMSError({
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        message: 'Error generating Excel file.',
      });
    }
  }
}

/**
 * Truncate data to fit within an Excel cell
 * @param {*} value 
 * @param {*} maxLength 
 * @returns 
 */
function truncate(value, maxLength = 32767) {
  return value.length > maxLength ? value.substring(0, maxLength) : value;
}

module.exports = ExcelExporter;
