
// Custom errors are defined in this file.

function AvisynthError(message) {
    // The reason I'm doing this instead of assigning the constructor's prototype
    // is because otherwise it seems to be mistakenly recognized as just "Error".
    this.constructor.prototype.__proto__ = Error.prototype;
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
}

AvisynthError.name = 'AvisynthError';

exports.AvisynthError = AvisynthError;
