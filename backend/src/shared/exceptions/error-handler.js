const logger = require('winston');
const { Response } = require('express');
const { EDMSError, HttpCode } = require('./edms-error');

class ErrorHandler {
  constructor() {
    // Bind methods to the instance
    this.isTrustedError = this.isTrustedError.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleTrustedError = this.handleTrustedError.bind(this);
    this.handleCriticalError = this.handleCriticalError.bind(this);
  }

  /**
   * Determine whether the error is a trusted (expected) error.
   * @param {Error} error
   * @returns {boolean}
   */
  isTrustedError(error) {
    if (error instanceof EDMSError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * Handle errors by determining if they are trusted or critical.
   * @param {Error|EDMSError} error
   * @param {Response} [response]
   */
  handleError(error, response) {
    if (this.isTrustedError(error) && response) {
      this.handleTrustedError(error, response);
    } else {
      this.handleCriticalError(error, response);
    }
  }

  /**
   * Handle trusted (expected) errors.
   * @param {EDMSError} error
   * @param {Response} response
   */
  handleTrustedError(error, response) {
    response
      .status(error.httpCode)
      .json({ error: 'error', message: error.message });
  }

  /**
   * Handle critical (unexpected) errors.
   * @param {Error|EDMSError} error
   * @param {Response} [response]
   */
  handleCriticalError(error, response) {
    if (response) {
      response
        .status(HttpCode.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error', error: error.message });
    }

    logger.error('Critical Error: ', error);
  }
}

module.exports = new ErrorHandler();
