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
import { DELETE_COMPANY_MUTATION } from "../../graphql/mutations";
import { COMPANIES_QUERY } from "../../graphql/queries";
import RightSideModal from "../../components/RightSideModal";
import CompanyModal from "./CompanyModal";
import EditCompanyModal from "./EditCompanyModal";
import { showToast } from "../../components/toastService";
import { useLoader } from "../../context/LoaderContext";
import muiTheme from "../../themes/muiTheme";
import { Search, X, Pencil, Trash2, Plus } from "lucide-react";

const Company = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [editCompanyModalOpen, setEditCompanyModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any[]>([]);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const { showLoader, hideLoader } = useLoader();
  const [deleteCompanyMutation] = useMutation(DELETE_COMPANY_MUTATION, {
    refetchQueries: [{ query: COMPANIES_QUERY }],
    awaitRefetchQueries: true,
  });
  
  // Fetch companies when component mounts and filter by role "company"
  const { data: companiesData, refetch: refetchCompanies } = useQuery(COMPANIES_QUERY, {
    fetchPolicy: 'cache-and-network',
  });
  
  // Filter companies by role "company"
  const companiesWithRoleCompany = useMemo(() => {
    if (!companiesData || !(companiesData as any)?.companies) return [];
    return (companiesData as any).companies.filter((company: any) => {
      return company.role?.toLowerCase() === 'company';
    });
  }, [companiesData]);
  
  // Update companyData when filtered companies change
  useEffect(() => {
    if (companiesWithRoleCompany.length > 0 || (companiesData && companiesWithRoleCompany.length === 0)) {
      // Transform companies to match expected format
      const transformedCompanies = companiesWithRoleCompany.map((company: any) => ({
        id: company.id,
        displayname: company.name || company.displayName || '',
        slug: company.id,
        ...company,
      }));
      
      // Sort by createdAt descending (newest first)
      const sortedCompanies = [...transformedCompanies].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      setCompanyData(sortedCompanies);
    } else if (!companiesData) {
      setCompanyData([]);
    }
  }, [companiesWithRoleCompany, companiesData]);

  const filteredData = useMemo(
    () => {
      // Filter based on search term (company name only)
      return companyData.filter((item: any) => {
        if (!searchTerm) return true; // Show all if no search term
        const term = searchTerm.toLowerCase();
        const name = (item.name || item.displayname || "").toLowerCase();
        return name.includes(term);
      });
    },
    [companyData, searchTerm]
  );

  const handleNameClick = (company: any) => {
    const authToken = localStorage.getItem("accessToken");
    const id = company.id || "";
    const companyName = company.name || company.displayname || "";
   
    if (authToken) {
      // Navigate to external application with authToken and all company details as query parameters
      const url = new URL("http://localhost:3005/login");
      // const url = new URL("http://company.criticalasset.com/login");
      url.searchParams.set("id", id);
      url.searchParams.set("authToken", authToken);
      if (companyName) url.searchParams.set("companyName", companyName);
      if (company.email) url.searchParams.set("email", company.email);
      if (company.phoneNumber) url.searchParams.set("phone", company.phoneNumber);
      if (company.address) url.searchParams.set("address", company.address);
      if (company.city) url.searchParams.set("city", company.city);
      if (company.state) url.searchParams.set("state", company.state);
      if (company.country) url.searchParams.set("country", company.country);
      if (company.zip) url.searchParams.set("zip", company.zip);
      if (company.schemaName) url.searchParams.set("schemaName", company.schemaName);
      
      const finalUrl = url.toString();
      console.log("Opening company URL:", finalUrl);
      
      // Use a link element to open the URL (avoids popup blocker issues)
      const link = document.createElement('a');
      link.href = finalUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.log("No authToken found in localStorage");
    }
  };

  const openAddModal = () => {
    setSelectedCompany(null);
    setCompanyModalOpen(true);
  };

  const openEditModal = (company: any) => {
    setSelectedCompany(company);
    setEditCompanyModalOpen(true);
  };

  const handleSaveCompany = (companyData: any) => {
    // Company data is managed via companyData state
    // The CompanyModal will trigger refetch through onCompanyCreated callback
  };

  const handleUpdateCompany = async (companyData: any) => {
    // Refetch companies to refresh the table
    try {
      await refetchCompanies();
    } catch (error) {
      console.error("Failed to refetch companies:", error);
    }
  };

  const deleteCompany = async (companyId: any) => {
    try {
      showLoader();
      
      // Delete company using GraphQL mutation
      const result = await deleteCompanyMutation({
        variables: {
          id: companyId.id,
        },
      });

      if (result.data && typeof result.data === 'object' && 'removeCompany' in result.data) {
        const companyName = companyId.name || companyId.displayname || "Company";
        
        // Refetch companies to get updated list (refetchQueries should handle this, but we'll also do it manually)
        try {
          await refetchCompanies();
        } catch (getError) {
          console.error("Failed to fetch updated company list:", getError);
          // Fallback: remove from companyData manually
          setCompanyData((prev) => prev.filter((company) => company.id !== companyId.id));
        }
        
        showToast({ 
          status: "success", 
          title: `Successfully deleted company ${companyName}` 
        });
      }
    } catch (error: any) {
      console.error("Delete failed:", error);
      const errorMessage = error?.graphQLErrors?.[0]?.message || error?.message || "Failed to delete company";
      showToast({ status: "error", title: errorMessage });
    } finally {
      hideLoader();
    }
  };

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Company Name",
      flex: 1,
      minWidth: 180,
      sortable: true,
      valueGetter: (params) => {
        return params.row.name || params.row.displayname || "";
      },
      renderCell: (params: GridRenderCellParams) => {
        const companyName = params.row.name || params.row.displayname || "";
        return (
          <Box
            component="span"
            onClick={() => handleNameClick(params.row)}
            sx={{
              color: "#3b82f6",
              cursor: "pointer",
              textDecoration: "underline",
              "&:hover": {
                color: "#2563eb",
              },
            }}
          >
            {companyName || "N/A"}
          </Box>
        );
      },
    },
    {
      field: "subdomain",
      headerName: "Subdomain",
      flex: 1,
      minWidth: 180,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <span>{params.value || "--"}</span>
      ),
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
      minWidth: 180,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <span>{params.value || "--"}</span>
      ),
    },
    {
      field: "phoneNumber",
      headerName: "Phone",
      flex: 1,
      minWidth: 140,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <span>{params.value || "--"}</span>
      ),
    },
    {
      field: "address",
      headerName: "Address",
      flex: 1,
      minWidth: 180,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <span>{params.value || "--"}</span>
      ),
    },
    {
      field: "city",
      headerName: "City",
      flex: 1,
      minWidth: 120,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <span>{params.value || "--"}</span>
      ),
    },
    {
      field: "state",
      headerName: "State",
      flex: 1,
      minWidth: 100,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <span>{params.value || "--"}</span>
      ),
    },
    {
      field: "country",
      headerName: "Country",
      flex: 1,
      minWidth: 100,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <span>{params.value || "--"}</span>
      ),
    },
    {
      field: "zip",
      headerName: "Zip",
      flex: 1,
      minWidth: 100,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <span>{params.value || "--"}</span>
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
            onClick={() => deleteCompany(params.row)}
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
          <div className="d-flex justify-content-between align-items-center pb-2">
            <TextField
              className="search-field"
              placeholder="Search companies..."
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
              Create Company
            </Button>
          </div>
          <div className="mt-1" style={{ height: "500px" }}>
            <DataGrid
              rows={filteredData.map((row: any) => ({
                ...row,
                id: row.id || row.ID || `company_${Math.random()}`,
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
          isOpen={companyModalOpen}
          onClose={() => {
            setCompanyModalOpen(false);
          }}
          title="Create Company"
        >
          {companyModalOpen && (
            <CompanyModal
              key={companyModalOpen ? "create-company" : "create-company-closed"}
              onSave={handleSaveCompany}
              onClose={() => {
                setCompanyModalOpen(false);
              }}
              onCompanyCreated={async () => {
                // Refetch companies to refresh the table
                try {
                  await refetchCompanies();
                } catch (error) {
                  console.error("Failed to refetch companies:", error);
                }
              }}
            />
          )}
        </RightSideModal>

        <RightSideModal
          isOpen={editCompanyModalOpen}
          onClose={() => {
            setEditCompanyModalOpen(false);
            setSelectedCompany(null);
          }}
          title="Edit Company"
        >
          <EditCompanyModal
            data={selectedCompany}
            onSave={handleUpdateCompany}
            onClose={() => {
              setEditCompanyModalOpen(false);
              setSelectedCompany(null);
            }}
            onCompanyUpdated={async () => {
              // Refetch companies to refresh the table
              try {
                await refetchCompanies();
              } catch (error) {
                console.error("Failed to refetch companies:", error);
              }
            }}
          />
        </RightSideModal>
      </Box>
    </ThemeProvider>
  );
};

export default Company;

