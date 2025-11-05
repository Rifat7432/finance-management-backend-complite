import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import router from './routes';
import { Morgan } from './shared/morgen';
import globalErrorHandler from './globalErrorHandler/globalErrorHandler';
import { notFound } from './globalErrorHandler/notFound';
import { welcome } from './utils/welcome';
import config from './config';


// 👉 Import the cron job here
import './app/cronJobs/reminderScheduler'; // ✅ This runs the job on app start
import './app/cronJobs/debtReminderScheduler'; // ✅ This runs the job on app start
import './app/cronJobs/IncomeScheduler'; // ✅ This runs the job on app start
import './app/cronJobs/ExpensesScheduler'; // ✅ starts Expense scheduler on app start
import './app/cronJobs/AutoSavingGoalUpdateScheduler'; // ✅ starts Auto Saving Goal Update scheduler on app start
import './app/cronJobs/MonthlyFinanceRemainder'; // ✅ starts Auto Saving Goal Update scheduler on app start

const app: Application = express();

// ----------------------------
// 🖼️ View Engine Setup (EJS)
// ----------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ----------------------------
// 🧾 Request Logging (Morgan)
// ----------------------------
app.use(Morgan.successHandler);
app.use(Morgan.errorHandler);

// ----------------------------
// 🌐 CORS Middleware
// ----------------------------

app.use(
     cors({
          origin: 'http://localhost:3000', // ✅ no trailing slash
          credentials: true,
     }),
);


// ----------------------------
// 📦 Body Parsers
// ----------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------------
// 📁 Static File Serving
// ----------------------------
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// ----------------------------
// 🚦 Main API Routes
// ----------------------------
app.use('/api/v1', router);

// ----------------------------
// 🏠 Root Route
// ----------------------------
app.get('/', (req: Request, res: Response) => {
     res.send(welcome());
});

// ----------------------------
// ❌ 404 - Not Found Handler
// ----------------------------
app.use(notFound);

// ----------------------------
// 🛑 Global Error Handler
// ----------------------------
app.use(globalErrorHandler);

export default app;
