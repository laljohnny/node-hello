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
import { Search, X, Pencil, Trash2, Plus } from "lucide-react";
import { useLazyQuery, useMutation } from "@apollo/client/react";
import ManufacturerDetailsModal from "./ManufacturerModal";
import RightSideModal from "../../../components/RightSideModal";
import { showToast } from "../../../components/toastService";
import { useLoader } from "../../../context/LoaderContext";
import muiTheme from "../../../themes/muiTheme";
import { MANUFACTURERS_QUERY } from "../../../graphql/queries";
import { DELETE_MANUFACTURER_MUTATION } from "../../../graphql/mutations";

const Manufacturer = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [manufacturerModalOpen, setManufacturerModalOpen] = useState(false);
  const [manufacturerData, setManufacturerData] = useState<any[]>([]);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedManufacturer, setSelectedManufacturer] = useState<any>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const { showLoader, hideLoader } = useLoader();
  const [fetchManufacturers, { loading: queryLoading, refetch }] = useLazyQuery(MANUFACTURERS_QUERY);
  const [hasFetched, setHasFetched] = useState(false);
  const [deleteManufacturer] = useMutation(DELETE_MANUFACTURER_MUTATION, {
    refetchQueries: [{ query: MANUFACTURERS_QUERY }],
  });

  const filteredData = useMemo(
    () =>
      manufacturerData.filter((item) => {
        const term = searchTerm.toLowerCase();
        return (
          item.name?.toLowerCase().includes(term) ||
          item.email?.toLowerCase().includes(term) ||
          item.website?.toLowerCase().includes(term) ||
          item.company_name?.toLowerCase().includes(term) ||
          item.contact_person?.toLowerCase().includes(term)
        );
      }),
    [manufacturerData, searchTerm]
  );

  // Fetch manufacturer data from GraphQL API
  const getManufacturerDetails = async () => {
    try {
      showLoader();
      
      // Use refetch if query has been executed before, otherwise use fetchManufacturers
      let queryData, error;
      if (hasFetched && refetch) {
        const result = await refetch();
        queryData = result.data;
        error = result.error;
      } else {
        const result = await fetchManufacturers();
        queryData = result.data;
        error = result.error;
        setHasFetched(true);
      }
      
      if (error) {
        console.error("GraphQL error:", error);
       
        setManufacturerData([]);
        return;
      }

      const resultData = (queryData as any)?.masterManufacturers;
      const normalizedData = Array.isArray(resultData)
        ? resultData.map((item: any) => ({
            ...item,
          }))
        : resultData
        ? [resultData]
        : [];
      
      // Sort by created_at descending (newest first)
      const sortedData = [...normalizedData].sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
        const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      setManufacturerData(sortedData);
    } catch (err) {
      console.error("Error fetching manufacturers:", err);
  
      setManufacturerData([]);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    getManufacturerDetails();
  }, []);

  const openAddModal = () => {
    setModalMode("add");
    setSelectedManufacturer(null);
    setManufacturerModalOpen(true);
  };

  const openEditModal = (manufacturer: any) => {
    setModalMode("edit");
    setSelectedManufacturer(manufacturer);
    setManufacturerModalOpen(true);
  };

  // ------------------- DELETE FUNCTION -------------------
  const handleDelete = async (manufacturerId: string) => {
    try {
      showLoader();
      
      const result = await deleteManufacturer({
        variables: { id: manufacturerId },
      });

      const deleteResult = (result.data as any)?.deleteMasterManufacturer;
      if (deleteResult?.success) {
        showToast({
          status: "success",
          title: deleteResult.message || "Manufacturer deleted successfully.",
        });
        
        // Refresh table
        getManufacturerDetails();
      }
    } catch (error: any) {
      console.error("Error deleting manufacturer:", error);
      showToast({
        status: "error",
        title: error?.message || "Failed to delete the manufacturer.",
      });
    } finally {
      hideLoader();
    }
  };
  // ---------------------------------------------------------

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
      field: "address",
      headerName: "Address",
      flex: 1,
      minWidth: 200,
      valueGetter: (params) => params.row.address || "NA",
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
      field: "contact_person",
      headerName: "Contact Person",
      flex: 1,
      minWidth: 160,
      valueGetter: (params) => params.row.contact_person || "NA",
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
            aria-label="Edit Manufacturer"
            onClick={() => openEditModal(params.row)}
            size="small"
          >
            <Pencil size={16} />
          </IconButton>
          <IconButton
            aria-label="Delete Manufacturer"
            color="error"
            onClick={() => handleDelete(params.row.id)}
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
              placeholder="Search manufacturers..."
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
              Add Manufacturer
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
          isOpen={manufacturerModalOpen}
          onClose={() => setManufacturerModalOpen(false)}
          title={modalMode === "add" ? "Add Manufacturer" : "Edit Manufacturer"}
        >
          <ManufacturerDetailsModal
            mode={modalMode}
            data={selectedManufacturer}
            getData={getManufacturerDetails}
            onClose={() => setManufacturerModalOpen(false)}
          />
        </RightSideModal>
      </Box>
    </ThemeProvider>
  );
};

export default Manufacturer;



























