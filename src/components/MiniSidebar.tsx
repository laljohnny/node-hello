import { useState, MouseEvent } from "react";
import {
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import LogoIcon from "./icons/logoIconDarkBg";

import { Sparkles } from "lucide-react";
import { Navigation } from "lucide-react";


type MiniSidebarProps = {
  activePanel: "menu" | "chat" | null;
  isOpen: boolean;
  onMenuClick: () => void;
  onChatClick: () => void;
  zIndex?: number;
};

const MiniSidebar: React.FC<MiniSidebarProps> = ({
  activePanel,
  isOpen,
  onMenuClick,
  onChatClick,
  zIndex = 1,
}) => {
  const { user, logout } = useAuth();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const userDisplayName =
    user?.userdisplayname || user?.name || user?.email || user?.user || "User";
  const userInitial = userDisplayName?.trim()?.[0]?.toUpperCase() || "U";

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const isMenuOpen = Boolean(menuAnchorEl);
  const isMenuPanelActive = activePanel === "menu" && isOpen;
  const isChatPanelActive = activePanel === "chat" && isOpen;

  return (
    <Box
      sx={{
        backgroundColor: "black",
        color: "white",
        minHeight: "100vh",
        width: "60px",
        py: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
        zIndex,
        flexShrink: 0,
        borderRight: "1px solid #444",
      }}
    >
      {/* Top Section */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
        <LogoIcon width="32px" height="28px" />

        {/* Menu Icon */}
        <Tooltip title="Menu" placement="right">
          <IconButton
            aria-label="Menu"
            onClick={onMenuClick}
            size="large"
            sx={{
              backgroundColor: isMenuPanelActive ? "#3b82f6" : "transparent",
              color: isMenuPanelActive ? "white" : "inherit",
              "&:hover": { backgroundColor: "#3b82f6", color: "white" },
            }}
          >
            <Navigation size={16} />
          </IconButton>
        </Tooltip>

        {/* Chatbot Icon */}
        <Tooltip title="Chatbot" placement="right">
          <IconButton
            aria-label="Chatbot"
            onClick={onChatClick}
            size="large"
            sx={{
              backgroundColor: isChatPanelActive ? "#3b82f6" : "transparent",
              color: isChatPanelActive ? "white" : "inherit",
              "&:hover": { backgroundColor: "#3b82f6", color: "white" },
            }}
          >
            <Sparkles size={16} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Bottom Section - User Icon */}
      <Box>
        <IconButton
          aria-label="User menu"
          onClick={handleMenuOpen}
          id="mini-sidebar-user-menu-button"
          size="large"
          aria-haspopup="true"
          aria-controls={isMenuOpen ? "mini-sidebar-user-menu" : undefined}
          aria-expanded={isMenuOpen ? "true" : undefined}
          sx={{
            padding: 0,
            borderRadius: "9999px",
            color: "#ffffff",
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: 14,
              backgroundColor: "#2d3748",
            }}
          >
            {userInitial}
          </Avatar>
        </IconButton>
        <Menu
          id="mini-sidebar-user-menu"
          anchorEl={menuAnchorEl}
          open={isMenuOpen}
          onClose={handleMenuClose}
          TransitionProps={{ timeout: 150 }}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "bottom", horizontal: "right" }}
          PaperProps={{
            sx: {
              mt: -1,
              minWidth: 180,
              backgroundColor: "#fff",
              color: "white",
              borderRadius: 2,
              border: "1px solid #4a5568",
            },
          }}
          MenuListProps={{ "aria-labelledby": "mini-sidebar-user-menu-button" }}
        >
          <MenuItem disabled sx={{ opacity: 1, fontWeight: 600 }}>
            <Typography variant="h6" sx={{ fontSize: "14px", color: '#000', fontWeight: 700 }}>
              {userDisplayName}
            </Typography>
          </MenuItem>
          <MenuItem onClick={() => window.location.href = '/settings'} sx={{ fontSize: "0.875rem" }}>
            Settings
          </MenuItem>
          <MenuItem onClick={handleLogout} sx={{ fontSize: "0.875rem" }}>
            Logout
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default MiniSidebar;

