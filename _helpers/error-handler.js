const { enums: { VALIDATION_ERROR, UNAUTHORIZED_ERROR } } = require('./constants');

function errorHandler(err, req, res, next) {
    console.log({ err })
    if (typeof (err) === 'string') {
        // custom application error
        return res.status(400).json({ message: err });
    }

    if (err.name === VALIDATION_ERROR) {
        // mongoose validation error
        return res.status(400).json({ message: err.message });
    }

    if (err.name === UNAUTHORIZED_ERROR) {
        // jwt authentication error
        return res.status(401).json({ message: 'Invalid Token, re-authenticate' });
    }

    // default to 500 server error
    return res.status(500).json({ message: err.message });
}

module.exports = errorHandler;