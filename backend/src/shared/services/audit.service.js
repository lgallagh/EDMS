const logger = require("winston");
const db = require("./db.service");
const auditDiffService = require("./audit-diff.service");

const Actions = {
    ADD: 1,
    EDIT: 2,
    DELETE: 3,
    LOGIN: 4
  };

  const Sections = {
    OFFICE: 1,
    DOCTOR: 2,
    PROFESSIONALS: 3,
    HOSPITALS: 4,
    SERVICES: 5,
    INSURANCES: 6,
    AUDIOLOGIST: 7,
    EMAIL: 8,
    DOCTORALTTEXT: 9,
    CMS: 10,
    USERS: 11,
    LANGUAGES: 12
  };

  /**
   * Log an audit record to the database for creating a new record
   * @param {*} object 
   * @param {*} keyList 
   * @param {*} section 
   * @param {*} user 
   * @param {*} transaction 
   * @returns 
   */
async function auditNew(object, keyList, section, user, transaction) {
  
    const auditParams = new Map();
    auditParams.set("user", user);
    auditParams.set("action", Actions.ADD);
    auditParams.set("section", section);

    let description = auditDiffService.diffData(null, object, keyList);
    auditParams.set("description", description);
    let auditResult;
    if(transaction) {
      auditResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_InsertAudit`, transaction, auditParams);
    }
    else {
      auditResult = await db.storedProc(`usp_${process.env.PROC_PREFIX}_InsertAudit`, "ENTA", auditParams);
    }

    logger.info("Adding ADD audit record for user: " + user + " in section: " + section + " :: " + description);
    return auditResult;
  }

  /**
   * Log an audit record to the database for updating a record
   * @param {*} beforeObject 
   * @param {*} afterObject 
   * @param {*} keyList 
   * @param {*} section 
   * @param {*} user 
   * @param {*} transaction 
   * @returns 
   */
async function auditUpdate(beforeObject, afterObject, keyList, section, user, transaction) {

  const auditParams = new Map();
  auditParams.set("user", user);
  auditParams.set("action", Actions.EDIT);
  auditParams.set("section", section);

  let description = auditDiffService.diffData(beforeObject, afterObject, keyList);
  auditParams.set("description", description);
  let auditResult;
    if(transaction) {
      auditResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_InsertAudit`, transaction, auditParams);
    }
    else {
      auditResult = await db.storedProc(`usp_${process.env.PROC_PREFIX}_InsertAudit`, "ENTA", auditParams);
    }

  logger.info("Adding UPDATE audit record for user: " + user + " in section: " + section + " :: " + description);
  return auditResult;
}

/**
 * Log an audit record to the database for deleting a record
 * @param {*} object 
 * @param {*} keyList 
 * @param {*} section 
 * @param {*} user 
 * @param {*} transaction 
 * @returns 
 */
async function auditDelete(object, keyList, section, user, transaction) {
  
    const auditParams = new Map();
    auditParams.set("user", user);
    auditParams.set("action", Actions.DELETE);
    auditParams.set("section", section);
    let description = auditDiffService.diffData(object, null, keyList);
    auditParams.set("description", description);
    let auditResult;
    if(transaction) {
      auditResult = await db.executeInTransaction(`usp_${process.env.PROC_PREFIX}_InsertAudit`, transaction, auditParams);
    }
    else {
      auditResult = await db.storedProc(`usp_${process.env.PROC_PREFIX}_InsertAudit`, "ENTA", auditParams);
    }
    
    logger.info("Adding DELETE audit record for user: " + user + " in section: " + section + " :: " + description);
    return auditResult;
}

/**
 * Log an audit record to the database for a user logging in
 * @param {*} user 
 * @returns 
 */
async function auditLogin(user) {
  
  const auditParams = new Map();
  auditParams.set("user", user);
  auditParams.set("action", Actions.LOGIN);
  auditParams.set("description", "User Login");

  const auditResult = await db.storedProc(`usp_${process.env.PROC_PREFIX}_InsertAudit`, "ENTA", auditParams);

  logger.info("Adding LOGIN audit record for user: " + user);
  return auditResult;
}


module.exports = {
    auditNew,
    auditUpdate,
    auditDelete,
    auditLogin,
    Actions,
    Sections
};