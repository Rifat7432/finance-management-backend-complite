"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Appointment = void 0;
const mongoose_1 = require("mongoose");
function getAppointmentUTC(dateStr, timeStr, timeZone) {
    var _a, _b, _c;
    // Parse the base date (already UTC in your case)
    const date = new Date(dateStr);
    // Parse time string like "02:56 AM"
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    // Convert 12-hour → 24-hour
    if (modifier === 'PM' && hours !== 12)
        hours += 12;
    if (modifier === 'AM' && hours === 12)
        hours = 0;
    // Format the date into the target timezone (YYYY-MM-DD)
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const parts = formatter.formatToParts(date);
    const y = (_a = parts.find((p) => p.type === 'year')) === null || _a === void 0 ? void 0 : _a.value;
    const m = (_b = parts.find((p) => p.type === 'month')) === null || _b === void 0 ? void 0 : _b.value;
    const d = (_c = parts.find((p) => p.type === 'day')) === null || _c === void 0 ? void 0 : _c.value;
    // Build ISO-like datetime in that timezone
    const localISO = `${y}-${m}-${d}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    // Convert that timezone datetime into UTC
    const utcDate = new Date(localISO + 'Z');
    return utcDate;
}
const appointmentSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    title: { type: String, required: true },
    number: { type: String, required: true },
    bestContact: { type: String, required: true },
    attendant: { type: String, required: true },
    isChild: { type: Boolean, required: true },
    approxIncome: { type: Number, required: true },
    investment: { type: Number, required: true },
    discuss: { type: String },
    reachingFor: { type: String, required: true },
    ask: { type: String, required: true },
    date: { type: String, required: true },
    timeSlot: { type: String, required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'complete'], default: 'pending' },
    UTCDate: {
        type: Date,
        default: new Date(),
    },
    isDeleted: { type: Boolean, default: false },
    isRemainderSent: { type: Boolean, default: false },
}, { timestamps: true });
appointmentSchema.pre('save', function (next) {
    if (!this.isModified('date') && !this.isModified('time')) {
        return next();
    }
    const timeSlot = this.timeSlot;
    const startTime = timeSlot.split(' - ')[0];
    this.UTCDate = getAppointmentUTC(this.date, startTime, 'Europe/London');
    next();
});
exports.Appointment = (0, mongoose_1.model)('Appointment', appointmentSchema);
