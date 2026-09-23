const HttpCode = {
    OK: 200,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  };
  
  class EDMSError extends Error {
    /**
     * Creates an instance of EDMSError.
     * @param {Object} args - The error arguments.
     * @param {string} [args.name='Error'] - The name of the error.
     * @param {number} [args.httpCode=200] - The HTTP status code associated with the error.
     * @param {string} args.description - The error description.
     * @param {boolean} [args.isOperational=true] - Whether the error is operational or not.
     */
    constructor(args) {
      super(args.description);
  
      Object.setPrototypeOf(this, new.target.prototype);
  
      this.name = args.name || "Error";
      this.httpCode = args.httpCode || HttpCode.OK;
      this.isOperational = args.isOperational !== undefined ? args.isOperational : true;
  
      Error.captureStackTrace(this);
    }
  }
  
  module.exports = {
    HttpCode,
    EDMSError,
  };
  