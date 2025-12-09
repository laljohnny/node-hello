import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Snackbar,
  Alert,
  SelectChangeEvent,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { useQuery, useMutation } from "@apollo/client/react";
import { COMPANY_USERS_QUERY } from "../../graphql/queries";
import { SEND_INVITATION_MUTATION, UPDATE_COMPANY_USER_MUTATION, DELETE_COMPANY_USER_MUTATION, RESEND_INVITATION_MUTATION } from "../../graphql/mutations";
import RightSideModal from "../../components/RightSideModal";
import { showToast } from "../../components/toastService";
import { useLoader } from "../../context/LoaderContext";
import { useAuth } from "../../context/AuthContext";

type Role = "superadmin" | "company_admin" | "team_member" | "partner_admin"|"vendor";
type Employee = {
  id: string;
  name: string;
  email: string;
  role: Role;
  invitationAccepted: boolean;
  invitedDate?: string;
  avatarColor?: string;
  companyId?: string;
  invitationStatus?: string | null;
  invitedOn?: string | null;
};

// API Response Types
type Company = {
  active: boolean;
  address1: string | null;
  address2: string | null;
  assetCount: number;
  businessType: string | null;
  canAddLocation: boolean;
  city: string | null;
  config: any;
  coordinates: any;
  countryAlpha2: string | null;
  createdAt: number;
  createdById: string | null;
  deletedAt: number | null;
  deletedById: string | null;
  email: string | null;
  fileSizeTotal: number;
  id: string;
  industry: string | null;
  isMainCompany: boolean;
  name: string;
  parentId: string | null;
  phone: string | null;
  planId: string | null;
  planStripeCancelAt: number | null;
  planStripeCurrentPeriodEnd: number | null;
  planStripeEndedAt: number | null;
  planStripeId: string | null;
  planStripeStatus: string | null;
  planStripeTrialEnd: number | null;
  requestIP: string | null;
  schemaName: string | null;
  state: string | null;
  stripeId: string | null;
  updatedAt: number;
  updatedById: string | null;
  website: string | null;
  zip: string | null;
};

type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  companyId: string | null;
  schema: string | null;
  twoFactorEnabled: boolean;
  invitationStatus: string | null;
  invitedBy: string | null;
  invitedOn: string | null;
  belongsToCompanyId: string | null;
  createdAt: number;
  deletedAt: number | null;
  displayName: string | null;
  phone: string | null;
  phoneConfirmed: boolean;
  emailConfirmed: boolean;
  updatedAt: number;
  belongsToCompany: Company | null;
};

type CompanyUsersResponse = {
  companyUsers: User[];
};


const roleColors: Record<Role, string> = {
  superadmin: "#743ee4",
  company_admin: "#3b82f6",
  team_member: "#10b981",
  partner_admin: "#3b82f6",
  vendor: "#f59e0b",
};


// Helper function to parse date strings like "Sep 10th, 2025"
const parseInviteDate = (dateStr: string): number => {
  try {
    // Remove ordinal suffixes (st, nd, rd, th)
    const cleaned = dateStr.replace(/(\d+)(st|nd|rd|th)/, "$1");
    const date = new Date(cleaned);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  } catch {
    return 0;
  }
};

// Helper function to format date as "Sep 10th, 2025"
const formatInviteDate = (date: Date): string => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  // Add ordinal suffix
  const getOrdinalSuffix = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };
  
  return `${month} ${day}${getOrdinalSuffix(day)}, ${year}`;
};

// Helper function to format timestamp to date string
const formatTimestampToDate = (timestamp: number): string => {
  return formatInviteDate(new Date(timestamp));
};

// Map API role to UI role
const mapApiRoleToUiRole = (apiRole: string | null): Role => {
  if (!apiRole) return "team_member";
  const normalizedRole = apiRole.toLowerCase();
  if (normalizedRole === "superadmin" || normalizedRole === "super_admin") {
    return "superadmin";
  }
  if (normalizedRole === "company_admin" || normalizedRole === "companyadmin") {
    return "company_admin";
  }
  if (normalizedRole === "team_member" || normalizedRole === "teammember") {
    return "team_member";
  }
  if (normalizedRole === "partner_admin" || normalizedRole === "partneradmin") {
    return "partner_admin";
  }
  if (normalizedRole === "vendor") {
    return "vendor";
  }
  // Default to team_member if role doesn't match
  return "team_member";
};

