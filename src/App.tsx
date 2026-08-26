import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import Dashboard from "./pages/Dashboard/dashboard";
import ResetPassword from "./pages/settings/resetpassword";
import MyAccount from "./pages/settings/myaccount";
import Feedback from "./pages/settings/feedback";
import Report from "./pages/Dashboard/Report";
import Notifications from "./pages/settings/notifications";
import Billing from "./pages/settings/billing";
import Plans from "./pages/settings/plans";
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
import PlanManagement from "./pages/admin/PlanManagement";
import FeatureManagement from "./pages/admin/FeatureManagement";
import SubscriptionDashboard from "./pages/admin/SubscriptionDashboard";
function App() {
  const { authState } = useAuth();

  return (
    <>
      <Toaster position="top-center" />
      <SubscriptionProvider>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            authState.isAuthenticated
              ? <Navigate to="/dashboard" replace />
              : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/login"
          element={
            authState.isAuthenticated
              ? <Navigate to="/dashboard" replace />
              : <Login />
          }
        />
        <Route
          path="/signup"
          element={
            authState.isAuthenticated
              ? <Navigate to="/dashboard" replace />
              : <Signup />
          }
        />
       
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            {/* Free plan features — always accessible */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/news" element={<News />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/myaccount" element={<MyAccount />} />
            <Route path="/plans" element={<Plans></Plans>} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/main" element={<Main></Main>}/>
            <Route path="/manage-accounts" element={<ManageAccounts />}/>
            <Route path="/transactions" element={<Transactions />}/>
            <Route path="/security" element={<Security />} />
            <Route path="/profile" element={<Profile></Profile>}/>
            

            {/* Analytics — requires 'analytics' feature (Basic+) */}
            <Route element={<FeatureRoute feature="analytics" />}>
              <Route path="/analytics" element={<Analytics/>}/>
            </Route>

            {/* Investment Monitoring — requires 'investment_tracking' feature (Basic+) */}
            <Route element={<FeatureRoute feature="investment_tracking" />}>
              <Route path="/investment-monitoring" element={<Investment />} />
            </Route>

            {/* Cards — requires 'cards' feature (Basic+) */}
            <Route element={<FeatureRoute feature="cards" />}>
              <Route path="/cards" element={<Cards />}/>
            </Route>

            {/* Transactions (Finance) — requires 'transactions' feature (Free+) */}
            <Route path="/transaction" element={<Transaction />}/>
            <Route path="/transaction-details" element={<TransactionDetails />} />
            <Route path="/goals" element={<Goals />} />

            {/* Reports — requires 'reports' feature (Advanced+) */}
            <Route element={<FeatureRoute feature="reports" />}>
              <Route path="/reports-analytics" element={<Report/>} />
              <Route path="/report-generation" element={<Report />} />
            </Route>

            {/* User Management — requires 'user_management' feature (Pro) */}
            <Route element={<FeatureRoute feature="user_management" />}>
              <Route path="/user-management" element={<UserManagement />}/>
            </Route>

            {/* Admin Routes (role-gated internally) */}
            <Route path="/admin/plans" element={<PlanManagement />} />
            <Route path="/admin/features" element={<FeatureManagement />} />
            <Route path="/admin/subscriptions" element={<SubscriptionDashboard />} />
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