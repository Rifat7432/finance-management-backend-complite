"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getFilePath_1 = require("../../shared/getFilePath");
const parseFileData = (req, res, next) => {
    try {
        const image = (0, getFilePath_1.getMultipleFilesPath)(req.files, 'image');
        if (req.body.data) {
            const data = JSON.parse(req.body.data);
            req.body = Object.assign({ image }, data);
        }
        else {
            req.body = { image };
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.default = parseFileData;