// Map UI role back to API role (for API submissions)
const mapUiRoleToApiRole = (uiRole: Role): string => {
  const roleMap: Record<Role, string> = {
    superadmin: "super_admin",
    company_admin: "company_admin",
    team_member: "team_member",
    partner_admin: "partner_admin",
    vendor: "vendor",
  };
  return roleMap[uiRole] || "team_member";
};


// Helper function to parse invitedOn date string (format: "2025-12-04 14:56:53.491091+00")
const parseInvitedOnDate = (dateStr: string | null | undefined): string | undefined => {
  if (!dateStr) return undefined;
  try {
    // Parse the date string - handle various formats
    // Replace space with 'T' and handle timezone
    let isoDateStr = dateStr.replace(' ', 'T');
    // If it ends with +00, change to +00:00 for proper ISO format
    if (isoDateStr.match(/\+\d{2}$/)) {
      isoDateStr = isoDateStr + ':00';
    }
    const date = new Date(isoDateStr);
    if (isNaN(date.getTime())) {
      // Try parsing without modification as fallback
      const fallbackDate = new Date(dateStr);
      if (isNaN(fallbackDate.getTime())) return undefined;
      return formatInviteDate(fallbackDate);
    }
    return formatInviteDate(date);
  } catch {
    return undefined;
  }
};

// Transform API response to Employee format
const transformUserToEmployee = (user: User): Employee => {
  // Get name from displayName, or construct from firstName/lastName, or use email
  let name = user.displayName || "";
  if (!name && (user.firstName || user.lastName)) {
    name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  }
  if (!name) {
    name = user.email.split("@")[0];
  }
  
  // Determine invitation status - only "accepted" is considered accepted
  const invitationAccepted = user.invitationStatus?.toLowerCase() === "accepted";
  
  // Format invited date from invitedOn field if invitation is NOT accepted
  const invitedDate = !invitationAccepted && user.invitedOn ? parseInvitedOnDate(user.invitedOn) : undefined;
  
  return {
    id: user.id,
    name,
    email: user.email,
    role: mapApiRoleToUiRole(user.role),
    invitationAccepted,
    invitedDate,
    avatarColor: undefined, // Will be generated dynamically
    companyId: user.companyId || user.belongsToCompanyId || undefined,
    invitationStatus: user.invitationStatus,
    invitedOn: user.invitedOn,
  };
};

