const mssql = require('mssql');
const pools = new Map(); // Cache for connection pools
const logger = require('winston'); 

class PoolManager {
  /**
   * Get or create a pool. If a pool doesn't exist, the config must be provided.
   * If the pool does exist, the config is ignored (even if it was different to the one provided
   * when creating the pool).
   *
   * @param {string} name - Name of the pool
   * @param {object} [config] - Configuration for the pool
   * @return {Promise<mssql.ConnectionPool>}
   */
  async getPool(name, config) {
    if (!pools.has(name)) {
      logger.debug(`Pool ${name} not found in the pool list.`);
      if (!config) {
        logger.debug("No pool config available.");
        throw new Error(`Pool ${name} does not exist`);
      }

      logger.debug(`Configuring pool ${name}.`);
      const pool = new mssql.ConnectionPool(config);

      // Automatically remove the pool from the cache if `pool.close()` is called
      const close = pool.close.bind(pool);
      pool.close = (...args) => {
        pools.delete(name);
        return close(...args);
      };

      await pool.connect((err) => {
        if (err) {
          logger.error(err.stack);
          logger.debug(`Error in pool setup for ${name}. Removing from pool list.`);
          pools.delete(name);
        }
      });

      pools.set(name, pool);
      logger.debug(`Finished configuring pool ${name}.`);
    }
    return pools.get(name);
  }

  /**
   * Closes all the pools and removes them from the store.
   *
   * @return {Promise<mssql.ConnectionPool[]>}
   */
  async closeAll() {
    return Promise.all(
      Array.from(pools.values()).map(async (pool) => {
        try {
          return await pool.close();
        } catch (err) {
          logger.error(`Error closing pool: ${err.stack}`);
        }
      })
    );
  }
}

module.exports = { PoolManager };
