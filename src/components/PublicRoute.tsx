 import { JSX } from "react";
import { Navigate, useLocation } from "react-router-dom";

export const PublicRoute = ({ children }: { children: JSX.Element }) => {

  const token = localStorage.getItem("accessToken");
  const location = useLocation();

  if (token) {
    const previous = location.state?.from;
    return <Navigate to={previous || "/ticketing"} replace />;
    
  }
  

  return children;
};


