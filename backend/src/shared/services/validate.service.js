const { plainToInstance } = require("class-transformer");
const logger = require("winston");
const wrapServiceFunctions = require("../../shared/middleware/service-wrapper.middleware");
const db = require("../../shared/services/db.service");

/**
 * Determines if a vanity_url value is unique
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
async function validateVanityURL(req, res) {
    const params = new Map();

    params.set("id", req.body.id ? req.body.id : null);
    params.set("vanity_url", req.body.vanity_url);
    params.set("type", req.body.type)
    const result = await db.storedProc(`usp_${process.env.PROC_PREFIX}_ValidateVanityUrl`, "ENTA", params);
    let vanityData = result.recordsets[0];//(0, plainToInstance)(OfficeListEntry, result.recordsets[0]);
    if(vanityData[0]?.Exists == "N")
        return true;
    else
        return false;
}


module.exports = wrapServiceFunctions({
  validateVanityURL
}, "validate.service.js");
