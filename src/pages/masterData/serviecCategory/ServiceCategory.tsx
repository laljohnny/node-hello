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
import { useLazyQuery, useMutation } from "@apollo/client/react";
import RightSideModal from "../../../components/RightSideModal";
import ServiceCategoryModal from "./ServiceCategoryModal";
import { showToast } from "../../../components/toastService";
import { useLoader } from "../../../context/LoaderContext";
import muiTheme from "../../../themes/muiTheme";
import { Search, X, Pencil, Trash2, Plus } from "lucide-react";
import { SERVICE_CATEGORIES_QUERY } from "../../../graphql/queries";
import { DELETE_SERVICE_CATEGORY_MUTATION } from "../../../graphql/mutations";

const ServiceCategory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceCategoryModalOpen, setServiceCategoryModalOpen] = useState(false);
  const [serviceCategoryData, setServiceCategoryData] = useState<any[]>([]);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<any>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const { showLoader, hideLoader } = useLoader();
  const [fetchServiceCategories, { loading: queryLoading, refetch }] = useLazyQuery(SERVICE_CATEGORIES_QUERY);
  const [hasFetched, setHasFetched] = useState(false);
  const [deleteServiceCategory] = useMutation(DELETE_SERVICE_CATEGORY_MUTATION, {
    refetchQueries: [{ query: SERVICE_CATEGORIES_QUERY }],
  });

  const filteredData = useMemo(
    () =>
      serviceCategoryData.filter((item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [serviceCategoryData, searchTerm]
  );

  // Fetch service category data from GraphQL API
  const getServiceCategoryDetails = async () => {
    try {
      showLoader();
      
      // Use refetch if query has been executed before, otherwise use fetchServiceCategories
      let queryData, error;
      if (hasFetched && refetch) {
        const result = await refetch();
        queryData = result.data;
        error = result.error;
      } else {
        const result = await fetchServiceCategories();
        queryData = result.data;
        error = result.error;
        setHasFetched(true);
      }
      
      if (error) {
        console.error("GraphQL error:", error);
        // showToast({
        //   status: "error",
        //   title: "Failed to load service categories. Please try again.",
        // });
        setServiceCategoryData([]);
        return;
      }

      const resultData = (queryData as any)?.workorderservicecategories;
      const normalizedData = Array.isArray(resultData)
        ? resultData
        : resultData
        ? [resultData]
        : [];
      
      // Sort by createdAt descending (newest first)
      const sortedData = [...normalizedData].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      setServiceCategoryData(sortedData);
    } catch (err: any) {
      console.error("Error fetching service categories:", err);
      // showToast({
      //   status: "error",
      //   title: "Failed to load service categories. Please try again.",
      // });
      setServiceCategoryData([]);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    getServiceCategoryDetails();
  }, []);

  const openAddModal = () => {
    setModalMode("add");
    setSelectedServiceCategory(null);
    setServiceCategoryModalOpen(true);
  };

  const openEditModal = (serviceCategory: any) => {
    setModalMode("edit");
    setSelectedServiceCategory(serviceCategory);
    setServiceCategoryModalOpen(true);
  };

  const handleDeleteServiceCategory = async (serviceCategoryId: any) => {
    if (!serviceCategoryId?.id) {
      showToast({
        status: "error",
        title: "Invalid service category ID.",
      });
      return;
    }

    try {
      showLoader();
      
      const result = await deleteServiceCategory({
        variables: { id: serviceCategoryId.id },
      });

      if (result.data) {
        showToast({
          status: "success",
          title: "Service category deleted successfully.",
        });
        
        // Refresh table
        getServiceCategoryDetails();
      }
    } catch (error: any) {
      console.error("Error deleting service category:", error);
      showToast({
        status: "error",
        title: error?.message || "Failed to delete service category. Please try again.",
      });
    } finally {
      hideLoader();
    }
  };
  

  return (
    <ThemeProvider theme={muiTheme}>
      <Box>
        <div className="card custom-card card-padding">
          <div className="d-flex justify-content-between align-items-center">
            <TextField
              className="search-field"
              placeholder="Search by Name"
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
              Add Service Category
            </Button>
          </div>
          <div className="mt-1" style={{ height: "500px" }}>
            <DataGrid
              rows={filteredData.map((row) => ({
                ...row,
                id: row.id || row.ID || row.name,
              }))}
              columns={[
                {
                  field: "name",
                  headerName: "Name",
                  flex: 1,
                  minWidth: 160,
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
                        aria-label="Edit"
                        onClick={() => openEditModal(params.row)}
                        size="small"
                      >
                        <Pencil size={16} />
                      </IconButton>
                      <IconButton
                        aria-label="Delete"
                        color="error"
                        onClick={() => handleDeleteServiceCategory(params.row)}
                        size="small"
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  ),
                },
              ] as GridColDef[]}
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
          isOpen={serviceCategoryModalOpen}
          onClose={() => {
            setServiceCategoryModalOpen(false);
            setSelectedServiceCategory(null);
          }}
          title={modalMode === "add" ? "Add Service Category" : "Edit Service Category"}
        >
          {serviceCategoryModalOpen && (
            <ServiceCategoryModal
              key={`${modalMode}-${selectedServiceCategory?.id || 'new'}`}
              mode={modalMode}
              data={selectedServiceCategory}
              getData={getServiceCategoryDetails}
              onClose={() => {
                setServiceCategoryModalOpen(false);
                setSelectedServiceCategory(null);
              }}
            />
          )}
        </RightSideModal>
      </Box>
    </ThemeProvider>
  );
};

export default ServiceCategory;
