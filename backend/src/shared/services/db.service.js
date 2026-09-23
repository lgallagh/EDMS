const { PoolManager } = require('../util/pool-manager');
const logger = require('winston');
const mssql = require("mssql");

/**
 * Execute a SQL query using a connection from a specific pool.
 * 
 * @param {string} sql - The SQL query to execute.
 * @param {string} poolName - The name of the pool to use.
 * @param {Map<string, any>} params - Parameters for the query.
 * @returns {Promise<object>} The result of the query.
 */
async function query(sql, poolName, params) {
  const poolManager = new PoolManager();
  const pool = await poolManager.getPool(poolName);
  const request = pool.request();

  const result = await request.query(sql);
  return result;
}

/**
 * Execute a stored procedure using a connection from a specific pool.
 * 
 * @param {string} procName - The name of the stored procedure to execute.
 * @param {string} poolName - The name of the pool to use.
 * @param {Map<string, any>} params - Input parameters for the procedure.
 * @param {Map<string, any>} [outputParams] - Output parameters for the procedure.
 * @returns {Promise<object>} The result of the procedure execution.
 */
async function storedProc(procName, poolName, params, outputParams) {
  const poolManager = new PoolManager();
  const pool = await poolManager.getPool(poolName);
  const request = pool.request();
  let debugString = `\n{\nExecuting stored procedure: ${procName} | \n`;

  const regex = new RegExp("'", 'g');

  // Bind input parameters
  for (const [key, value] of params) {
    if (value && value.type) {
      if (typeof value.value === 'string') {
        value.value = value.value.replace(regex, "''");
      }
      debugString += `Input key: ${key}, value: ${value} | \n`;
      request.input(key, value.type, value.value);
    } else {
      const processedValue = typeof value === 'string' ? value.replace(regex, "''") : value;
      debugString += `Input key: ${key}, value: ${processedValue} | \n`;
      request.input(key, processedValue);
    }
  }

  // Bind output parameters
  if (outputParams) {
    for (const [key, value] of outputParams) {
      if (value && value.type) {
        debugString += `Output key: ${key}, value: ${value} | \n`;
        request.output(key, value.type, value.value);
      } else {
        debugString += `Output key: ${key}, value: ${value} | \n`;
        request.output(key, value);
      }
    }
  }

  logger.debug(`${debugString}}`);

  try {
    const result = await request.execute(procName);
    //If a procedure returned a result code, and it's something other than 0, there was some sort of error
    if(result.recordset && result.recordset[0] && result.recordset[0].result_code && result.recordset[0].result_code != 0) {
      throw new Error(`Error executing ${procName}: ` + result.recordset[0].result_message + ` (Result Code: ` + result.recordset[0].result_code + `)`);
    }
    return result;
  } catch (err) {
    const newError = new Error(`Error executing ${procName} on pool ${poolName}: ${err.message}`);
    newError.stack = err.stack;
    throw newError;
  }
}

/**
 * Execute a SQL query selecting from a table function, passing in the necessary parameters by name.
 * 
 * @param {string} functionName - The name of the table function to execute.
 * @param {string} poolName - The name of the pool to use.
 * @param {Map<string, any>} params - Parameters for the table function.
 * @returns {Promise<object>} The result of the table function query.
 */
async function tableFunction(functionName, poolName, params) {
  const poolManager = new PoolManager();
  const pool = await poolManager.getPool(poolName);
  const request = pool.request();
  let debugStringForFunc = `\n{\nExecuting function: ${functionName} | \n`;
  let parameters = '';
  let numParams = 0;

  for (const [key, value] of params) {
    debugStringForFunc += `Input key: ${key}, value: ${value} | \n`;
    request.input(key, value);
    if (numParams > 0) {
      parameters += ', ';
    }
    parameters += `'' + @${key} + ''`;
    numParams++;
  }

  request.input('functionName', functionName);
  logger.debug(`${debugStringForFunc}}`);

  const queryString = `EXEC('SELECT * FROM ' + @functionName + '('` + parameters + `');');`;
  const result = await request.query(queryString);

  return result;
}

/**
 * Begin a transaction on the specified pool.
 *
 * @param {string} poolName - The name of the pool to use.
 * @returns {Promise<object>} The transaction object.
 */
 async function beginTransaction(poolName) {
  const poolManager = new PoolManager();
  const pool = await poolManager.getPool(poolName);
  
  const transaction = new mssql.Transaction(pool);
  await transaction.begin();
  return transaction;
}

/**
 * Commit the given transaction.
 *
 * @param {object} transaction - The transaction to commit.
 */
async function commitTransaction(transaction) {
  if (!transaction) {
    throw new Error("Transaction is required to commit.");
  }
  await transaction.commit();
}

/**
 * Roll back the given transaction.
 *
 * @param {object} transaction - The transaction to roll back.
 */
async function rollbackTransaction(transaction) {
  if (!transaction) {
    throw new Error("Transaction is required to roll back.");
  }
  try {
    await transaction.rollback();
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Execute a stored procedure within a transaction.
 *
 * @param {string} procName - The name of the stored procedure.
 * @param {object} transaction - The transaction object.
 * @param {Map<string, any>} params - Input parameters for the procedure.
 * @param {Map<string, any>} [outputParams] - Output parameters for the procedure.
 * @returns {Promise<object>} The result of the procedure execution.
 */
 async function executeInTransaction(procName, transaction, params, outputParams) {
  const request = transaction.request();
  let debugString = `\n{\nExecuting stored procedure: ${procName} | \n`;

  // Bind input parameters
for (const [key, value] of params) {
  if (value && value.type) {
    debugString += `Input key: ${key}, value: ${value.value} | \n`;
    request.input(key, value.type, value.value);
  } else {
    debugString += `Input key: ${key}, value: ${value} | \n`;
    request.input(key, value);
  }
}

  // Bind output parameters
  if (outputParams) {
    for (const [key, value] of outputParams) {
      if (value && value.type) {
        debugString += `Output key: ${key}, value: ${value.value} | \n`;
        request.output(key, value.type, value.value);
      } else {
        debugString += `Output key: ${key}, value: ${value} | \n`;
        request.output(key, value);
      }
    }
  }

  logger.debug(`${debugString}}`);

  try {
    const result = await request.execute(procName);
    //If a procedure returned a result code, and it's something other than 0, there was some sort of error
    if(result.recordset && result.recordset[0] && result.recordset[0].result_code && result.recordset[0].result_code != 0) {
      throw new Error(`Error executing ${procName} within transaction: ` + result.recordset[0].result_message + ` (Result Code: ` + result.recordset[0].result_code + `)`);
    }
    return result;
  } catch (err) {
    const newError = new Error(`Error executing ${procName} within transaction: ${err.message}`);
    newError.stack = err.stack;
    throw newError;
  }
}


function determineSqlType(value) {
  if (typeof value === "string") {
    return mssql.VarChar; // Adjust length as needed
  } else if (typeof value === "number") {
    return mssql.Int;
  } else if (typeof value === "boolean") {
    return mssql.Bit;
  } else if (value instanceof Date) {
    return mssql.DateTime;
  } else {
    return mssql.VarChar; // Default type for other values
  }
}



module.exports = {
  query,
  storedProc,
  tableFunction,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  executeInTransaction,
  determineSqlType
};
