import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import Dashboard from "./pages/Dashboard/dashboard";
import ResetPassword from "./pages/settings/resetpassword";
import MyAccount from "./pages/settings/myaccount";
import Report from "./pages/Dashboard/Report";
import Notifications from "./pages/settings/notifications";
import NotificationsInbox from "./pages/settings/NotificationsInbox";
import Billing from "./pages/settings/billing";
import Plans from "./pages/settings/plans";
import Settings from "./pages/settings/Settings";
import UserManagement from "./pages/manageaccounts/Usermanagement";
import Transactions from "./pages/manageaccounts/Transactions";
import News from "./pages/News/News";
import FeatureRoute from "./Component/FeatureRoute";
import MainLayout from "./MainLayout";
import ProtectedRoute from "./ProtectedLayout";
import Main from "./pages/Dashboard/main";
import Analytics from "./pages/Dashboard/analytics";
import ManageAccounts from "./pages/Dashboard/ManageAccounts";
import Investment from "./pages/manageaccounts/Investment";
import Security from "./pages/manageaccounts/Security";
import Profile from "./pages/finance/Profile";
import Cards from "./pages/finance/Cards";
import Transaction from "./pages/finance/Transaction";
import TransactionDetails from "./pages/finance/Transactiondetail";
import Goals from "./pages/finance/Goals";
import Onboarding from "./pages/Onboarding/Onboarding";
import AdminHub from "./pages/admin/AdminHub";
import BudgetPlanning from "./pages/finance/BudgetPlanning";
import PortfolioManagement from "./pages/finance/PortfolioManagement";
import TaxReports from "./pages/finance/TaxReports";
import AuditLogViewer from "./pages/finance/AuditLogViewer";
import Roadmap from "./pages/Roadmap/Roadmap";
import FAQ from "./pages/FAQ/FAQ";
import Feedback from "./pages/settings/feedback";

function App() {
  const { authState } = useAuth();

  const loadingSpinner = (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-slate-900">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-500" />
        <span className="text-sm text-slate-500 dark:text-slate-400">Loading...</span>
      </div>
    </div>
  );

  return (
    <>
      <Toaster position="top-center" />
      <SubscriptionProvider>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            authState.loading
              ? loadingSpinner
              : authState.isAuthenticated
              ? <Navigate to="/dashboard" replace />
              : <Navigate to="/login" replace />
          }
        />
        {/*
          IMPORTANT: /login and /signup must ALWAYS render their component
          so local state (TOTP verification, form data) is never lost.
          Only redirect to dashboard once auth is confirmed and loading is done.
        */}
        <Route
          path="/login"
          element={
            !authState.loading && authState.isAuthenticated
              ? <Navigate to="/dashboard" replace />
              : <Login />
          }
        />
        <Route
          path="/signup"
          element={
            !authState.loading && authState.isAuthenticated
              ? <Navigate to="/dashboard" replace />
              : <Signup />
          }
        />
       
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            {/* Free plan features � always accessible */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/news" element={<News />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/myaccount" element={<MyAccount />} />
            <Route path="/plans" element={<Plans></Plans>} />
            <Route path="/billing" element={<Billing />} />
            
            <Route path="/notifications" element={<NotificationsInbox />} />
            <Route path="/settings/notifications" element={<Notifications />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/main" element={<Main></Main>}/>
            <Route path="/manage-accounts" element={<ManageAccounts />}/>
            <Route path="/transactions" element={<Transactions />}/>
            <Route path="/security" element={<Security />} />
            <Route path="/profile" element={<Profile></Profile>}/>
            

            {/* Analytics � requires 'analytics' feature (Basic+) */}
            <Route element={<FeatureRoute feature="analytics" />}>
              <Route path="/analytics" element={<Analytics/>}/>
            </Route>

            {/* Investment Monitoring  requires 'investment_tracking' feature (Basic+) */}
            <Route element={<FeatureRoute feature="investment_tracking" />}>
              <Route path="/investment-monitoring" element={<Investment />} />
            </Route>

            {/* Cards � requires 'cards' feature (Basic+) */}
            <Route element={<FeatureRoute feature="cards" />}>
              <Route path="/cards" element={<Cards />}/>
            </Route>

            {/* Transactions (Finance) � requires 'transactions' feature (Free+) */}
            <Route path="/transaction" element={<Transaction />}/>
            <Route path="/transaction-details" element={<TransactionDetails />} />
            <Route path="/goals" element={<Goals />} />

            {/* Reports � requires 'reports' feature (Advanced+) */}
            <Route element={<FeatureRoute feature="reports" />}>
              <Route path="/reports-analytics" element={<Report/>} />
              <Route path="/report-generation" element={<Report />} />
              <Route path="/report" element={<Report />} />
            </Route>

            {/* User Management � requires 'user_management' feature (Pro) */}
            <Route element={<FeatureRoute feature="user_management" />}>
              <Route path="/user-management" element={<UserManagement />}/>
            </Route>
           

            {/* Budget Planning � requires 'budget_planning' feature (Advanced+) */}
            <Route element={<FeatureRoute feature="budget_planning" />}>
              <Route path="/budget-planning" element={<BudgetPlanning />} />
            </Route>

            {/* Portfolio Management � requires 'portfolio_management' feature (Pro) */}
            <Route element={<FeatureRoute feature="portfolio_management" />}>
              <Route path="/portfolio-management" element={<PortfolioManagement />} />
            </Route>

            {/* Tax Reports � requires 'tax_reports' feature (Pro) */}
            <Route element={<FeatureRoute feature="tax_reports" />}>
              <Route path="/tax-reports" element={<TaxReports />} />
            </Route>

            {/* Audit Log � requires 'audit_log' feature (Pro) */}
            <Route element={<FeatureRoute feature="audit_log" />}>
              <Route path="/audit-log" element={<AuditLogViewer />} />
            </Route>

            {/* Admin Hub — single page with all admin tabs */}
            <Route path="/admin" element={<AdminHub />} />
            {/* Legacy admin sub-routes still redirect/render the hub */}
            <Route path="/admin/users" element={<AdminHub />} />
            <Route path="/user-management" element={<AdminHub />} />
            <Route path="/admin/plans" element={<AdminHub />} />
            <Route path="/admin/features" element={<AdminHub />} />
            <Route path="/admin/subscriptions" element={<AdminHub />} />
            <Route path="/admin/notifications" element={<AdminHub />} />
          </Route>
        </Route>
        <Route
          path="*"
          element={
            <Navigate
              to={authState.isAuthenticated ? "/dashboard" : "/"}
              replace
            />
          }
        />
      </Routes>
      </SubscriptionProvider>
    </>
  );
}

export default App;