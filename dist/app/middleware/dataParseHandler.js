"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parseJsonMiddleware = (req, res, next) => {
    try {
        if (req.body && req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.default = parseJsonMiddleware;
