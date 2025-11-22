"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const getFilePath_1 = require("../../shared/getFilePath");
const parseFileData = (fieldName) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Use dynamic fieldName to get the file path
            const filePath = (0, getFilePath_1.getSingleFilePath)(req.files, fieldName);
            // Handle additional data if present
            if (req.body.data) {
                const data = JSON.parse(req.body.data);
                req.body = Object.assign({ [fieldName]: filePath }, data);
            }
            else {
                req.body = { [fieldName]: filePath };
            }
            next();
        }
        catch (error) {
            next(error);
        }
    });
};
exports.default = parseFileData;
