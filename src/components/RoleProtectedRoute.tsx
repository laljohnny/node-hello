import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ReactElement } from "react";

type RoleProtectedRouteProps = {
  children: ReactElement;
  allowedRoles: string[];
};

export const RoleProtectedRoute = ({ 
  children, 
  allowedRoles 
}: RoleProtectedRouteProps) => {
  const user = JSON.parse(localStorage.getItem("userData") || "{}");
  const token = localStorage.getItem("accessToken");
  
  // First check if user is authenticated
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // Then check if user has the required role (case-insensitive comparison)
  const userRole = (user as any)?.role?.toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());
  
  if (!userRole || !normalizedAllowedRoles.includes(userRole)) {
    // Redirect to a default route or show unauthorized
    // You can customize this based on your needs
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

