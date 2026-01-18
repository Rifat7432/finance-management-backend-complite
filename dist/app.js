"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const routes_1 = __importDefault(require("./routes"));
const morgen_1 = require("./shared/morgen");
const globalErrorHandler_1 = __importDefault(require("./globalErrorHandler/globalErrorHandler"));
const notFound_1 = require("./globalErrorHandler/notFound");
const welcome_1 = require("./utils/welcome");
const app = (0, express_1.default)();
// 👉 Import the cron job here
require("./app/cronJobs/reminderScheduler"); // ✅ This runs the job on app start
require("./app/cronJobs/BudgetScheduler"); // ✅ This runs the job on app start
require("./app/cronJobs/dateNightScheduler"); // ✅ This runs the job on app start
require("./app/cronJobs/debtReminderScheduler"); // ✅ This runs the job on app start
require("./app/cronJobs/IncomeScheduler"); // ✅ This runs the job on app start 11
require("./app/cronJobs/ExpensesScheduler"); // ✅ starts Expense scheduler on app start 11
require("./app/cronJobs/AutoSavingGoalUpdateScheduler"); // ✅ starts Auto Saving Goal Update scheduler on app start
require("./app/cronJobs/MonthlyFinanceRemainder"); // ✅ starts Auto Saving Goal Update scheduler on app start
// ----------------------------
// 🖼️ View Engine Setup (EJS)
// ----------------------------
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, 'views'));
// ----------------------------
// 🧾 Request Logging (Morgan)
// ----------------------------
app.use(morgen_1.Morgan.successHandler);
app.use(morgen_1.Morgan.errorHandler);
// ----------------------------
// 🌐 CORS Middleware
// ----------------------------
app.use((0, cors_1.default)({
    origin: "https://dashboard.rehoapp.co.uk",
    credentials: true
}));
// ----------------------------
// 📦 Body Parsers
// ----------------------------
app.use(express_1.default.json({ limit: '50mb' })); // ✅ Increase limit
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// ---------------------------
// 📁 Static File Serving
// ----------------------------
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use('/public', express_1.default.static(path_1.default.join(__dirname, '../public')));
// ----------------------------
// 🚦 Main API Routes
// ----------------------------
app.use('/api/v1', routes_1.default);
// ----------------------------
// 🏠 Root Route
// ----------------------------
app.get('/', (req, res) => {
    res.send((0, welcome_1.welcome)());
});
// ----------------------------
// ❌ 404 - Not Found Handler
// ----------------------------
app.use(notFound_1.notFound);
// ----------------------------
// 🛑 Global Error Handler
// ----------------------------
app.use(globalErrorHandler_1.default);
exports.default = app;
