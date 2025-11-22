"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generateOTP = (length = 4) => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min);
};
exports.default = generateOTP;
