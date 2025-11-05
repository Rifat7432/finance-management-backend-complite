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
exports.AdminService = exports.getMonthlyExpenseAnalyticsFromDB = exports.getUserFinancialOverviewFromDB = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const user_model_1 = require("../user/user.model");
const subscription_model_1 = require("../subscription/subscription.model");
const date_fns_1 = require("date-fns");
const income_model_1 = require("../income/income.model");
const expense_model_1 = require("../expense/expense.model");
const budget_model_1 = require("../budget/budget.model");
const debt_model_1 = require("../debt/debt.model");
const appointment_model_1 = require("../appointment/appointment.model");
const notificationSettings_model_1 = require("../notificationSettings/notificationSettings.model");
const config_1 = __importDefault(require("../../../config"));
const content_model_1 = require("../content/content.model");
const mongoose_1 = __importDefault(require("mongoose"));
const determineStatus = (ratio) => {
    if (ratio >= 1.2)
        return 'on track'; // Income comfortably exceeds expenses
    if (ratio >= 0.9)
        return 'medium risk'; // Roughly balanced
    return 'high risk'; // Income too low
};
/**
 * Get financial overview for all users (with pagination + search)
 */
const getUserFinancialOverviewFromDB = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (search = '', page = 1, limit = 10) {
    const today = new Date();
    const monthStart = (0, date_fns_1.startOfMonth)(today);
    const monthEnd = (0, date_fns_1.endOfMonth)(today);
    // Search filter
    const searchFilter = search
        ? {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ],
        }
        : {};
    // Pagination
    const skip = (page - 1) * limit;
    // Fetch users with search + pagination
    const [users, total] = yield Promise.all([
        user_model_1.User.find(Object.assign(Object.assign({}, searchFilter), { role: 'USER', isDeleted: false }))
            .select('name email image')
            .skip(skip)
            .limit(limit)
            .lean(),
        user_model_1.User.countDocuments(Object.assign(Object.assign({}, searchFilter), { role: 'USER', isDeleted: false })),
    ]);
    // Process each user
    const userFinancialData = yield Promise.all(users.map((user) => __awaiter(void 0, void 0, void 0, function* () {
        // Get all financial records for the current month
        const [incomes, expenses, budgets, debts] = yield Promise.all([
            income_model_1.Income.find({
                userId: user._id,
                isDeleted: false,
                // Income is received in this month
                receiveDate: { $gte: monthStart, $lte: monthEnd },
            }).lean(),
            expense_model_1.Expense.find({
                userId: user._id,
                isDeleted: false,
                // Expenses that end/occur in this month
                endDate: { $gte: monthStart, $lte: monthEnd }
            }).lean(),
            budget_model_1.Budget.find({
                userId: user._id,
                isDeleted: false,
                createdAt: { $gte: monthStart, $lte: monthEnd },
            }).lean(),
            debt_model_1.Debt.find({
                userId: user._id,
                isDeleted: false,
                createdAt: { $gte: monthStart, $lte: monthEnd },
            }).lean(),
        ]);
        // Calculate totals
        const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
        // For debts, use monthlyPayment as the monthly impact
        const totalDebt = debts.reduce((sum, d) => sum + (d.monthlyPayment || 0), 0);
        // Calculate ratios (avoid division by zero)
        const expenseRatio = totalExpenses > 0 ? totalIncome / totalExpenses : totalIncome > 0 ? 999 : 1;
        const budgetRatio = totalBudget > 0 ? totalIncome / totalBudget : totalIncome > 0 ? 999 : 1;
        // Debt ratio: Can they cover monthly debt payments with remaining income?
        const remainingIncome = totalIncome - totalExpenses;
        const debtRatio = totalDebt > 0 ? remainingIncome / totalDebt : remainingIncome > 0 ? 999 : 1;
        // Determine status for each category
        const expenseStatus = determineStatus(expenseRatio);
        const budgetStatus = determineStatus(budgetRatio);
        const debtStatus = determineStatus(debtRatio);
        // Income status: Overall financial health
        let incomeStatus;
        const netSavings = totalIncome - totalExpenses - totalDebt;
        if (netSavings >= totalIncome * 0.2) {
            incomeStatus = 'on track'; // Saving 20%+
        }
        else if (netSavings > 0) {
            incomeStatus = 'medium risk'; // Positive but low savings
        }
        else {
            incomeStatus = 'high risk'; // Spending more than earning
        }
        // Get last activity date from all financial records
        const allDates = [
            ...incomes.map((x) => x.createdAt),
            ...expenses.map((x) => x.createdAt),
            ...budgets.map((x) => x.createdAt),
            ...debts.map((x) => x.createdAt),
        ].filter(Boolean);
        const lastActivity = allDates.length
            ? new Date(Math.max(...allDates.map((d) => new Date(d).getTime())))
            : null;
        return Object.assign(Object.assign({}, user), { financialStatus: {
                incomeStatus,
                expenseStatus,
                budgetStatus,
                debtStatus,
            }, totals: {
                totalIncome,
                totalExpenses,
                totalBudget,
                totalDebt,
            }, lastActivity });
    })));
    return {
        users: userFinancialData,
        meta: {
            total,
            page,
            limit,
            totalPage: Math.ceil(total / limit),
        },
    };
});
exports.getUserFinancialOverviewFromDB = getUserFinancialOverviewFromDB;
/**
 * Calculate spending level (relative to average)
 */
