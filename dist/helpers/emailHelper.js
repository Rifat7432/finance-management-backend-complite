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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailHelper = exports.sendEmailForAdmin = exports.sendEmail = void 0;
const form_data_1 = __importDefault(require("form-data"));
const mailgun_js_1 = __importDefault(require("mailgun.js"));
const colors_1 = __importDefault(require("colors"));
const config_1 = __importDefault(require("../config"));
const logger_1 = require("../shared/logger");
// Initialize Mailgun client
const mailgun = new mailgun_js_1.default(form_data_1.default);
const mg = mailgun.client({
    username: 'api',
    key: config_1.default.email.apiKey,
    url: config_1.default.email.endpoint || 'https://api.mailgun.net',
});
const DOMAIN = config_1.default.email.domain;
// Send email (to user)
const sendEmail = (values) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield mg.messages.create(DOMAIN, {
            from: `${config_1.default.email.emailHeader} <${config_1.default.email.from}>`,
            to: [values.to],
            subject: values.subject,
            html: values.html,
        });
        logger_1.logger.info(colors_1.default.green(`✅ [Reho App] Email sent successfully: ${data.id}`));
    }
    catch (error) {
        logger_1.errorLogger.error(colors_1.default.red('[Reho App] Email Error:'), error);
    }
});
exports.sendEmail = sendEmail;
// Send email to admin (for contact forms, notifications, etc.)
const sendEmailForAdmin = (values) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield mg.messages.create(DOMAIN, {
            from: `"${values.to}" <${values.to}>`,
            to: [config_1.default.email.user],
            subject: values.subject,
            html: values.html,
        });
        logger_1.logger.info(colors_1.default.green(`✅ [Reho App] Admin email sent: ${data.id}`));
    }
    catch (error) {
        logger_1.errorLogger.error(colors_1.default.red('[Reho App] Admin Email Error:'), error);
    }
});
exports.sendEmailForAdmin = sendEmailForAdmin;
exports.emailHelper = {
    sendEmail: exports.sendEmail,
    sendEmailForAdmin: exports.sendEmailForAdmin,
};
