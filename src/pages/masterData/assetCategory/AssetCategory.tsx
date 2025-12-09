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
import AssetCategoryModal from "./AssetCategoryModal";
import RightSideModal from "../../../components/RightSideModal";
import { showToast } from "../../../components/toastService";
import { useLoader } from "../../../context/LoaderContext";
import muiTheme from "../../../themes/muiTheme";
import { Search, X, Pencil, Trash2, Plus } from "lucide-react";
import { AssetIcon, IconType } from "../../../components/assetIcons";
import { ASSET_CATEGORIES_QUERY } from "../../../graphql/queries";
import { DELETE_ASSET_CATEGORY_MUTATION } from "../../../graphql/mutations";

const AssetCategory = () => {
  const [filter, setFilter] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const { showLoader, hideLoader } = useLoader();
  const [fetchAssetCategories, { loading: queryLoading, refetch }] = useLazyQuery(ASSET_CATEGORIES_QUERY);
  const [hasFetched, setHasFetched] = useState(false);
  const [deleteAssetCategory] = useMutation(DELETE_ASSET_CATEGORY_MUTATION, {
    refetchQueries: [{ query: ASSET_CATEGORIES_QUERY }],
  });

  // Fetch asset categories from GraphQL API
  const getAssetCategories = async () => {
    try {
      showLoader();
      
      // Use refetch if query has been executed before, otherwise use fetchAssetCategories
      let queryData, error;
      if (hasFetched && refetch) {
        const result = await refetch();
        queryData = result.data;
        error = result.error;
      } else {
        const result = await fetchAssetCategories();
        queryData = result.data;
        error = result.error;
        setHasFetched(true);
      }
      
      if (error) {
        console.error("GraphQL error:", error);
        // showToast({
        //   status: "error",
        //   title: "Failed to fetch asset categories.",
        // });
        setData([]);
        return;
      }

      const resultData = (queryData as any)?.masterAssetCategories;
      const normalizedData = Array.isArray(resultData)
        ? resultData.map((item: any) => ({
            ...item,
            // Map GraphQL field names to component expected names
            icon: item.icon_name || item.iconName || item.icon,
            iconcolor: item.icon_color || item.iconColor || item.iconcolor,
            iconType: item.icon_type || item.iconType || item.icontype,
          }))
        : resultData
        ? [{
            ...resultData,
            icon: resultData.icon_name || resultData.iconName || resultData.icon,
            iconcolor: resultData.icon_color || resultData.iconColor || resultData.iconcolor,
            iconType: resultData.icon_type || resultData.iconType || resultData.icontype,
          }]
        : [];
      setData(normalizedData);
    } catch (err) {
      console.error("Error fetching asset categories:", err);
      showToast({
        status: "error",
        title: "Failed to fetch asset categories.",
      });
      setData([]);
    } finally {
      hideLoader();
    }
  };

  const handleDelete = async (assetCategoryId: string) => {
    try {
      showLoader();
      
      const result = await deleteAssetCategory({
        variables: { id: assetCategoryId },
      });

      const deleteResult = (result.data as any)?.deleteMasterAssetCategory;
      if (deleteResult?.success) {
        showToast({
          status: "success",
          title: deleteResult.message || "Asset category deleted successfully.",
        });
        
        // Refresh table
        getAssetCategories();
      }
    } catch (error: any) {
      console.error("Error deleting asset category:", error);
      showToast({
        status: "error",
        title: error?.message || "Failed to delete the asset category.",
      });
    } finally {
      hideLoader();
    }
  };



  // Sorting logic
  const filteredData = useMemo(
    () =>
      data.filter((row) =>
        row.name?.toLowerCase().includes(filter.toLowerCase())
      ),
    [data, filter]
  );

  const openAddModal = () => {
    setModalMode("add");
    setSelectedCategory(null);
    setModalOpen(true);
  };

  const openEditModal = (category: any) => {
    setModalMode("edit");
    setSelectedCategory(category);
    setModalOpen(true);
  };

  useEffect(() => {
    getAssetCategories();
  }, []);

  return (
    <ThemeProvider theme={muiTheme}>
      <Box>
        <div className="card custom-card card-padding">
          <div className="d-flex justify-content-between align-items-center">
            <TextField
              className="search-field"
              placeholder="Search by Name"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              size="small"
              fullWidth
              sx={{ maxWidth: { xs: "100%", sm: 240, md: 300 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={14} />
                  </InputAdornment>
                ),
                endAdornment: filter ? (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Clear"
                      size="small"
                      onClick={() => setFilter("")}
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
              Add Asset Category
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
                  field: "icon",
                  headerName: "Icon",
                  width: 100,
                  sortable: false,
                  filterable: false,
                  renderCell: (params: GridRenderCellParams) => (
                    <Box className="asset-icon-container" sx={{ display: "flex", alignItems: "center", height: "100%" }}>
                      <AssetIcon
                        iconName={params.row.icon_name || params.row.icon || params.row.iconName || ""}
                        iconColor={params.row.icon_color || params.row.iconcolor || params.row.iconColor || "#4A5568"}
                        iconType={(params.row.icon_type || params.row.icontype || params.row.iconType || "Square") as IconType}
                        iconSize="sm"
                      />
                    </Box>
                  ),
                },
                {
                  field: "name",
                  headerName: "Name",
                  flex: 1,
                  minWidth: 160,
                },
                {
                  field: "description",
                  headerName: "Description",
                  flex: 1,
                  minWidth: 180,
                  valueGetter: (params) => params.row.description || "NA",
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
                        onClick={() => handleDelete(params.row.id)}
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
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={modalMode === "add" ? "Add Asset Category" : "Edit Asset Category"}
        >
          <AssetCategoryModal
            mode={modalMode}
            data={selectedCategory}
            getData={getAssetCategories}
            onClose={() => setModalOpen(false)}
          />
        </RightSideModal>
      </Box>
    </ThemeProvider>
  );
};

export default AssetCategory;
