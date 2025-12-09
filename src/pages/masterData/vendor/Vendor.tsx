import React, { useState, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ThemeProvider } from "@mui/material/styles";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridPaginationModel,
} from "@mui/x-data-grid";
import { useLazyQuery, useMutation } from "@apollo/client/react";
import { Search, X, Pencil, Trash2, Plus } from "lucide-react";
import RightSideModal from "../../../components/RightSideModal";
import VendorModal from "./VendorModal";
import { showToast } from "../../../components/toastService";
import { useLoader } from "../../../context/LoaderContext";
import muiTheme from "../../../themes/muiTheme";
import { VENDORS_QUERY } from "../../../graphql/queries";
import { DELETE_VENDOR_MUTATION } from "../../../graphql/mutations";

const Vendor = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [vendorData, setVendorData] = useState<any[]>([]);
  const [modalMode, setModalMode] = useState<any>("add");
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const { showLoader, hideLoader } = useLoader();
  const [fetchVendors, { loading: queryLoading, refetch }] = useLazyQuery(VENDORS_QUERY);
  const [hasFetched, setHasFetched] = useState(false);
  const [deleteVendor] = useMutation(DELETE_VENDOR_MUTATION, {
    refetchQueries: [{ query: VENDORS_QUERY }],
  });

  const filteredData = useMemo(
    () =>
      vendorData.filter((item) => {
        const term = searchTerm.toLowerCase();
        return (
          item.name?.toLowerCase().includes(term) ||
          item.email?.toLowerCase().includes(term) ||
          item.company_name?.toLowerCase().includes(term) ||
          item.website?.toLowerCase().includes(term) ||
          item.phone_number?.toLowerCase().includes(term)
        );
      }),
    [vendorData, searchTerm]
  );

  // Fetch vendor data from GraphQL API
  const getVendorDetails = async () => {
    try {
      showLoader();
      
      // Use refetch if query has been executed before, otherwise use fetchVendors
      let queryData, error;
      if (hasFetched && refetch) {
        const result = await refetch();
        queryData = result.data;
        error = result.error;
      } else {
        const result = await fetchVendors();
        queryData = result.data;
        error = result.error;
        setHasFetched(true);
      }
      
      if (error) {
        console.error("GraphQL error:", error);
        setVendorData([]);
        return;
      }

      const resultData = (queryData as any)?.masterVendors;
      const normalizedData = Array.isArray(resultData)
        ? resultData.map((item: any) => ({
            ...item,
          }))
        : resultData
        ? [resultData]
        : [];
      
      // Sort by created_at descending (newest first)
      const sortedData = [...normalizedData].sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
      
      setVendorData(sortedData);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      setVendorData([]);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    getVendorDetails();
  }, []);

  const openAddModal = () => {
    setModalMode("add");
    setSelectedVendor(null);
    setVendorModalOpen(true);
  };

  const openEditModal = (vendor: any) => {
    setModalMode("edit");
    setSelectedVendor(vendor);
    setVendorModalOpen(true);
  };

  const handleDeleteVendor = async (vendor: any) => {
    try {
      showLoader();
      
      const result = await deleteVendor({
        variables: { id: vendor.id },
      });

      const deleteResult = (result.data as any)?.deleteMasterVendor;
      if (deleteResult?.success) {
        showToast({
          status: "success",
          title: deleteResult.message || "Vendor deleted successfully.",
        });
        
        // Refresh table
        getVendorDetails();
      }
    } catch (error: any) {
      console.error("Error deleting vendor:", error);
      showToast({
        status: "error",
        title: error?.message || "Failed to delete vendor.",
      });
    } finally {
      hideLoader();
    }
  };

  const getVendorTypeLabel = (type: string | null | undefined) => {
    if (!type) return "NA";
    const typeMap: { [key: string]: string } = {
      maintenance_provider: "Maintenance Provider",
      procurement_partner: "Procurement Partner",
      both: "Both",
    };
    return typeMap[type] || type;
  };

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 180,
      valueGetter: (params) => params.row.name || "NA",
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
      minWidth: 200,
      valueGetter: (params) => params.row.email || "NA",
    },
    {
      field: "company_name",
      headerName: "Company Name",
      flex: 1,
      minWidth: 180,
      valueGetter: (params) => params.row.company_name || "NA",
    },
    {
      field: "website",
      headerName: "Website",
      flex: 1,
      minWidth: 160,
      valueGetter: (params) => params.row.website || "NA",
    },
    {
      field: "phone_number",
      headerName: "Phone Number",
      flex: 1,
      minWidth: 160,
      valueGetter: (params) => params.row.phone_number || "NA",
    },
    {
      field: "country_code",
      headerName: "Country Code",
      flex: 1,
      minWidth: 140,
      valueGetter: (params) => params.row.country_code || "NA",
    },
    {
      field: "vendor_type",
      headerName: "Vendor Type",
      flex: 1,
      minWidth: 180,
      valueGetter: (params) => getVendorTypeLabel(params.row.vendor_type),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton
            aria-label="Edit Vendor"
            onClick={() => openEditModal(params.row)}
            size="small"
          >
            <Pencil size={16} />
          </IconButton>
          <IconButton
            aria-label="Delete Vendor"
            color="error"
            onClick={() => handleDeleteVendor(params.row)}
            size="small"
          >
            <Trash2 size={16} />
          </IconButton>
        </Box>
      ),
    },
  ];

  const rows = useMemo(
    () =>
      filteredData.map((row) => ({
        ...row,
        id: row.id || row.ID || row.email,
      })),
    [filteredData]
  );

  return (
    <ThemeProvider theme={muiTheme}>
      <Box>
        <div className="card custom-card card-padding">
          <div className="d-flex justify-content-between align-items-center">
            <TextField
              className="search-field"
              placeholder="Search vendors..."
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
              Add Vendor
            </Button>
          </div>
          <div className="mt-1" style={{ height: "500px" }}>
            <DataGrid
              rows={rows}
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
          isOpen={vendorModalOpen}
          onClose={() => {
            setVendorModalOpen(false);
            setSelectedVendor(null);
          }}
          title={modalMode === "add" ? "Add Vendor" : "Edit Vendor"}
        >
          {vendorModalOpen && (
            <VendorModal
              key={`${modalMode}-${selectedVendor?.id || 'new'}`}
              mode={modalMode}
              data={selectedVendor}
              onClose={() => {
                setVendorModalOpen(false);
                setSelectedVendor(null);
              }}
              getData={getVendorDetails}
            />
          )}
        </RightSideModal>
      </Box>
    </ThemeProvider>
  );
};

export default Vendor;
