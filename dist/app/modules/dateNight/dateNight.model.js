"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateNight = void 0;
const mongoose_1 = require("mongoose");
function getAppointmentUTC(dateStr, timeStr, timeZone) {
    // Normalize timeStr
    timeStr = timeStr.replace(/\u202F/g, ' ').trim();
    const [time, modifier] = timeStr.split(' ');
    if (!time || !modifier)
        throw new Error('Invalid time string');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12)
        hours += 12;
    if (modifier === 'AM' && hours === 12)
        hours = 0;
    // Parse date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        throw new Error('Invalid date string');
    }
    // Get the UTC timestamp for this date in the target timezone
    const parts = date.toLocaleString('en-US', { timeZone }).split(',')[0].split('/');
    const [month, day, year] = parts.map(Number);
    // Build the Date object in UTC
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
    return utcDate;
}
const dateNightSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: {
        type: String,
        required: true,
        trim: true,
    },
    budget: {
        type: Number,
        required: true,
        min: 0,
    },
    repeatEvery: {
        type: String,
        enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly', 'One-Off'],
        default: 'Monthly',
    },
    date: {
        type: Date,
        required: true,
    },
    time: {
        type: String, // could also be Date if storing full datetime
        required: true,
    },
    location: {
        type: String,
        trim: true,
    },
    UTCDate: {
        type: Date,
        default: new Date(),
    },
    isRemainderSent: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
dateNightSchema.pre('save', function (next) {
    if (!this.isModified('date') && !this.isModified('time')) {
        return next();
    }
    console.log('this', getAppointmentUTC(this.date, this.time, 'Europe/London'), this.time, this.date);
    this.UTCDate = getAppointmentUTC(this.date, this.time, 'Europe/London');
    next();
});
exports.DateNight = (0, mongoose_1.model)('DateNight', dateNightSchema);