const Team: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const { showLoader, hideLoader } = useLoader();
  const { user } = useAuth();

  // Get logged-in user's role and determine if they are SUPER_ADMIN
  const loggedInUserRole = user?.role || null;
  const isSuperAdmin = loggedInUserRole && (
    loggedInUserRole.toUpperCase() === "SUPER_ADMIN" || 
    loggedInUserRole.toUpperCase() === "SUPERADMIN"
  );

  // Initialize filterRole to "All" to show all roles initially
  const [filterRole, setFilterRole] = useState<Role | "All">("All");
  
  const [sortBy, setSortBy] = useState<"asc" | "desc" | "oldest" | "newest">("asc");
  const [anchorEl, setAnchorEl] = useState<{ [key: string]: HTMLElement | null }>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [employeeBeingEdited, setEmployeeBeingEdited] = useState<Employee | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
  const superAdminRole=[
    {
    role: "All",
    label: "All Roles",
  },
  {
    role: "SUPER_ADMIN",
    label: "Super Admin",
  },
  {
    role: "COMPANY_ADMIN",
    label: "Company Admin",
  },
  {
    role: "TEAM_MEMBER",
    label: "Team Member",
  },
  {
    role: "PARTNER_ADMIN",
    label: "Partner Admin",
  },
  {
    role: "VENDOR",
    label: "Vendor",
  }
  ];
  const partnerAdminRole=[
    {
      role: "All",
      label: "All Roles",
    },
  {
    role: "COMPANY_ADMIN",
    label: "Company Admin",
  },
  {
    role: "TEAM_MEMBER",
    label: "Team Member",
  },
  {
    role: "PARTNER_ADMIN",
    label: "Partner Admin",
  },
  {
    role: "VENDOR",
    label: "Vendor",
  }
  ];

  // Fetch company users using GraphQL query
  const { data: usersData, loading: usersLoading } = useQuery<CompanyUsersResponse>(COMPANY_USERS_QUERY);

  // Filter users based on filterRole (client-side filtering)
  const filteredUsers = useMemo(() => {
    if (!usersData?.companyUsers) return [];
    
    let filtered = usersData.companyUsers;
    
    // Apply role filter
    if (filterRole !== "All") {
      filtered = filtered.filter((user) => {
        const userRole = mapApiRoleToUiRole(user.role);
        return userRole === filterRole;
      });
    } else {
      // If "All" is selected, filter based on logged-in user's role
      if (loggedInUserRole && !loggedInUserRole.toUpperCase().includes("SUPER")) {
        // Partner admin users see only partner admin related roles
        filtered = filtered.filter((user) => {
          const userRole = user.role?.toUpperCase() || "";
          return userRole.includes("PARTNER");
        });
      }
      // Super admin users see all users (no additional filtering)
    }
    
    return filtered;
  }, [usersData, filterRole, loggedInUserRole]);

  // Update employees when filtered users change
  useEffect(() => {
    if (filteredUsers.length > 0 || (usersData && filteredUsers.length === 0)) {
      const transformedEmployees = filteredUsers.map(transformUserToEmployee);
      setEmployees(transformedEmployees);
    } else if (!usersData) {
      setEmployees([]);
    }
  }, [filteredUsers, usersData]);

  // Update company user mutation
  const [updateCompanyUserMutation, { loading: updateCompanyUserLoading }] = useMutation(UPDATE_COMPANY_USER_MUTATION, {
    refetchQueries: [{ query: COMPANY_USERS_QUERY }],
    awaitRefetchQueries: true
  });

  // Delete company user mutation
  const [deleteCompanyUserMutation, { loading: deleteCompanyUserLoading }] = useMutation(DELETE_COMPANY_USER_MUTATION, {
    refetchQueries: [{ query: COMPANY_USERS_QUERY }],
    awaitRefetchQueries: true
  });

  // Send invitation mutation
  const [sendInvitationMutation, { loading: sendInvitationLoading }] = useMutation(SEND_INVITATION_MUTATION, {
    refetchQueries: [{ query: COMPANY_USERS_QUERY }],
    awaitRefetchQueries: true
  });

  // Resend invitation mutation
  const [resendInvitationMutation, { loading: resendInvitationLoading }] = useMutation(RESEND_INVITATION_MUTATION, {
    refetchQueries: [{ query: COMPANY_USERS_QUERY }],
    awaitRefetchQueries: true
  });

  // Show/hide loader based on loading states
  useEffect(() => {
    if (usersLoading || updateCompanyUserLoading || sendInvitationLoading || deleteCompanyUserLoading || resendInvitationLoading) {
      showLoader();
    } else {
      hideLoader();
    }
  }, [usersLoading, updateCompanyUserLoading, sendInvitationLoading, deleteCompanyUserLoading, resendInvitationLoading, showLoader, hideLoader]);

  // Sort employees (filtering is now done at GraphQL level)
  const sortedEmployees = useMemo(() => {
    const sorted = [...employees];
    switch (sortBy) {
      case "asc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "desc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case "oldest":
        return sorted.sort((a, b) => {
          // For accepted invitations, sort by name (no date)
          if (a.invitationAccepted && b.invitationAccepted) {
            return a.name.localeCompare(b.name);
          }
          if (a.invitationAccepted) return 1;
          if (b.invitationAccepted) return -1;
          // For pending invitations, try to parse date or use name
          const dateA = a.invitedDate ? parseInviteDate(a.invitedDate) : 0;
          const dateB = b.invitedDate ? parseInviteDate(b.invitedDate) : 0;
          if (dateA === 0 && dateB === 0) return a.name.localeCompare(b.name);
          return dateA - dateB;
        });
      case "newest":
        return sorted.sort((a, b) => {
          // For accepted invitations, sort by name (no date)
          if (a.invitationAccepted && b.invitationAccepted) {
            return a.name.localeCompare(b.name);
          }
          if (a.invitationAccepted) return 1;
          if (b.invitationAccepted) return -1;
          // For pending invitations, try to parse date or use name
          const dateA = a.invitedDate ? parseInviteDate(a.invitedDate) : 0;
          const dateB = b.invitedDate ? parseInviteDate(b.invitedDate) : 0;
          if (dateA === 0 && dateB === 0) return a.name.localeCompare(b.name);
          return dateB - dateA;
        });
      default:
        return sorted;
    }
  }, [employees, sortBy]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, employeeId: string) => {
    setAnchorEl({ [employeeId]: event.currentTarget });
  };

  const handleMenuClose = (employeeId: string) => {
    setAnchorEl({ [employeeId]: null });
  };

  const handleEdit = (employee: Employee) => {
    setEmployeeBeingEdited(employee);
    setIsFormOpen(true);
    handleMenuClose(employee.id);
  };

  const handleInviteClick = () => {
    setEmployeeBeingEdited(null);
    setIsFormOpen(true);
  };

  const handleModalClose = () => {
    setEmployeeBeingEdited(null);
    setIsFormOpen(false);
    // Form reset will be handled by EmployeeForm component via useEffect
  };

  const handleDelete = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
    handleMenuClose(employee.id);
  };

  const handleResendInvitation = async (employee: Employee) => {
    try {
      showLoader();
      
      // Call resendInvitation API with email and role
      const apiRole = mapUiRoleToApiRole(employee.role);
      await resendInvitationMutation({
        variables: {
          input: {
            email: employee.email,
            role: apiRole,
          },
        },
      });

      setSnackbarMessage(`Invitation resent to ${employee.email}`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      handleMenuClose(employee.id);
    } catch (error: any) {
      console.error("Failed to resend invitation:", error);
      const errorMessage = error?.graphQLErrors?.[0]?.message || 
                          error?.message || 
                          "Failed to resend invitation";
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      hideLoader();
    }
  };

  const handleLeaveCompany = async (employee: Employee) => {
    try {
      showLoader();
      await deleteCompanyUserMutation({
        variables: {
          userId: employee.id
        }
      });
      // Refetch will update the employees list automatically
      setSnackbarMessage(`${employee.name} has been removed from the company`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      handleMenuClose(employee.id);
    } catch (error: any) {
      console.error("Failed to remove from company:", error);
      const errorMessage = error?.graphQLErrors?.[0]?.message || 
                          error?.message || 
                          "Failed to remove from company";
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      hideLoader();
    }
  };

  const confirmDelete = async () => {
    if (!selectedEmployee) return;
    
    try {
      showLoader();
      await deleteCompanyUserMutation({
        variables: {
          userId: selectedEmployee.id
        }
      });
      // Refetch will update the employees list automatically
      setSnackbarMessage(`${selectedEmployee.name} has been deleted`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setDeleteDialogOpen(false);
      setSelectedEmployee(null);
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      const errorMessage = error?.graphQLErrors?.[0]?.message || 
                          error?.message || 
                          "Failed to delete user";
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      hideLoader();
    }
  };

  const getInitials = (name: string) => {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      // Two or more words: take first letter of first two words
      return (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1) {
      // Single word: take first two characters
      return words[0].slice(0, 2).toUpperCase();
    }
    return "??";
  };

 console.log('filterRole',filterRole);
  return (
    <Box>
      <div className="row mx-0">
        <div className="col-md-12 mb-3">
          <div className="card custom-card">
            <div className="card-header d-flex justify-content-between align-items-center py-2">
              <Typography variant="h2">Team Members</Typography>
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<PersonAddIcon />}
                onClick={handleInviteClick}
              >
                Invite Employee
              </Button>
            </div>
            <div className="card-body">
              <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Filter by Role</InputLabel>
                  <Select
                    value={filterRole}
                    label="Filter by Role"
                    onChange={(e: SelectChangeEvent<Role | "All">) => {
                      const newValue = e.target.value as Role | "All";
                      setFilterRole(newValue);
                    }}
                    renderValue={(value) => {
                      // Find the label for the selected value
                      const roleArray = (loggedInUserRole && loggedInUserRole.toUpperCase().includes("SUPER"))
                        ? superAdminRole
                        : partnerAdminRole;
                      const selectedOption = roleArray.find((option) => {
                        if (value === "All" && option.role === "All") return true;
                        if (value === "superadmin" && option.role === "SUPER_ADMIN") return true;
                        if (value === "company_admin" && option.role === "COMPANY_ADMIN") return true;
                        if (value === "team_member" && option.role === "TEAM_MEMBER") return true;
                        if (value === "partner_admin" && option.role === "PARTNER_ADMIN") return true;
                        if (value === "vendor" && option.role === "VENDOR") return true;
                        return false;
                      });
                      return selectedOption ? selectedOption.label : value;
                    }}
                  >
                    {(loggedInUserRole && loggedInUserRole.toUpperCase().includes("SUPER"))
                      ? superAdminRole.map((option) => {
                          // Map role values to match filterRole format
                          let value: Role | "All" = "All";
                          if (option.role === "All") {
                            value = "All";
                          } else if (option.role === "SUPER_ADMIN") {
                            value = "superadmin";
                          } else if (option.role === "COMPANY_ADMIN") {
                            value = "company_admin";
                          } else if (option.role === "TEAM_MEMBER") {
                            value = "team_member";
                          } else if (option.role === "PARTNER_ADMIN") {
                            value = "partner_admin";
                          } else if (option.role === "VENDOR") {
                            value = "vendor";
                          }
                          return (
                            <MenuItem key={option.role} value={value}>
                              {option.label}
                            </MenuItem>
                          );
                        })
                      : partnerAdminRole.map((option) => {
                          // Map role values to match filterRole format
                          let value: Role | "All" = "All";
                          if (option.role === "All") {
                            value = "All";
                          } else if (option.role === "COMPANY_ADMIN") {
                            value = "company_admin";
                          } else if (option.role === "TEAM_MEMBER") {
                            value = "team_member";
                          } else if (option.role === "PARTNER_ADMIN") {
                            value = "partner_admin";
                          } else if (option.role === "VENDOR") {
                            value = "vendor";
                          }
                          return (
                            <MenuItem key={option.role} value={value}>
                              {option.label}
                            </MenuItem>
                          );
                        })
                    }
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e: SelectChangeEvent) =>
                      setSortBy(e.target.value as typeof sortBy)
                    }
                  >
                    <MenuItem value="asc">Ascending (A-Z)</MenuItem>
                    <MenuItem value="desc">Descending (Z-A)</MenuItem>
                    <MenuItem value="oldest">Oldest First</MenuItem>
                    <MenuItem value="newest">Newest First</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <div className="row">
                {sortedEmployees.map((employee) => (
                  <div className="col-12 col-md-6 col-xl-4 mb-3" key={employee.id}>
                    <Card elevation={1}
                    sx={{
                      boxShadow: '0 0 6px #7faee052',
                      padding: '12px   !important',
                      "&:hover": {
                        boxShadow: 1,
                      },
                    }}
                  >
                    <CardContent sx={{ padding: '0px !important' }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={2}
                      >
                        <div>
                        <Stack direction="row" alignItems="center" spacing={2} flex={1}>
                          <Avatar
                            sx={{
                              // bgcolor: getAvatarColor(employee.name, employee.avatarColor),
                              bgcolor: '#1E3A8A',
                              width: 38,
                              height: 38,
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {getInitials(employee.name)}
                          </Avatar>
                          <Box flex={1}>
                            <Typography variant="h2">
                              {employee.name}
                            </Typography>
                            <Typography variant="h6">
                              {employee.email}
                            </Typography>
                            
                          </Box>
                        </Stack>
                        
                        </div>

                        <IconButton
                          onClick={(e) => handleMenuOpen(e, employee.id)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>

                        <Menu
                          anchorEl={anchorEl[employee.id]}
                          open={Boolean(anchorEl[employee.id])}
                          onClose={() => handleMenuClose(employee.id)}
                          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                          transformOrigin={{ vertical: "top", horizontal: "right" }}
                        >
                          {employee.invitationAccepted || !employee.invitationStatus || !employee.invitedOn ? (
                            <>
                              <MenuItem onClick={() => handleEdit(employee)}>
                                <EditIcon sx={{ mr: 1, fontSize: 14 }} />
                                Edit Member
                              </MenuItem>
                              <MenuItem
                                onClick={() => handleDelete(employee)}
                                // sx={{ color: "error.main" }}
                              >
                                <DeleteIcon sx={{ mr: 1, fontSize: 14 }} />
                                Delete Member
                              </MenuItem>
                            </>
                          ) : (
                            <>
                              <MenuItem onClick={() => handleResendInvitation(employee)}>
                                <SendIcon sx={{ mr: 1, fontSize: 14 }} />
                                Resend Invitation
                              </MenuItem>
                              <MenuItem
                                onClick={() => handleLeaveCompany(employee)}
                              >
                                <ExitToAppIcon sx={{ mr: 1, fontSize: 14 }} />
                                Leave Company
                              </MenuItem>
                            </>
                          )}
                        </Menu>
                      </Stack>
                      <Stack className="mt-2" direction="row" flexWrap="wrap" justifyContent="flex-start">
                              <Chip
                                label={employee.role}
                                size="small"
                                sx={{
                                  bgcolor: roleColors[employee.role],
                                  color: "#fff",
                                  fontSize: "12px",
                                  borderRadius: "4px",
                                  height: "22px",
                                  mt: 2,
                                  mr: 1,
                                  "& .MuiChip-label": {
                                    px: 2,
                                  },
                                }}
                                // icon={
                                //   <span style={{ fontSize: "12px" }}>
                                //     {roleIcons[employee.role]}
                                //   </span>
                                // }
                              />
                              {employee.invitedDate && (
                                <Chip
                                  label={`Invited on ${employee.invitedDate}`}
                                  size="small"
                                  sx={{
                                    bgcolor: "#fff",
                                    border: "1px solid #3b82f6",
                                    mt: 2,
                                    borderRadius: "4px",
                                    color: "#3b82f6",
                                    fontSize: "12px",
                                    height: "22px",
                                    "& .MuiChip-label": {
                                      px: 1,
                                    },
                                  }}
                                />
                              )}
                            </Stack>
                    </CardContent>
                  </Card>
                  </div>
                ))}
              </div>

              {sortedEmployees.length === 0 && (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary">
                    No employees found
                  </Typography>
                </Box>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Employee Form Modal */}
      <RightSideModal
        isOpen={isFormOpen}
        onClose={handleModalClose}
        title={employeeBeingEdited ? "Edit Member" : "Invite Employee"}
      >
        <EmployeeForm
          key={`form-${isFormOpen ? (employeeBeingEdited?.id || 'new') : 'closed'}`}
          mode={employeeBeingEdited ? "edit" : "create"}
          employee={employeeBeingEdited}
          onSuccess={(employee) => {
            // Reset form and close modal
            handleModalClose();
          }}
          onCancel={handleModalClose}
        />
      </RightSideModal>

      {/* Delete Confirmation Modal */}
      <RightSideModal
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedEmployee(null);
        }}
        title="Delete Member"
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Are you sure you want to delete{" "}
            <Box component="span" fontWeight={700}>
              {selectedEmployee?.name}
            </Box>
            ? This action cannot be undone.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedEmployee(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmDelete} color="error" variant="contained">
              Delete
            </Button>
          </Stack>
        </Box>
      </RightSideModal>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Employee Form Component
type EmployeeFormProps = {
  mode: "create" | "edit";
  employee: Employee | null;
  onSuccess: (employee: Employee) => void;
  onCancel: () => void;
};

type EmployeeFormInputs = {
  email: string;
  role: Role;
};

const employeeSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email format"),
  role: yup
    .mixed<Role>()
    .oneOf(["company_admin", "team_member", "partner_admin", "vendor"])
    .required("Role is required"),
}) as yup.ObjectSchema<EmployeeFormInputs>;

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  mode,
  employee,
  onSuccess,
  onCancel,
}) => {
  const { showLoader, hideLoader } = useLoader();
  const { user } = useAuth();
  const loggedInUserRole = user?.role || null;
  const isSuperAdmin = loggedInUserRole && (
    loggedInUserRole.toUpperCase() === "SUPER_ADMIN" || 
    loggedInUserRole.toUpperCase() === "SUPERADMIN"
  );
  
  const [sendInvitationMutation] = useMutation(SEND_INVITATION_MUTATION, {
    refetchQueries: [{ query: COMPANY_USERS_QUERY }],
    awaitRefetchQueries: true
  });

  const [updateCompanyUserMutation] = useMutation(UPDATE_COMPANY_USER_MUTATION, {
    refetchQueries: [{ query: COMPANY_USERS_QUERY }],
    awaitRefetchQueries: true
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormInputs>({
    resolver: yupResolver(employeeSchema),
    mode: "onBlur",
    defaultValues: {
      email: employee?.email || "",
      role: employee?.role || "team_member",
    },
  });

  const watchedRole = watch("role");

  useEffect(() => {
    if (employee) {
      // Edit mode
      reset({
        email: employee.email,
        role: employee.role,
      });
    } else {
      // Create mode - reset form
      reset({
        email: "",
        role: "team_member",
      });
    }
  }, [employee, mode, reset]);

  const onSubmit = async (data: EmployeeFormInputs) => {
    if (mode === "edit" && !employee) return;

    showLoader();
    try {
      if (mode === "create") {
        // Send invitation using backend API
        const apiRole = mapUiRoleToApiRole(data.role);
        await sendInvitationMutation({
          variables: {
            input: {
              email: data.email.trim(),
              role: apiRole
            }
          }
        });
        // Refetch will update the employees list automatically
        showToast({ status: "success", title: "Invitation sent successfully" });
        // Reset form before closing
        reset({
          email: "",
          role: "team_member",
        });
        onSuccess({ id: "", name: "", email: data.email.trim(), role: data.role, invitationAccepted: false }); // Call onSuccess to close modal
      } else {
        // Edit mode - update company user using updateCompanyUser API
        if (!employee) {
          showToast({ status: "error", title: "User not found" });
          return;
        }
        const apiRole = mapUiRoleToApiRole(data.role);
        await updateCompanyUserMutation({
          variables: {
            input: {
              userId: employee.id,
              role: apiRole,
            }
          }
        });
        // Refetch will update the employees list automatically
        showToast({ status: "success", title: "User updated successfully" });
        onSuccess(employee); // Call onSuccess to close modal
      }
    } catch (error: any) {
      console.error(`Failed to ${mode === "create" ? "send invitation" : "update user"}:`, error);
      const errorMessage = error?.graphQLErrors?.[0]?.message || 
                          error?.message || 
                          `Failed to ${mode === "create" ? "send invitation" : "update user"}`;
      showToast({ 
        status: "error", 
        title: errorMessage 
      });
    } finally {
      hideLoader();
    }
  };

  const handleCancel = () => {
    // Reset form when canceling
    reset({
      email: "",
      role: "team_member",
    });
    onCancel();
  };

  const actionLabel = mode === "edit" ? "Save Changes" : "Send Invitation";

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      className="modal-form-sec"
      noValidate
    >
      <Stack className="modal-form gap">
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Email Address"
              type="email"
              fullWidth
              placeholder="employee@example.com"
              disabled={mode === "edit"}
              size="small"
              required
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              sx={
                mode === "edit"
                  ? { "& .MuiInputBase-input": { cursor: "not-allowed" } }
                  : {}
              }
            />
          )}
        />
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={Boolean(errors.role)}>
              <InputLabel>Role</InputLabel>
              <Select
                {...field}
                label="Role"
                size="small"
              >
                <MenuItem value="company_admin">Company Admin</MenuItem>
                <MenuItem value="team_member">Team Member</MenuItem>
                <MenuItem value="partner_admin">Partner Admin</MenuItem>
                <MenuItem value="vendor">Vendor</MenuItem>
              </Select>
              {errors.role && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                  {errors.role.message}
                </Typography>
              )}
            </FormControl>
          )}
        />
        {watchedRole === "company_admin" && (
          <Alert severity="info" sx={{ fontSize: "13px" }}>
            Has administrative access with company admin privileges.
          </Alert>
        )}
        {watchedRole === "team_member" && (
          <Alert severity="info" sx={{ fontSize: "13px" }}>
            Has user-level access with team member privileges.
          </Alert>
        )}
        {watchedRole === "partner_admin" && (
          <Alert severity="info" sx={{ fontSize: "13px" }}>
            Has administrative access with partner admin privileges.
          </Alert>
        )}
        {watchedRole === "vendor" && (
          <Alert severity="info" sx={{ fontSize: "13px" }}>
            Has vendor-level access with vendor privileges.
          </Alert>
        )}
      </Stack>
      <Stack className="modal-form-buttons" direction="row" spacing={2}>
        <Button
          variant="outlined"
          onClick={handleCancel}
          fullWidth
        >
          Cancel
        </Button>
        <Button
          className="add-btn"
          variant="contained"
          color="primary"
          type="submit"
          fullWidth
          disabled={isSubmitting}
        >
          {actionLabel}
        </Button>
      </Stack>
    </Box>
  );
};

export default Team;

