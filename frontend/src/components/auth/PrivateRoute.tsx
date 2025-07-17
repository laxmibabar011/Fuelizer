import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface PrivateRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const PrivateRoute = ({ children, allowedRoles }: PrivateRouteProps) => {
  const { authUser, loading } = useAuth();
  if (loading) {
    // Optionally, return a spinner or null while loading
    return null;
  }
  if (!authUser) {
    return <Navigate to="/signin" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(authUser.role)) {
    return <Navigate to="/" replace />; // Or a Not Authorized page
  }
  return <>{children}</>;
};

export default PrivateRoute; 