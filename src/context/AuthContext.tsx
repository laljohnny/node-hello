import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export type Tenant = {
  id: string;
  displayname: string;
  slug: string;
  // Optional fields that are present on tenant objects returned from the API
  name?: string;
  email?: string;
  phone?: string;
};

type AuthContextType = {
  user: any | null;
  tenantList: Tenant[];
  setTenantList: (tenants: Tenant[]) => void;
  login: (userDetails: any) => void;
  logout: () => void;
};
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const [tenantList, setTenantList] = useState<Tenant[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("userData");
    const storedTenants = localStorage.getItem("tenantList");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    if (storedTenants) {
      setTenantList(JSON.parse(storedTenants));
    }
  }, []);

  const login = (userDetails: any) => {
    setUser(userDetails);
    localStorage.setItem("userData", JSON.stringify(userDetails));
  };

  const handleSetTenantList = useCallback((tenants: Tenant[]) => {
    setTenantList(tenants);
    // localStorage.setItem("tenantList", JSON.stringify(tenants));
  }, []);

  const logout = () => {
    setUser(null);
    setTenantList([]);
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, tenantList, setTenantList: handleSetTenantList, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
