import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

function ProtectedRoute() {
  const { authState } = useAuth();

  return authState.isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace />
  );
}

export default ProtectedRoute;