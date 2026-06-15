import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Auth/Login";
import Dashboard from "./pages/Dashboard/dashboard";
import ResetPassword from "./pages/settings/resetPassword";
import MyAccount from "./pages/settings/myAccount";
import Feedback from "./pages/settings/Feedback";
import Report from "./pages/Dashboard/Report";
import Notifications from "./pages/settings/notifications";
import Billing from "./pages/settings/billing";
import Plans from "./pages/settings/plans";
import UserManagement from "./pages/manageaccounts/UserManagement";
import Transactions from "./pages/manageaccounts/Transactions";
import News from "./pages/News/News";
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
import TransactionDetails from "./pages/finance/TransactionDetail";
function App() {
  const { authState } = useAuth();
  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            authState.isAuthenticated
              ? <Navigate to="/dashboard" replace />
              : <Login />
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
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/news" element={<News />} />
            <Route path="/reset-password" element={<ResetPassword></ResetPassword>} />
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
    </>
  );
}

export default App;