const getSpendingLevel = (amount, avg) => {
    if (avg === 0)
        return 'Low'; // Handle division by zero
    if (amount >= avg * 1.3)
        return 'High';
    if (amount >= avg * 0.7)
        return 'Moderate';
    return 'Low';
};
/**
 * Get Monthly Expense Analytics
 */
const getMonthlyExpenseAnalyticsFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const today = new Date();
    const monthStart = (0, date_fns_1.startOfMonth)(today);
    const monthEnd = (0, date_fns_1.endOfMonth)(today);
    const lastMonthStart = (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(today, 1));
    const lastMonthEnd = (0, date_fns_1.endOfMonth)((0, date_fns_1.subMonths)(today, 1));
    // --- 1️⃣ Current month expenses by category ---
    const currentMonthExpenses = yield expense_model_1.Expense.aggregate([
        {
            $match: {
                userId: new mongoose_1.default.Types.ObjectId(userId),
                isDeleted: false,
                // Expenses that end/occur in this month
                endDate: { $gte: monthStart, $lte: monthEnd }
            },
        },
        {
            $group: {
                _id: '$name', // Using 'name' as grouping since no 'category' field exists
                totalSpent: { $sum: '$amount' },
            },
        },
        {
            $sort: { totalSpent: -1 }, // Sort by highest spending
        },
    ]);
    // --- 2️⃣ Last month total expenses ---
    const lastMonthExpenses = yield expense_model_1.Expense.aggregate([
        {
            $match: {
                userId: new mongoose_1.default.Types.ObjectId(userId),
                isDeleted: false,
                // Expenses that end/occur in last month
                endDate: { $gte: lastMonthStart, $lte: lastMonthEnd }
            },
        },
        {
            $group: {
                _id: null,
                totalSpent: { $sum: '$amount' },
            },
        },
    ]);
    const totalCurrent = currentMonthExpenses.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalLast = ((_a = lastMonthExpenses[0]) === null || _a === void 0 ? void 0 : _a.totalSpent) || 0;
    // Calculate growth percentage
    let spendingGrowth;
    if (totalLast === 0) {
        spendingGrowth = totalCurrent > 0 ? '100.0' : '0';
    }
    else {
        const growthPercent = ((totalCurrent - totalLast) / totalLast) * 100;
        spendingGrowth = growthPercent.toFixed(1);
    }
    // --- 3️⃣ Calculate spending levels ---
    const avgSpending = currentMonthExpenses.length > 0 ? totalCurrent / currentMonthExpenses.length : 0;
    const spendingHeatmap = currentMonthExpenses.map((exp) => ({
        category: exp._id || 'Uncategorized', // Using name as category
        amount: exp.totalSpent,
        spendingLevel: getSpendingLevel(exp.totalSpent, avgSpending),
    }));
    // --- 4️⃣ Top overspending categories ---
    const topCategories = currentMonthExpenses.slice(0, 3).map((c) => c._id || 'Uncategorized');
    return {
        totalMonthlySpending: totalCurrent,
        topOverspendingCategories: topCategories,
        spendingGrowth: `${spendingGrowth}%`,
        spendingHeatmap,
    };
});
exports.getMonthlyExpenseAnalyticsFromDB = getMonthlyExpenseAnalyticsFromDB;
const updateAppointmentStatusIntoDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const appointment = yield appointment_model_1.Appointment.findById(id);
    if (!appointment) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Appointment not found');
    }
    const updatedAppointment = yield appointment_model_1.Appointment.findByIdAndUpdate(id, { status: 'complete' }, { new: true });
    return updatedAppointment;
});
const getNotificationSettingsFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const settings = yield notificationSettings_model_1.NotificationSettings.findOne({ userId });
    if (!settings) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Notification settings not found');
    }
    return settings;
});
const updateNotificationSettingsToDB = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const isUserExist = yield user_model_1.User.findById(userId);
    if (!isUserExist || isUserExist.isDeleted || isUserExist.status !== 'active') {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    const updated = yield notificationSettings_model_1.NotificationSettings.findOneAndUpdate({ userId }, payload, { new: true });
    if (!updated) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update notification settings');
    }
    return updated;
});
const getAdminDashboardStats = (year) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const targetYear = year || new Date().getFullYear();
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? targetYear - 1 : targetYear;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // ========== DATE RANGES ==========
    const currentMonthStart = new Date(targetYear, currentMonth, 1);
    const currentMonthEnd = new Date(targetYear, currentMonth + 1, 0);
    const lastMonthStart = new Date(lastMonthYear, lastMonth, 1);
    const lastMonthEnd = new Date(lastMonthYear, lastMonth + 1, 0);
    // ========== ACTIVE USERS ==========
    // Users who have logged in or been active this month
    const [currentMonthUsers, lastMonthUsers, totalUsers] = yield Promise.all([
        user_model_1.User.countDocuments({
            updatedAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
            status: 'active'
        }),
        user_model_1.User.countDocuments({
            updatedAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
            status: 'active'
        }),
        user_model_1.User.countDocuments({ status: 'active' })
    ]);
    const userPercentageChange = lastMonthUsers > 0
        ? ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100
        : 0;
    // ========== ENGAGEMENT RATE ==========
    // Calculate engagement as (active users / total users) * 100
    const currentEngagementRate = totalUsers > 0 ? (currentMonthUsers / totalUsers) * 100 : 0;
    const totalUsersLastMonth = yield user_model_1.User.countDocuments({
        createdAt: { $lte: lastMonthEnd },
        status: 'active'
    });
    const lastEngagementRate = totalUsersLastMonth > 0
        ? (lastMonthUsers / totalUsersLastMonth) * 100
        : 0;
    const engagementPercentageChange = lastEngagementRate > 0
        ? ((currentEngagementRate - lastEngagementRate) / lastEngagementRate) * 100
        : 0;
    // ========== TOTAL CONTENT VIEWS ==========
    // Get total views from all content
    const currentMonthContent = yield content_model_1.Content.aggregate([
        {
            $match: {
                createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd }
            }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: '$views' }
            }
        }
    ]);
    const lastMonthContent = yield content_model_1.Content.aggregate([
        {
            $match: {
                createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
            }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: '$views' }
            }
        }
    ]);
    const currentMonthViews = ((_a = currentMonthContent[0]) === null || _a === void 0 ? void 0 : _a.totalViews) || 0;
    const lastMonthViews = ((_b = lastMonthContent[0]) === null || _b === void 0 ? void 0 : _b.totalViews) || 0;
    const viewsPercentageChange = lastMonthViews > 0
        ? ((currentMonthViews - lastMonthViews) / lastMonthViews) * 100
        : 0;
    // ========== REVENUE DATA ==========
    const uniqueUserIds = yield subscription_model_1.Subscription.distinct('subscriptionId', {
        createdAt: {
            $gte: new Date(`${targetYear}-01-01`),
            $lt: new Date(`${targetYear + 1}-01-01`)
        }
    });
    let totalSubscribers = 0;
    let monthlyRevenue = Array(12).fill(0);
    let currentMonthRevenue = 0;
    let lastMonthRevenue = 0;
    const batchSize = 10;
    // Fetch revenue from RevenueCat
    for (let i = 0; i < uniqueUserIds.length; i += batchSize) {
        const batch = uniqueUserIds.slice(i, i + batchSize);
        const batchPromises = batch.map((appUserId) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const res = yield fetch(`https://api.revenuecat.com/v1/subscribers/${appUserId}`, {
                    headers: {
                        'Authorization': `Bearer ${config_1.default.revenuecat_secret_key}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (!res.ok)
                    return null;
                const data = yield res.json();
                return { appUserId, subscriber: data.subscriber };
            }
            catch (error) {
                console.error(`Failed to fetch revenue for user ${appUserId}:`, error);
                return null;
            }
        }));
        const results = yield Promise.all(batchPromises);
        results.forEach(result => {
            if (!result || !result.subscriber)
                return;
            const { subscriber } = result;
            totalSubscribers++;
            // Process subscriptions
            if (subscriber.subscriptions) {
                Object.values(subscriber.subscriptions).forEach((subscription) => {
                    const purchaseDate = subscription.purchase_date ? new Date(subscription.purchase_date) : null;
                    if (purchaseDate && purchaseDate.getFullYear() === targetYear) {
                        const monthIndex = purchaseDate.getMonth();
                        const price = parseFloat(subscription.price_in_purchased_currency) || 0;
                        monthlyRevenue[monthIndex] += price;
                        if (monthIndex === currentMonth) {
                            currentMonthRevenue += price;
                        }
                        if (monthIndex === lastMonth && purchaseDate.getFullYear() === lastMonthYear) {
                            lastMonthRevenue += price;
                        }
                    }
                });
            }
            // Process non-subscription purchases
            if (subscriber.non_subscriptions) {
                Object.values(subscriber.non_subscriptions).forEach((purchases) => {
                    if (Array.isArray(purchases)) {
                        purchases.forEach((purchase) => {
                            const purchaseDate = purchase.purchase_date ? new Date(purchase.purchase_date) : null;
                            if (purchaseDate && purchaseDate.getFullYear() === targetYear) {
                                const monthIndex = purchaseDate.getMonth();
                                const price = parseFloat(purchase.price_in_purchased_currency) || 0;
                                monthlyRevenue[monthIndex] += price;
                                if (monthIndex === currentMonth) {
                                    currentMonthRevenue += price;
                                }
                                if (monthIndex === lastMonth && purchaseDate.getFullYear() === lastMonthYear) {
                                    lastMonthRevenue += price;
                                }
                            }
                        });
                    }
                });
            }
        });
    }
    const revenuePercentageChange = lastMonthRevenue > 0
        ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;
    // ========== USAGE ENGAGEMENT TRENDS ==========
    // Shows monthly revenue as bar chart
    const usageEngagementTrends = months.map((month, index) => ({
        month,
        value: Math.round(monthlyRevenue[index] * 100) / 100
    }));
    // ========== FINANCE OVERVIEW ==========
    const totalYearlyRevenue = monthlyRevenue.reduce((sum, val) => sum + val, 0);
    // Calculate subscription revenue (assume 90% of total is subscription, 10% is ads)
    // Adjust this based on your actual ad revenue tracking
    const subscriptionRevenue = totalYearlyRevenue * 0.9;
    const adRevenue = totalYearlyRevenue * 0.1;
    // Revenue chart data
    const revenueChart = months.map((month, index) => ({
        month,
        value: Math.round(monthlyRevenue[index] * 100) / 100
    }));
    return {
        activeUsers: {
            count: currentMonthUsers,
            percentageChange: Math.round(userPercentageChange * 100) / 100
        },
        engagementRate: {
            rate: Math.round(currentEngagementRate * 100) / 100,
            percentageChange: Math.round(engagementPercentageChange * 100) / 100
        },
        totalContentViews: {
            count: currentMonthViews,
            percentageChange: Math.round(viewsPercentageChange * 100) / 100
        },
        monthRevenue: {
            amount: Math.round(currentMonthRevenue * 100) / 100,
            percentageChange: Math.round(revenuePercentageChange * 100) / 100
        },
        totalSubscribers,
        financeOverview: {
            total: Math.round(totalYearlyRevenue * 100) / 100,
            subscription: Math.round(subscriptionRevenue * 100) / 100,
            adRevenue: Math.round(adRevenue * 100) / 100
        },
        usageEngagementTrends,
        revenueChart
    };
});
exports.AdminService = {
    getUserFinancialOverviewFromDB: exports.getUserFinancialOverviewFromDB,
    getMonthlyExpenseAnalyticsFromDB: exports.getMonthlyExpenseAnalyticsFromDB,
    updateAppointmentStatusIntoDB,
    getNotificationSettingsFromDB,
    updateNotificationSettingsToDB,
    getAdminDashboardStats,
};
