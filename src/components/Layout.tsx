// src/components/Layout.tsx
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { Outlet, useOutletContext } from "react-router-dom";
import SideNav from "./SideNav";
import { useState, useEffect, useMemo, useRef } from "react";
import {PanelLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@apollo/client/react";
import { COMPANIES_QUERY } from "../graphql/queries";
import { BubbleChat } from 'flowise-embed-react'

type LayoutOutletContext = {
  setHeaderTitle: (title: string) => void;
  onMobileClose?: () => void;
};

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  // On mobile, start with panels closed. On desktop, start with sidebar open
  const [sidenavOpen, setSidenavOpen] = useState<boolean>(true);
  const [headerTitle, setHeaderTitle] = useState<string>("My Application");
  const { setTenantList } = useAuth();
  const userJwtToken = localStorage.getItem("accessToken");
  const bubbleTheme = {
    button: {
      backgroundColor: '#2563eb',
      right: 24,
      bottom: 24,
      size: 48,
      iconColor: '#ffffff',
      dragAndDrop: true,
      autoWindowOpen: { autoOpen: false }
    },

    tooltip: {
      showTooltip: false,
      tooltipMessage: 'Need help? Chat with us!',
      tooltipBackgroundColor: '#1f2937',
      tooltipTextColor: '#ffffff',
      tooltipFontSize: 14,
    },

    disclaimer: {
      title: 'Welcome to Critical Asset Assistant',
      message: 'Your intelligent companion for asset management.',
      textColor: '#f9fafb',
      buttonColor: '#1d4ed8',
      buttonText: 'Get Started',
      buttonTextColor: '#ffffff',
      blurredBackgroundColor: 'rgba(15,23,42,0.85)',
      backgroundColor: '#1e293b',
    },
    chatWindow: {
      showTitle: true,
      title: 'Critical Asset Assistant',

      welcomeMessage: 'Hello! How can I help you today?',
      backgroundColor: '#ffffff',

      starterPrompts: [
        'Show me my assets',
        'What are my locations?',
        'List asset categories',
        'Get asset summary'
      ],
      clearChatOnReload: false,
      botMessage: {
        backgroundColor: '#f1f5f9',
        textColor: '#0f172a',
        showAvatar: true,
        avatarSrc: '/icons/bot.svg',
      },

      userMessage: {
        backgroundColor: '#1d4ed8',
        textColor: '#ffffff',
        showAvatar: true,
        avatarSrc: '/icons/user.svg',
      },

      textInput: {
        placeholder: 'Type your message here...',
        backgroundColor: '#ffffff',
        textColor: '#0f172a',
        sendButtonColor: '#1d4ed8',
        autoFocus: true,
        maxChars: 500,
      },

      footer: {
        textColor: 'transparent',
        text: '',
        company: '',
      },
    },
  };
  
  // Update state when breakpoint changes
  useEffect(() => {
    if (isMobile) {
      // On mobile, keep sidebar visible but panels closed
      setSidenavOpen(false);
    } else {
      setSidenavOpen(true);
    }
  }, [isMobile]);

  // Fetch companies using GraphQL
  const { data, error, refetch } = useQuery(COMPANIES_QUERY, {
    fetchPolicy: 'cache-and-network', // Always fetch from network, but use cache if available
  });
  
  // Memoize the tenants to prevent unnecessary re-renders
  const tenants = useMemo(() => {
    if (data && typeof data === 'object' && 'companies' in data && Array.isArray(data.companies)) {
      // Map companies to Tenant format
      return (data as { companies: any[] }).companies.map((company: any) => ({
        id: company.id,
        displayname: company.name || company.displayName || '',
        slug: company.id, // Using id as slug, adjust if you have a slug field
        ...company, // Include all company data
      }));
    }
    return [];
  }, [data]);

  // Track previous tenants to avoid unnecessary updates
  const prevTenantsRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Create a stable string representation to compare
    const tenantsKey = JSON.stringify(tenants.map(t => t.id).sort());
    
    // Only update if the tenant IDs have actually changed
    if (prevTenantsRef.current !== tenantsKey) {
      prevTenantsRef.current = tenantsKey;
      setTenantList(tenants);
    }
  }, [tenants, setTenantList]);

  useEffect(() => {
    if (error) {
      console.error("Failed to fetch company list:", error);
    }
  }, [error]);

  const handleMobileClose = () => {
    if (isMobile) {
      setSidenavOpen(false);
    }
  };

  const handleToggleSidebar = () => {
    setSidenavOpen(!sidenavOpen);
  };
  return (
    <Box sx={{ position: "relative", height: "100vh", overflow: "hidden" }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", height: "100vh" }}>
        <SideNav 
          isOpen={sidenavOpen} 
          setIsOpen={setSidenavOpen}
          onMobileClose={handleMobileClose}
        />
        <Box
          sx={{
            flex: 1,
            minWidth: 0, // Allows flexbox to shrink below content size
            height: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            component="header"
            sx={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#fff",
              gap: 2,
              boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.1)",
              p: 2,
              position: "sticky",
              top: 0,
              zIndex: 999,
            }}
          >
            <IconButton
              size="small"
              aria-label={sidenavOpen ? "Minimize Sidebar" : "Maximize Sidebar"}
              onClick={handleToggleSidebar}
              sx={{ color: "#6b7280" }}
            >
              <PanelLeft size={16} />
            </IconButton>
            <Typography variant="h6" sx={{ fontSize: "14px", fontWeight: 700 }}>
              {headerTitle}
            </Typography>
          </Box>
          <Box
            className="p-3"
            sx={{
              flex: 1,
              overflowY: "auto",
            }}
          >
            <Outlet context={{ setHeaderTitle, onMobileClose: handleMobileClose }} />
          </Box>
        </Box>
      </Box>
      <div className="asset-chat-ui">
      <BubbleChat
        chatflowid="21969619-2c51-48d3-aa1e-a5af5199e060"
        apiHost="http://chatbot.criticalasset.com"
        theme={bubbleTheme}
        chatflowConfig={{ vars: { jwt: userJwtToken } }}
      />
    </div>
    </Box>
  );
};

export default Layout;

export const useLayoutContext = () => useOutletContext<LayoutOutletContext>();
