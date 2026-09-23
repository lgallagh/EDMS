// ldap-auth.js
require('dotenv').config();                    // Load SERVICE_ACCOUNT and SERVICE_PASSWORD from .env
const { Client } = require('ldapts');
const logger     = require('winston');

//
// Configuration
//
const LDAP_URL        = 'ldap://pdomain.entandallergy.com:3268';  
// When querying the GC you can use an empty base DN to span the entire forest:
const BASE_DN         = '';                                      

// Service-account credentials (set these in your environment or .env file)
const SERVICE_ACCOUNT = process.env.SERVICE_ACCOUNT;            
const SERVICE_PASSWORD= process.env.SERVICE_PASSWORD;        

/**
 * Search for a user’s DN in the Global Catalog by sAMAccountName or UPN
 * @param {string} username – the login name or UPN to look up
 * @returns {Promise<string|null>} – the Distinguished Name, or null if not found
 */
async function findUserDN(username) {
  const client = new Client({ url: LDAP_URL });

  try {
    logger.debug(`(search)  Binding to GC as SERVICE_ACCOUNT=${SERVICE_ACCOUNT}...`);
    await client.bind(SERVICE_ACCOUNT, SERVICE_PASSWORD);

    // Build filter for sAMAccountName, exact UPN, or any UPN starting with username@
    let filter;
    if (username.includes('@')) {
      // exact UPN match
      filter = `(&(objectClass=user)(userPrincipalName=${username}))`;
    } else {
      // login name or any UPN that begins with username@
      filter = `(&(objectClass=user)(|` +
               `(sAMAccountName=${username})` +
               `(userPrincipalName=${username}@*)` +
               `))`;
    }

    logger.debug(`(search)  Searching GC with filter: ${filter}`);
    const { searchEntries } = await client.search(BASE_DN, {
      scope:      'sub',
      filter:     filter,
      attributes: ['distinguishedName']
    });

    logger.debug('(search)  GC search returned:', searchEntries);
    if (!searchEntries.length) {
      logger.debug(`(search)  User ${username} not found in forest.`);
      return null;
    }

    const userDN = searchEntries[0].distinguishedName;
    logger.debug(`(search)  Found DN for ${username}: ${userDN}`);
    return userDN;
  } catch (err) {
    logger.error(`Error in findUserDN: ${err.message}`);
    return null;
  } finally {
    await client.unbind();
  }
}

/**
 * Validate a user’s password by binding as them
 * @param {string} userDN   – the Distinguished Name you found
 * @param {string} password – the password to test
 * @returns {Promise<boolean>}
 */
async function bindAsUser(userDN, password) {
  const client = new Client({ url: LDAP_URL });
  try {
    logger.debug(`(auth)    Binding as USER_DN=${userDN}...`);
    await client.bind(userDN, password);
    return true;
  } catch (err) {
    logger.error(`User bind failed: ${err.message}`);
    return false;
  } finally {
    await client.unbind();
  }
}

/**
 * Full authentication flow:
 * 1) search DN in GC by login name or UPN
 * 2) bind as that DN with the provided password
 */
async function authenticate(username, password) {
  const userDN = await findUserDN(username);
  if (!userDN) {
    logger.warn(`Authentication aborted: user DN not found for ${username}`);
    return false;
  }
  const ok = await bindAsUser(userDN, password);
  if (ok) {
    logger.info(`Authentication successful for ${username}`);
  } else {
    logger.info(`Authentication failed for ${username}`);
  }
  return ok;
}

module.exports = {
  authenticate
};
