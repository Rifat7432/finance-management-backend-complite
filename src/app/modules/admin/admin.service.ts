import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { User } from '../user/user.model';
import { Subscription } from '../subscription/subscription.model';
import { endOfMonth, startOfMonth, subMonths } from 'date-fns';
import { Income } from '../income/income.model';
import { Expense } from '../expense/expense.model';
import { Budget } from '../budget/budget.model';
import { Debt } from '../debt/debt.model';
import { Appointment } from '../appointment/appointment.model';
import { IAppointment } from '../appointment/appointment.interface';
import { NotificationSettings } from '../notificationSettings/notificationSettings.model';
import { INotificationSetting } from '../notificationSettings/notificationSettings.interface';
import config from '../../../config';
import { Content } from '../content/content.model';

interface MonthlyData {
     month: string;
     value: number;
}
interface DashboardStats {
     activeUsers: {
          count: number;
          percentageChange: number;
     };
     engagementRate: {
          rate: number;
          percentageChange: number;
     };
     totalContentViews: {
          count: number;
          percentageChange: number;
     };
     monthRevenue: {
          amount: number;
          percentageChange: number;
     };
     totalSubscribers: number;
     financeOverview: {
          total: number;
          subscription: number;
          adRevenue: number;
     };
     usageEngagementTrends: MonthlyData[];
     revenueChart: MonthlyData[];
}
import mongoose from 'mongoose';

const determineStatus = (ratio: number): 'on track' | 'medium risk' | 'high risk' => {
  if (ratio >= 1.2) return 'on track'; // Income comfortably exceeds expenses
  if (ratio >= 0.9) return 'medium risk'; // Roughly balanced
  return 'high risk'; // Income too low
};

/**
 * Get financial overview for all users (with pagination + search)
 */
