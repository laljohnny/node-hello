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
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { Search, X, Trash2, Pencil, Plus } from "lucide-react";
import AssetTypeModal from "./AssetTypeModal";
import RightSideModal from "../../../components/RightSideModal";
import muiTheme from "../../../themes/muiTheme";
import { showToast } from "../../../components/toastService";
import { useLoader } from "../../../context/LoaderContext";
import { AssetIcon, IconType } from "../../../components/assetIcons";
import { ASSET_TYPES_QUERY, ASSET_CATEGORIES_QUERY } from "../../../graphql/queries";
import { DELETE_ASSET_TYPE_MUTATION } from "../../../graphql/mutations";

const AssetType = () => {
  const [filter, setFilter] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedType, setSelectedType] = useState<any>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const { showLoader, hideLoader } = useLoader();
  const [fetchAssetTypes, { loading: queryLoading, refetch }] = useLazyQuery(ASSET_TYPES_QUERY);
  const [hasFetched, setHasFetched] = useState(false);
  const [deleteAssetType] = useMutation(DELETE_ASSET_TYPE_MUTATION, {
    refetchQueries: [{ query: ASSET_TYPES_QUERY, variables: { asset_category_id: null } }],
  });

  // Fetch asset categories to map asset_category_id to name
  const { data: assetCategoriesData } = useQuery(ASSET_CATEGORIES_QUERY);

  // Create asset category map
  const assetCategoryMap = useMemo(() => {
    const assetCategories = (assetCategoriesData as any)?.masterAssetCategories || [];
    return new Map(assetCategories.map((ac: any) => [ac.id, ac.name || ""]));
  }, [assetCategoriesData]);

  // Fetch asset types from GraphQL API
  const getAssetTypes = async () => {
    try {
      showLoader();
      
      // Use refetch if query has been executed before, otherwise use fetchAssetTypes
      let queryData, error;
      if (hasFetched && refetch) {
        const result = await refetch({ asset_category_id: null });
        queryData = result.data;
        error = result.error;
      } else {
        const result = await fetchAssetTypes({ variables: { asset_category_id: null } });
        queryData = result.data;
        error = result.error;
        setHasFetched(true);
      }
      
      if (error) {
        console.error("GraphQL error:", error);
        // showToast({
        //   status: "error",
        //   title: "Failed to fetch asset types.",
        // });
        setData([]);
        return;
      }

      const resultData = (queryData as any)?.masterAssetTypes;
      const normalizedData = Array.isArray(resultData)
        ? resultData.map((item: any) => ({
            ...item,
            // Map GraphQL field names to component expected names
            icon: item.icon_name || item.iconName || item.icon,
            iconcolor: item.icon_color || item.iconColor || item.iconcolor,
            iconType: item.icon_type || item.iconType || item.icontype,
            assetCategoryName: item.asset_category_id 
              ? (assetCategoryMap.get(item.asset_category_id) || "N/A")
              : "N/A",
          }))
        : resultData
        ? [{
            ...resultData,
            icon: resultData.icon_name || resultData.iconName || resultData.icon,
            iconcolor: resultData.icon_color || resultData.iconColor || resultData.iconcolor,
            iconType: resultData.icon_type || resultData.iconType || resultData.icontype,
            assetCategoryName: resultData.asset_category_id 
              ? (assetCategoryMap.get(resultData.asset_category_id) || "N/A")
              : "N/A",
          }]
        : [];
      
      setData(normalizedData);
    } catch (err) {
      console.error("Error fetching asset types:", err);
      // showToast({
      //   status: "error",
      //   title: "Failed to fetch asset types.",
      // });
      setData([]);
    } finally {
      hideLoader();
    }
  };

  const handleDelete = async (assetTypeId: string) => {
    try {
      showLoader();
      
      const result = await deleteAssetType({
        variables: { id: assetTypeId },
      });

      const deleteResult = (result.data as any)?.deleteMasterAssetType;
      if (deleteResult?.success) {
        showToast({
          status: "success",
          title: deleteResult.message || "Asset type deleted successfully.",
        });
        
        // Refresh table
        getAssetTypes();
      }
    } catch (error: any) {
      console.error("Error deleting asset type:", error);
      showToast({
        status: "error",
        title: error?.message || "Failed to delete the asset type.",
      });
    } finally {
      hideLoader();
    }
  };

  // Re-map asset type data when asset categories are loaded
  useEffect(() => {
    if (assetCategoriesData && data.length > 0) {
      const assetCategories = (assetCategoriesData as any)?.masterAssetCategories || [];
      const assetCategoryMap = new Map(assetCategories.map((ac: any) => [ac.id, ac.name || ""]));
      
      const updatedData = data.map((item: any) => ({
        ...item,
        assetCategoryName: item.asset_category_id 
          ? (assetCategoryMap.get(item.asset_category_id) || "N/A")
          : "N/A",
      }));
      
      setData(updatedData);
    }
  }, [assetCategoriesData]);

  useEffect(() => {
    getAssetTypes();
  }, []);

  // Sorting logic
  const filteredData = useMemo(
    () =>
      data.filter((row) => {
        const value = filter.toLowerCase();
        return (
          row.name?.toLowerCase().includes(value) ||
          row.assetCategoryName?.toLowerCase().includes(value) ||
          row.description?.toLowerCase().includes(value)
        );
      }),
    [data, filter]
  );

  const openAddModal = () => {
    setModalMode("add");
    setSelectedType(null);
    setModalOpen(true);
  };

  const openEditModal = (type: any) => {
    setModalMode("edit");
    setSelectedType(type);
    setModalOpen(true);
  };

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
              Add Asset Type
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
                  field: "assetCategoryName",
                  headerName: "Asset Category",
                  flex: 1,
                  minWidth: 160,
                  renderCell: (params: GridRenderCellParams) => (
                    <Box>
                      {params.row.assetCategoryName || "N/A"}
                    </Box>
                  ),
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
          title={modalMode === "add" ? "Add Asset Type" : "Edit Asset Type"}
          key={modalOpen ? `${modalMode}-${selectedType?.id || 'new'}` : undefined}
        >
          <AssetTypeModal
            mode={modalMode}
            data={selectedType}
            getData={getAssetTypes}
            onClose={() => setModalOpen(false)}
          />
        </RightSideModal>
      </Box>
    </ThemeProvider>
  );
};

export default AssetType;
