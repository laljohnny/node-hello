import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ReactElement } from "react";
export const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const { user } = useAuth();
  const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");
  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        
      />
    );
  }
  return children;
};