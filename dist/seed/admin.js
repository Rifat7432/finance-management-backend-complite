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
exports.seedAdmin = void 0;
const user_model_1 = require("../app/modules/user/user.model");
const config_1 = __importDefault(require("../config"));
const user_1 = require("../enums/user");
const seedAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if admin already exists
        const existingAdmin = yield user_model_1.User.findOne({ role: user_1.USER_ROLES.ADMIN, email: config_1.default.admin.email });
        if (existingAdmin) {
            console.log('Admin already exists');
            return;
        }
        // Prepare payload
        const payload = {
            name: 'Admin',
            email: config_1.default.admin.email,
            password: config_1.default.admin.password, // will be hashed inside createUserToDB if you handle hashing there
            role: user_1.USER_ROLES.ADMIN, // set role to admin
            verified: true,
            image: 'https://example.com/admin-image.png',
        };
        yield user_model_1.User.create(payload);
    }
    catch (error) {
        console.error('Error seeding admin:', error);
    }
});
exports.seedAdmin = seedAdmin;
