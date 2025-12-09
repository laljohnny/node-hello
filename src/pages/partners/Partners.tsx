import React, { useState, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { ThemeProvider } from "@mui/material/styles";
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { useMutation, useQuery } from "@apollo/client/react";
import { COMPANIES_QUERY } from "../../graphql/queries";
import { REMOVE_USER_MUTATION } from "../../graphql/mutations";
import RightSideModal from "../../components/RightSideModal";
import PartnerModal from "./PartnerModal";
import EditPartnerModal from "./EditPartnerModal";
import { showToast } from "../../components/toastService";
import { useLoader } from "../../context/LoaderContext";
import muiTheme from "../../themes/muiTheme";
import { Search, X, Pencil, Trash2, Plus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Partners = () => {
  const { tenantList, setTenantList } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [editPartnerModalOpen, setEditPartnerModalOpen] = useState(false);
  const [partnerData, setPartnerData] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const { showLoader, hideLoader } = useLoader();
  const [removeUserMutation, { loading: removeUserLoading }] = useMutation(REMOVE_USER_MUTATION, {
    refetchQueries: [{ query: COMPANIES_QUERY }],
    awaitRefetchQueries: true,
  });
  
  // Query for companies - filter by role for partner table
  const { data: companiesData, refetch: refetchCompanies } = useQuery(COMPANIES_QUERY, {
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });
  
  // Filter companies by "partner" role to get partners
  const partnerCompanies = useMemo(() => {
    if (!companiesData || !(companiesData as any)?.companies) return [];
    return (companiesData as any).companies.filter((company: any) => {
      return company.role?.toLowerCase() === 'partner';
    });
  }, [companiesData]);
  
  // Create company map from partner companies
  const companyMap = useMemo(() => {
    const map = new Map<string, string>();
    partnerCompanies.forEach((company: any) => {
      map.set(company.id, company.name || company.displayName || '');
    });
    return map;
  }, [partnerCompanies]);
  
  // Update tenantList when companies data changes - filter by role for partners
  useEffect(() => {
    const tenants = partnerCompanies.map((company: any) => ({
      id: company.id,
      displayname: company.name || company.displayName || '',
      slug: company.id,
      ...company,
    }));
    setTenantList(tenants);
  }, [partnerCompanies, setTenantList]);

  const filteredData = useMemo(
    () =>
      partnerData.filter((item) => {
        const term = searchTerm.toLowerCase();
        const firstName = item.firstName || item.firstname || "";
        const lastName = item.lastName || item.lastname || "";
        const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
        const email = item.email || item.workemail || "";
        const phone = item.phone || item.phonenumber || "";
        const role = item.role || "";
        const companyName = item.companyname || item.name || "";
        return (
          fullName.includes(term) ||
          email.toLowerCase().includes(term) ||
          phone.toLowerCase().includes(term) ||
          role.toLowerCase().includes(term) ||
          companyName.toLowerCase().includes(term) ||
          item.belongsToCompanyId?.toString().toLowerCase().includes(term) ||
          item.invitedBy?.toLowerCase().includes(term)
        );
      }),
    [partnerData, searchTerm]
  );

  // Transform partner companies to partner data format
  useEffect(() => {
    if (companiesData) {
      // Transform companies with "partner" role to partner format
      const transformedPartners = partnerCompanies.map((company: any) => ({
        id: company.id,
        role: company.role || "partner",
        workemail: company.email || "",
        firstname: company.name || "",
        lastname: "",
        phonenumber: company.phoneNumber || "",
        companyname: company.name || "",
        belongsToCompanyId: company.id,
        email: company.email || "",
        firstName: company.name || "",
        lastName: "",
        phone: company.phoneNumber || "",
        emailConfirmed: false,
        phoneConfirmed: false,
        twoFactorEnabled: false,
        invitedBy: "",
        createdAt: company.createdAt || "",
        updatedAt: company.updatedAt || "",
        // Keep original company data for reference
        ...company,
      }));
      
      // Sort by createdAt descending (newest first)
      const sortedPartners = [...transformedPartners].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      setPartnerData(sortedPartners);
    } else {
      setPartnerData([]);
    }
  }, [partnerCompanies, companiesData]);

  const openAddModal = () => {
    setSelectedPartner(null);
    setPartnerModalOpen(true);
  };

  const openEditModal = (partner: any) => {
    setSelectedPartner(partner);
    setEditPartnerModalOpen(true);
  };

  const handleSavePartner = async (partnerData: any) => {
    // Refetch companies list to get updated data with network-only to bypass cache
    try {
      await refetchCompanies({ fetchPolicy: 'network-only' });
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
    // Close modal after save
    setPartnerModalOpen(false);
    setSelectedPartner(null);
  };

  const handleUpdatePartner = async (partnerData: any) => {
    // Refetch companies list to get updated data with network-only to bypass cache
    try {
      await refetchCompanies({ fetchPolicy: 'network-only' });
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
    // Close modal after save
    setEditPartnerModalOpen(false);
    setSelectedPartner(null);
  };

  const deletePartner = async (partnerId: any) => {
    try {
      showLoader();
      
      // Delete partner using GraphQL mutation
      const result = await removeUserMutation({
        variables: {
          id: partnerId.id,
        },
      });

      if (result.data && typeof result.data === 'object' && 'removeUser' in result.data) {
        const partnerName = `${partnerId.firstname || partnerId.firstName || partnerId.name || ""} ${partnerId.lastname || partnerId.lastName || ""}`.trim();
        const text = partnerName ? `Successfully deleted partner ${partnerName}` : "Successfully deleted partner";
        
        // Refetch companies to get updated list (refetchQueries should handle this, but we'll also do it manually)
        try {
          await refetchCompanies({ fetchPolicy: 'network-only' });
        } catch (getError) {
          console.error("Failed to fetch updated company list:", getError);
          // Fallback: remove from partnerData manually
          setPartnerData((prev) => prev.filter((partner) => partner.id !== partnerId.id));
        }
        
        showToast({ status: "success", title: text });
      }
    } catch (error: any) {
      console.error("Delete failed:", error);
      const errorMessage = error?.graphQLErrors?.[0]?.message || error?.message || "Failed to delete partner";
      showToast({ status: "error", title: errorMessage });
    } finally {
      hideLoader();
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return "";
    }
  };

  const columns: GridColDef[] = [
    {
      field: "firstName",
      headerName: "First Name",
      flex: 1,
      minWidth: 150,
      sortable: true,
      valueGetter: (params) => {
        return params.row.firstName || params.row.firstname || "";
      },
      renderCell: (params: GridRenderCellParams) => (
        <span>{params.row.firstName || params.row.firstname || "--"}</span>
      ),
    },
    {
      field: "lastName",
      headerName: "Last Name",
      flex: 1,
      minWidth: 150,
      sortable: true,
      valueGetter: (params) => {
        return params.row.lastName || params.row.lastname || "";
      },
      renderCell: (params: GridRenderCellParams) => (
        <span>{params.row.lastName || params.row.lastname || "--"}</span>
      ),
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
      minWidth: 200,
      sortable: true,
      valueGetter: (params) => {
        return params.row.email || params.row.workemail || "";
      },
      renderCell: (params: GridRenderCellParams) => (
        <span>{params.row.email || params.row.workemail || "--"}</span>
      ),
    },
    {
      field: "belongsToCompanyId",
      headerName: "Company",
      flex: 1,
      minWidth: 180,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => {
        const companyId = params.value;
        if (!companyId) return <span>--</span>;
        
        // Use companyMap for instant lookup (same data as Select Company dropdown)
        const companyName = companyMap.get(companyId);
        
        // Only show company name, never show the ID
        return <span>{companyName || "--"}</span>;
      },
    },
    {
      field: "role",
      headerName: "Role",
      flex: 1,
      minWidth: 120,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <span>{params.value || "--"}</span>
      ),
    },
    {
      field: "phone",
      headerName: "Phone",
      flex: 1,
      minWidth: 140,
      sortable: true,
      valueGetter: (params) => {
        return params.row.phone || params.row.phonenumber || "";
      },
      renderCell: (params: GridRenderCellParams) => (
        <span>{params.row.phone || params.row.phonenumber || "--"}</span>
      ),
    },
    
    {
      field: "emailConfirmed",
      headerName: "Email Confirmed",
      flex: 1,
      minWidth: 140,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <span>{params.value === true ? "Yes" : params.value === false ? "No" : "--"}</span>
      ),
    },
    {
      field: "phoneConfirmed",
      headerName: "Phone Confirmed",
      flex: 1,
      minWidth: 140,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <span>{params.value === true ? "Yes" : params.value === false ? "No" : "--"}</span>
      ),
    },
    {
      field: "twoFactorEnabled",
      headerName: "Two Factor Enabled",
      flex: 1,
      minWidth: 160,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <span>{params.value === true ? "Yes" : params.value === false ? "No" : "--"}</span>
      ),
    },
    
    {
      field: "invitedBy",
      headerName: "Invited By",
      flex: 1,
      minWidth: 120,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <span>{params.value || "--"}</span>
      ),
    },
    {
      field: "createdAt",
      headerName: "Created At",
      flex: 1,
      minWidth: 150,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <span>{formatDate(params.value)}</span>
      ),
    },
    {
      field: "updatedAt",
      headerName: "Updated At",
      flex: 1,
      minWidth: 150,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <span>{formatDate(params.value)}</span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 160,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton
            aria-label="Edit"
            onClick={() => openEditModal(params.row)}
            size="small"
          >
            <Pencil size={16} />
          </IconButton>
          <IconButton
            aria-label="Delete"
            color="error"
            onClick={() => deletePartner(params.row)}
            size="small"
          >
            <Trash2 size={16} />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <ThemeProvider theme={muiTheme}>
      <Box>
        <div className="card custom-card p-3">
          <div className="d-flex justify-content-between align-items-center  pb-2">
            <TextField
              className="search-field"
              placeholder="Search partners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              fullWidth
              sx={{ maxWidth: { xs: "100%", sm: 240, md: 300 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={14} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Clear"
                      size="small"
                      onClick={() => setSearchTerm("")}
                      edge="end"
                    >
                      <X size={14} />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              }}
            />
            <Button
              className="add-btn"
              variant="contained"
              color="secondary"
              size="small"
              startIcon={<Plus size={16} />}
              onClick={openAddModal}
            >
              Create Partners
            </Button>
          </div>
          <div className="mt-1" style={{ height: "500px" }}>
            <DataGrid
              rows={filteredData.map((row) => ({
                ...row,
                id: row.id || row.ID || `${row.firstname}_${row.lastname}`,
              }))}
              columns={columns}
              disableRowSelectionOnClick
              sortingOrder={["asc", "desc"]}
              paginationModel={paginationModel}
              pageSizeOptions={[5, 10, 25, 50]}
              onPaginationModelChange={setPaginationModel}
              disableColumnMenu
              disableColumnFilter
              localeText={{
                noRowsLabel: "No Data Found",
              }}
            />
          </div>
        </div>

        <RightSideModal
          isOpen={partnerModalOpen}
          onClose={() => {
            setPartnerModalOpen(false);
            setSelectedPartner(null);
          }}
          title="Create Partners"
        >
          {partnerModalOpen && (
            <PartnerModal
              key={partnerModalOpen ? "create-partner" : "create-partner-closed"}
              onSave={handleSavePartner}
              onClose={() => {
                setPartnerModalOpen(false);
                setSelectedPartner(null);
              }}
            />
          )}
        </RightSideModal>

        <RightSideModal
          isOpen={editPartnerModalOpen}
          onClose={() => {
            setEditPartnerModalOpen(false);
            setSelectedPartner(null);
          }}
          title="Edit Partners"
        >
          <EditPartnerModal
            data={selectedPartner}
            onSave={handleUpdatePartner}
            onClose={() => {
              setEditPartnerModalOpen(false);
              setSelectedPartner(null);
            }}
          />
        </RightSideModal>
      </Box>
    </ThemeProvider>
  );
};

export default Partners;