export const getUserFinancialOverviewFromDB = async (
  search: string = '',
  page: number = 1,
  limit: number = 10
) => {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

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
  const [users, total] = await Promise.all([
    User.find({ ...searchFilter, role: 'USER', isDeleted: false })
      .select('name email image')
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments({ ...searchFilter, role: 'USER', isDeleted: false }),
  ]);

  // Process each user
  const userFinancialData = await Promise.all(
    users.map(async (user) => {
      // Get all financial records for the current month
      const [incomes, expenses, budgets, debts] = await Promise.all([
        Income.find({
          userId: user._id,
          isDeleted: false,
          // Income is received in this month
          receiveDate: { $gte: monthStart, $lte: monthEnd },
        }).lean(),
        Expense.find({
          userId: user._id,
          isDeleted: false,
          // Expenses that end/occur in this month
          endDate: { $gte: monthStart, $lte: monthEnd }
        }).lean(),
        Budget.find({
          userId: user._id,
          isDeleted: false,
          createdAt: { $gte: monthStart, $lte: monthEnd },
        }).lean(),
        Debt.find({
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
      let incomeStatus: 'on track' | 'medium risk' | 'high risk';
      const netSavings = totalIncome - totalExpenses - totalDebt;
      if (netSavings >= totalIncome * 0.2) {
        incomeStatus = 'on track'; // Saving 20%+
      } else if (netSavings > 0) {
        incomeStatus = 'medium risk'; // Positive but low savings
      } else {
        incomeStatus = 'high risk'; // Spending more than earning
      }

      // Get last activity date from all financial records
      const allDates = [
        ...incomes.map((x: any) => x.createdAt),
        ...expenses.map((x: any) => x.createdAt),
        ...budgets.map((x: any) => x.createdAt),
        ...debts.map((x: any) => x.createdAt),
      ].filter(Boolean);

      const lastActivity = allDates.length
        ? new Date(Math.max(...allDates.map((d) => new Date(d).getTime())))
        : null;

      return {
        ...user,
        financialStatus: {
          incomeStatus,
          expenseStatus,
          budgetStatus,
          debtStatus,
        },
        totals: {
          totalIncome,
          totalExpenses,
          totalBudget,
          totalDebt,
        },
        lastActivity,
      };
    })
  );

  return {
    users: userFinancialData,
    meta: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    },
  };
};

/**
 * Calculate spending level (relative to average)
 */
const getSpendingLevel = (amount: number, avg: number): 'Low' | 'Moderate' | 'High' => {
  if (avg === 0) return 'Low'; // Handle division by zero
  if (amount >= avg * 1.3) return 'High';
  if (amount >= avg * 0.7) return 'Moderate';
  return 'Low';
};

/**
 * Get Monthly Expense Analytics
 */
export const getMonthlyExpenseAnalyticsFromDB = async (userId: string) => {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const lastMonthStart = startOfMonth(subMonths(today, 1));
  const lastMonthEnd = endOfMonth(subMonths(today, 1));

  // --- 1️⃣ Current month expenses by category ---
  const currentMonthExpenses = await Expense.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
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
  const lastMonthExpenses = await Expense.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
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
  const totalLast = lastMonthExpenses[0]?.totalSpent || 0;

  // Calculate growth percentage
  let spendingGrowth: string;
  if (totalLast === 0) {
    spendingGrowth = totalCurrent > 0 ? '100.0' : '0';
  } else {
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
};


const updateAppointmentStatusIntoDB = async (id: string): Promise<IAppointment | null> => {
     const appointment = await Appointment.findById(id);
     if (!appointment) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Appointment not found');
     }
     const updatedAppointment = await Appointment.findByIdAndUpdate(id, { status: 'complete' }, { new: true });
     return updatedAppointment;
};

const getNotificationSettingsFromDB = async (userId: string): Promise<INotificationSetting | null> => {
     const settings = await NotificationSettings.findOne({ userId });
     if (!settings) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Notification settings not found');
     }
     return settings;
};

const updateNotificationSettingsToDB = async (userId: string, payload: Partial<INotificationSetting>): Promise<INotificationSetting | null> => {
     const isUserExist = await User.findById(userId);
     if (!isUserExist || isUserExist.isDeleted || isUserExist.status !== 'active') {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
     }
     const updated = await NotificationSettings.findOneAndUpdate({ userId }, payload, { new: true });
     if (!updated) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update notification settings');
     }
     return updated;
};

const getAdminDashboardStats = async (year?: number): Promise<DashboardStats> => {
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
  const [currentMonthUsers, lastMonthUsers, totalUsers] = await Promise.all([
    User.countDocuments({
      updatedAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
      status: 'active'
    }),
    User.countDocuments({
      updatedAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      status: 'active'
    }),
    User.countDocuments({ status: 'active' })
  ]);

  const userPercentageChange = lastMonthUsers > 0 
    ? ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 
    : 0;

  // ========== ENGAGEMENT RATE ==========
  // Calculate engagement as (active users / total users) * 100
  const currentEngagementRate = totalUsers > 0 ? (currentMonthUsers / totalUsers) * 100 : 0;
  
  const totalUsersLastMonth = await User.countDocuments({
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
  const currentMonthContent = await Content.aggregate([
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

  const lastMonthContent = await Content.aggregate([
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

  const currentMonthViews = currentMonthContent[0]?.totalViews || 0;
  const lastMonthViews = lastMonthContent[0]?.totalViews || 0;

  const viewsPercentageChange = lastMonthViews > 0
    ? ((currentMonthViews - lastMonthViews) / lastMonthViews) * 100
    : 0;

  // ========== REVENUE DATA ==========
  const uniqueUserIds = await Subscription.distinct('subscriptionId', {
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
    
    const batchPromises = batch.map(async (appUserId) => {
      try {
        const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${appUserId}`, {
          headers: {
            'Authorization': `Bearer ${config.revenuecat_secret_key}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) return null;
        const data = await res.json();
        return { appUserId, subscriber: data.subscriber };
      } catch (error) {
        console.error(`Failed to fetch revenue for user ${appUserId}:`, error);
        return null;
      }
    });

    const results = await Promise.all(batchPromises);

    results.forEach(result => {
      if (!result || !result.subscriber) return;

      const { subscriber } = result;
      totalSubscribers++;

      // Process subscriptions
      if (subscriber.subscriptions) {
        Object.values(subscriber.subscriptions).forEach((subscription: any) => {
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
        Object.values(subscriber.non_subscriptions).forEach((purchases: any) => {
          if (Array.isArray(purchases)) {
            purchases.forEach((purchase: any) => {
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
};

export const AdminService = {
     getUserFinancialOverviewFromDB,
     getMonthlyExpenseAnalyticsFromDB,
     updateAppointmentStatusIntoDB,
     getNotificationSettingsFromDB,
     updateNotificationSettingsToDB,
     getAdminDashboardStats,
};
