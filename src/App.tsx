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
import MainLayout from "./MainLayout";
import ProtectedRoute from "./ProtectedLayout";
import Main from "./pages/Dashboard/main";
import Analytics from "./pages/Dashboard/analytics";
import ManageAccounts from "./pages/Dashboard/ManageAccounts";
import Investment from "./pages/manageaccounts/Investment";
import RestPassword from "./pages/settings/resetpassword";
import Security from "./pages/manageaccounts/Security";
import Profile from "./pages/finance/Profile";
import Cards from "./pages/finance/Cards";
import Transaction from "./pages/finance/Transaction";
import TransactionDetails from "./pages/finance/Transactiondetail";
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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/news" element={<News />} />
            <Route path="/reset-password" element={<RestPassword></RestPassword>} />
            <Route path="/myaccount" element={<MyAccount />} />
            <Route path="/plans" element={<Plans></Plans>} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/main" element={<Main></Main>}/>
            <Route path="/analytics" element={<Analytics/>}/>
            <Route path="/manage-accounts" element={<ManageAccounts />}/>
            <Route path="/user-management" element={<UserManagement />}/>
            <Route path="/transactions" element={<Transactions />}/>
            <Route path="/investment-monitoring" element={<Investment />} />
            <Route path="/reports-analytics" element={<Report/>} />
            <Route path="security" element={<Security />} />
            <Route path="/profile" element={<Profile></Profile>}/>
            <Route path="/cards" element={<Cards />}/>
            <Route path="/transaction" element={<Transaction />}/>
            <Route path="/transaction-details" element={<TransactionDetails />} />
            <Route path="/report-generation" element={<Report />} />
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