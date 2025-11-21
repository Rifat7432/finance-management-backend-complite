import { Router } from 'express';
import { UserRouter } from '../app/modules/user/user.route';
import { AuthRouter } from '../app/modules/auth/auth.route';
import { ExpenseRouter } from '../app/modules/expense/expense.route';
import { DebtRouter } from '../app/modules/debt/debt.route';
import { AppointmentRouter } from '../app/modules/appointment/appointment.route';
import { BudgetRouter } from '../app/modules/budget/budget.route';
import { SavingGoalRouter } from '../app/modules/savingGoal/savingGoal.route';
import { IncomeRouter } from '../app/modules/income/income.route';
import { AdminRoutes } from '../app/modules/admin/admin.route';
import { AdRouter } from '../app/modules/ad/ad.route';
import { SubscriptionRoutes } from '../app/modules/subscription/subscription.routes';
import { AnalyticsRouter } from '../app/modules/analytics/analytics.route';
import { ContentRouter } from '../app/modules/content/content.route';
import { CalculatorRouter } from '../app/modules/calculator/calculator.route';
import { DateNightRouter } from '../app/modules/dateNight/dateNight.route';
import { NotificationRoutes } from '../app/modules/notification/notification.routes';
import { NotificationSettingsRouter } from '../app/modules/notificationSettings/notificationSettings.route';
import { PartnerRequestRouter } from '../app/modules/partnerRequest/partnerRequest.route';

const router = Router();
const routes: { path: string; route: Router }[] = [
     {
          path: '/auth',
          route: AuthRouter,
     },
     {
          path: '/ad',
          route: AdRouter,
     },
     {
          path: '/admin',
          route: AdminRoutes,
     },
     {
          path: '/users',
          route: UserRouter,
     },
     {
          path: '/incomes',
          route: IncomeRouter,
     },
     {
          path: '/expenses',
          route: ExpenseRouter,
     },
     {
          path: '/debts',
          route: DebtRouter,
     },
     {
          path: '/appointments',
          route: AppointmentRouter,
     },
     {
          path: '/budgets',
          route: BudgetRouter,
     },
     {
          path: '/saving-goals',
          route: SavingGoalRouter,
     },
     {
          path: '/subscriptions',
          route: SubscriptionRoutes,
     },
     {
          path: '/analytics',
          route: AnalyticsRouter,
     },
     {
          path: '/contents',
          route: ContentRouter,
     },
     {
          path: '/calculator',
          route: CalculatorRouter,
     },
     {
          path: '/date-nights',
          route: DateNightRouter,
     },
     {
          path: '/notifications',
          route: NotificationRoutes,
     },
     {
          path: '/notifications-settings',
          route: NotificationSettingsRouter,
     },
     {
          path: '/partner-requests',
          route: PartnerRequestRouter,
     },
];

routes.forEach((element) => {
     if (element?.path && element?.route) {
          router.use(element?.path, element?.route);
     }
});

export default router;
