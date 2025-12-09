import React, { Fragment, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Icon,
  Avatar,
  Menu,
  MenuItem,
  ListSubheader,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useAuth, type Tenant } from "../context/AuthContext";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { Building2, Search } from "lucide-react";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";

type MainMenuProps = {
  onMobileClose?: () => void;
};

const MainMenu: React.FC<MainMenuProps> = ({ onMobileClose }) => {
  const { user, tenantList } = useAuth();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const isMobile = useMediaQuery("(max-width: 768px)");
  const inactiveColor = "rgba(255, 255, 255, 0.72)";
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(
    tenantList && tenantList.length > 0 ? tenantList[0]?.id ?? null : null
  );
  const [tenantMenuAnchor, setTenantMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Update selected tenant when tenantList changes
  useEffect(() => {
    if (tenantList && tenantList.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenantList[0]?.id ?? null);
    }
  }, [tenantList, selectedTenantId]);

  const selectedTenant = tenantList?.find(
    (tenant) => tenant.id === selectedTenantId
  );

  const handleTenantMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setTenantMenuAnchor(event.currentTarget);
  };

  const handleTenantMenuClose = () => {
    setTenantMenuAnchor(null);
    setSearchTerm(""); // Clear search when menu closes
  };

  const handleTenantSelect = (tenant: Tenant) => {
    setSelectedTenantId(tenant.id);
    handleTenantMenuClose();

    const authToken = localStorage.getItem("accessToken");
    const id = tenant.id || "";
    // const name = (tenant as any).name || tenant.displayname || "";
    const email = (tenant as any).email || "";
    const phone = (tenant as any).phone || "";
    const companyName = tenant.name || tenant.displayname || "";

    if (authToken) {
      // Navigate to external application with authToken, company name, email, and phone as query parameters
      const url = new URL("http://company.criticalasset.com/login");
      url.searchParams.set("id", id);
      url.searchParams.set("authToken", authToken);
      if (companyName) url.searchParams.set("companyName", companyName);
      if (email) url.searchParams.set("email", email);
      if (phone) url.searchParams.set("phone", phone);
      window.open(url.toString(), "_blank");
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    const initials = parts
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 1);
    return initials || "?";
  };

  // Filter tenants based on search term
  const filteredTenants = useMemo(() => {
    if (!searchTerm) return tenantList || [];
    const term = searchTerm.toLowerCase();
    return (tenantList || []).filter((tenant: any) => {
      const name = (tenant.name || tenant.displayname || "").toLowerCase();
      const email = (tenant.email || "").toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [tenantList, searchTerm]);

  const handleMenuToggle = (menuKey: string, isActive: boolean) => {
    setOpenMenus((prev) => {
      // Determine current open state
      const currentlyOpen = prev[menuKey] !== undefined
        ? prev[menuKey]
        : isActive;

      // Toggle the current state
      return {
        ...prev,
        [menuKey]: !currentlyOpen,
      };
    });
  };

  const isMenuOpen = (menuKey: string, isActive: boolean) => {
    // If user has explicitly set a state, use that (allows manual override)
    if (openMenus[menuKey] !== undefined) {
      return openMenus[menuKey];
    }
    // Otherwise, auto-open if active
    return isActive;
  };

  // Define all navigation items with their allowed roles
  const allNavItems: any = [
    // { path: "/onboard", text: "Assets", Icon: "apartment", allowedRoles: ["SUPER_ADMIN", "partner_admin"] },
    {
      path: "/dashboard",
      text: "Dashboard",
      Icon: "dashboard",
      allowedRoles: ["SUPER_ADMIN", "partner_admin", "PARTNER_ADMIN", "super_admin"] // Add more roles as needed
    },
    {
      path: "/ticketing",
      text: "Ticketing",
      Icon: "view_kanban",
      allowedRoles: ["SUPER_ADMIN", "partner_admin", "PARTNER_ADMIN", "super_admin"] // Add more roles as needed
    },
    {
      path: "/subscription",
      text: "Plan & Billing",
      Icon: "credit_card",
      allowedRoles: ["SUPER_ADMIN", "super_admin", "partner_admin", "PARTNER_ADMIN"]
    },
    {
      path: "/plans",
      text: "Subscription Plans",
      Icon: "card_membership",
      allowedRoles: ["SUPER_ADMIN", "super_admin"]
    },
    {
      path: "/ai-addons",
      text: "AI Addons",
      Icon: "smart_toy",
      allowedRoles: ["SUPER_ADMIN", "super_admin", "partner_admin", "PARTNER_ADMIN"]
    },
    {
      path: "/team",
      text: "Team",
      Icon: "groups",
      allowedRoles: ["SUPER_ADMIN", "super_admin", "partner_admin", "PARTNER_ADMIN"]
    },
    // { 
    //   path: "/gallery", 
    //   text: "Gallery", 
    //   Icon: "gallery_thumbnail",
    //   allowedRoles: ["SUPER_ADMIN","super_admin", "partner_admin"]
    // },
    {
      path: "/partners",
      text: "Partners",
      Icon: "people",
      allowedRoles: ["SUPER_ADMIN", "super_admin"]
    },
    // {
    //   path: "/master-data",
    //   text: "Master Data",
    //   Icon: "database",
    //   allowedRoles: ["SUPER_ADMIN", "super_admin", "partner_admin", "PARTNER_ADMIN"]
    // },
    {
      path: "/company",
      text: "Company",
      Icon: "business",
      allowedRoles: ["SUPER_ADMIN", "super_admin", "partner_admin", "PARTNER_ADMIN"]
    },
    {
      text: "Master Data",
      isParent: true,
      Icon: "data_table",
      children: [
        { path: "/manufacturer", text: "Manufacturer", Icon: "factory" },
        // { path: "/vendor", text: "Vendor", Icon: "storefront" },
        { path: "/assetcategory", text: "Asset Category", Icon: "category" },
        { path: "/assettype", text: "Asset Type", Icon: "warehouse" },
        { path: "/assetparts", text: "Asset Parts", Icon: "build" },
        { path: "/assetpartfields", text: "Asset Part Fields", Icon: "list_alt" },
        { path: "/assetfields", text: "Asset Fields", Icon: "view_list" },
        // { path: "/assignmenttype", text: "Assignment Type", Icon: "assignment" },
        // { path: "/servicecategory", text: "Service Category", Icon: "construction" },
        { path: "/servicetype", text: "Service Type", Icon: "service_toolbox" },
        // { path: "/workordertype", text: "Workorder Type", Icon: "business_center" },
        // { path: "/workorderstage", text: "Workorder Stages", Icon: "timeline" },
      ],
    },
  ];

  // Filter navItems based on user role
  const navItems = useMemo(() => {
    const userRole = (user as any)?.role;

    // If no role is set, return empty array or all items (adjust based on your needs)
    if (!userRole) {
      return [];
    }

    // Filter items based on allowed roles
    return allNavItems.filter((item: any) => {
      // If allowedRoles is not defined, show to all (backward compatibility)
      if (!item.allowedRoles || item.allowedRoles.length === 0) {
        return true;
      }
      // Check if user's role is in the allowed roles array
      return item.allowedRoles.includes(userRole);
    });
  }, [user]);

  // Reset menu state when menus become inactive, so they auto-open when active again
  useEffect(() => {
    setOpenMenus((prev) => {
      const updated = { ...prev };
      let hasChanges = false;

      navItems.forEach((nav: any) => {
        if (nav.children) {
          const menuKey = nav.path || nav.text;
          const isActive = nav.children.some((child: any) =>
            location.pathname.startsWith(child.path)
          );

          // If menu is inactive and has a state set, clear it
          if (!isActive && updated[menuKey] !== undefined) {
            delete updated[menuKey];
            hasChanges = true;
          }
        }
      });

      return hasChanges ? updated : prev;
    });
  }, [location.pathname]);

  return (
    <Box display="flex" flexDirection="column" height="100vh" className="w-100 position-relative" sx={{ zIndex: 1000 }}>
      <Box px={2} pt={3}>
        <Button className="admin-menu-button"
          fullWidth
          onClick={handleTenantMenuOpen}
          endIcon={
            Boolean(tenantMenuAnchor) ? (
              <ExpandLess sx={{ color: "#fff" }} />
            ) : (
              <ExpandMore sx={{ color: "#fff" }} />
            )
          }
          sx={{
            justifyContent: "flex-start",
            textTransform: "none",
            bgcolor: "transparent",
            color: "#fff",
            // borderRadius: 2,
            px: 0,
            py: 0,
            // minHeight: 72,
            "&:hover": {
              bgcolor: "transparent",
            },
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: 14,
              backgroundColor: "#2d3748",
              mr: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Building2 size={16} color="#fff" />

            {/* {selectedTenant ? (
              getInitials((selectedTenant as any).name || selectedTenant.displayname)
            ) : (
              <Building2 size={16} color="#fff" />
            )} */}
          </Avatar>
          <Box textAlign="left">
            <Typography variant="h2" sx={{ color: '#fff' }}>
              {/* {(selectedTenant as any)?.name || selectedTenant?.displayname || "Select Company"} */}
              Select Company
            </Typography>
            {/* <Typography
              variant="h6"
              // sx={{ color: "rgba(255,255,255,0.72)" }}
            >
              {(selectedTenant as any)?.email || user?.useremail || "--"}
            </Typography> */}
          </Box>
        </Button>
        <Menu
          anchorEl={tenantMenuAnchor}
          open={Boolean(tenantMenuAnchor)}
          onClose={handleTenantMenuClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          PaperProps={{
            sx: {
              borderRadius: 3,
              overflow: "hidden",
              maxHeight: 400,
              display: "flex",
              flexDirection: "column",
              boxShadow:
                "0px 12px 40px rgba(15, 23, 42, 0.35), 0px 0px 0px 1px rgba(15, 23, 42, 0.06)",
            },
          }}
          MenuListProps={{
            sx: {
              p: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              maxHeight: 400,
            },
          }}
        >
          <Box
            sx={{
              p: 2,
              borderBottom: "1px solid rgba(0,0,0,0.08)",
              position: "sticky",
              top: 0,
              bgcolor: "background.paper",
              zIndex: 1,
              flexShrink: 0,
            }}
          >
            <TextField
              placeholder="Search company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(0,0,0,0.02)",
                  "& fieldset": {
                    borderColor: "rgba(0,0,0,0.1)",
                  },
                },
              }}
            />
          </Box>
          <Box
            sx={{
              overflowY: "auto",
              flex: 1,
              maxHeight: "calc(400px - 73px)", // Subtract search field height
            }}
          >
            {filteredTenants.length > 0 ? (
              filteredTenants.map((tenant: any) => (
                <MenuItem
                  key={tenant.id}
                  onClick={() => handleTenantSelect(tenant)}
                  selected={tenant.id === selectedTenantId}
                  sx={{
                    gap: 1.5,
                    alignItems: "flex-start",
                    py: 1,
                    px: 2,
                    "&.Mui-selected": {
                      bgcolor: "rgba(59,130,246,0.12)",
                    },
                    "&.Mui-selected:hover": {
                      bgcolor: "rgba(59,130,246,0.18)",
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: "rgba(59, 130, 246, 0.12)",
                      color: "#1d4ed8",
                      width: 32,
                      height: 32,
                      fontSize: 14,
                    }}
                  >
                    {getInitials(tenant.name || tenant.displayname)}
                  </Avatar>
                  <Box>
                    <Typography variant="h2" sx={{ fontSize: '12px' }}>
                      {tenant.name || tenant.displayname || "--"}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ fontSize: '11px', color: "text.secondary" }}
                    >
                      {tenant.email || "--"}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                <Typography variant="h2" sx={{ px: 2, textAlign: "center", py: 4, width: '100%' }}>
                  No companies found
                </Typography>
              </MenuItem>
            )}
          </Box>
        </Menu>
      </Box>
      <Box flex={1} overflow="auto" py={3}>
        <List disablePadding>
          {navItems.map((nav: any) => {
            const isActive = nav.path
              ? location.pathname.startsWith(nav.path)
              : false;

            if (!nav.isParent) {
              return (
                <ListItemButton
                  key={nav.text}
                  component={RouterLink}
                  to={nav.path}
                  onClick={() => {
                    if (isMobile && onMobileClose) {
                      onMobileClose();
                    }
                  }}
                  sx={{
                    my: 0.5,
                    px: 1.2,
                    py: 1,
                    borderLeft: "2px solid",
                    borderLeftColor: isActive ? "#fff" : "transparent",
                    bgcolor: isActive ? "#3b82f6" : "transparent",
                    color: isActive ? "#fff" : inactiveColor,
                    "&:hover": {
                      color: "#fff",
                      bgcolor: "#3b82f6",
                      borderLeftColor: "#fff",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 32,
                      color: "inherit",
                    }}
                  >
                    <Icon fontSize="small" className="material-symbols-outlined">
                      {nav.Icon}
                    </Icon>
                  </ListItemIcon>
                  <ListItemText
                    primary={nav.text}
                    primaryTypographyProps={{ sx: { color: "inherit", fontSize: "14px" } }}
                  />
                </ListItemButton>
              );
            }

            const isParentActive =
              nav.children?.some((child: any) =>
                location.pathname.startsWith(child.path)
              ) ?? false;

            const menuKey = nav.path || nav.text;
            const menuIsOpen = isMenuOpen(menuKey, isParentActive);

            return (
              <Fragment key={nav.text}>
                <ListItemButton
                  onClick={() => handleMenuToggle(menuKey, isParentActive)}
                  sx={{
                    my: 0.5,
                    px: 1.2,
                    py: 1,
                    borderLeft: "2px solid",
                    borderLeftColor: isParentActive ? "#fff" : "transparent",
                    bgcolor: isParentActive ? "#3b82f6" : "transparent",
                    color: isParentActive ? "#fff" : inactiveColor,
                    "&:hover": {
                      color: "#fff",
                      bgcolor: "#3b82f6",
                      borderLeftColor: "#fff",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 32,
                      color: "inherit",
                    }}
                  >
                    <Icon fontSize="small" className="material-symbols-outlined">
                      {nav.Icon}
                    </Icon>
                  </ListItemIcon>
                  <ListItemText
                    primary={nav.text}
                    primaryTypographyProps={{ sx: { color: "inherit", fontSize: "14px" } }}
                  />
                  {menuIsOpen ? (
                    <ExpandLess sx={{ color: "inherit" }} />
                  ) : (
                    <ExpandMore sx={{ color: "inherit" }} />
                  )}
                </ListItemButton>
                <Collapse
                  in={menuIsOpen}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    {nav.children.map((child: any) => {
                      const isChildActive = location.pathname.startsWith(
                        child.path
                      );

                      return (
                        <ListItemButton
                          key={child.path}
                          component={RouterLink}
                          to={child.path}
                          onClick={() => {
                            if (isMobile && onMobileClose) {
                              onMobileClose();
                            }
                          }}
                          sx={{
                            pl: 4,
                            py: 1,
                            borderLeft: "2px solid",
                            borderLeftColor: isChildActive
                              ? "#fff"
                              : "transparent",
                            bgcolor: isChildActive ? "#3b82f6" : "transparent",
                            color: isChildActive ? "#fff" : inactiveColor,
                            "&:hover": {
                              color: "#fff",
                              bgcolor: "#3b82f6",
                              borderLeftColor: "#fff",
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 32,
                              color: "inherit",
                            }}
                          >
                            <Icon
                              fontSize="small"
                              className="material-symbols-outlined"
                            >
                              {child.Icon}
                            </Icon>
                          </ListItemIcon>
                          <ListItemText
                            primary={child.text}
                            primaryTypographyProps={{
                              sx: {
                                color: "inherit",
                              },
                            }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </Fragment>
            );
          })}
        </List>
      </Box>

      {/* <Box borderTop="1px solid #444" p="3">
        <Button
          width="100%"
          onClick={() => {
            logout();
            if (isMobile && onMobileClose) {
              onMobileClose();
            }
          }}
          colorScheme="yellow"
          leftIcon={
            <Box
              as="span"
              className="material-symbols-outlined"
              fontSize="20px"
            >
              logout
            </Box>
          }
        >
          Logout
        </Button>
      </Box> */}
    </Box>
  );
};

export default MainMenu;

