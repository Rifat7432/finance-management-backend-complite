"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerRequest = void 0;
const mongoose_1 = require("mongoose");
const partnerRequestSchema = new mongoose_1.Schema({
    fromUser: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true }, // Who sent the request
    toUser: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: false }, // Registered user (if exists)
    name: { type: String }, // Name for non-registered user
    email: { type: String, required: true }, // Email for non-registered user
    relation: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
}, { timestamps: true });
exports.PartnerRequest = (0, mongoose_1.model)('PartnerRequest', partnerRequestSchema);
