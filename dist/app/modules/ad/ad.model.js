"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ad = void 0;
const mongoose_1 = require("mongoose");
const adSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    url: {
        type: String,
        required: true,
    },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
exports.Ad = (0, mongoose_1.model)('Ad', adSchema);
