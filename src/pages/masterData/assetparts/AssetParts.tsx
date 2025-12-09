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
import { Search, X, Trash2, Pencil, Plus } from "lucide-react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import RightSideModal from "../../../components/RightSideModal";
import AssetPartModal from "./AssetPartModal";
import { showToast } from "../../../components/toastService";
import { useLoader } from "../../../context/LoaderContext";
import muiTheme from "../../../themes/muiTheme";
import { ASSET_PARTS_QUERY, ASSET_TYPES_QUERY } from "../../../graphql/queries";
import { REMOVE_ASSET_PART_MUTATION } from "../../../graphql/mutations";

const AssetParts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [assetPartModalOpen, setAssetPartModalOpen] = useState(false);
  const [assetPartData, setAssetPartData] = useState<any[]>([]);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedAssetPart, setSelectedAssetPart] = useState<any>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const { showLoader, hideLoader } = useLoader();
  const [fetchAssetParts, { loading: queryLoading, refetch }] = useLazyQuery(ASSET_PARTS_QUERY);
  const [hasFetched, setHasFetched] = useState(false);
  const [deleteAssetPart] = useMutation(REMOVE_ASSET_PART_MUTATION, {
    refetchQueries: [{ query: ASSET_PARTS_QUERY }],
  });

  // Fetch asset types to map asset_type_id to name
  const { data: assetTypesData } = useQuery(ASSET_TYPES_QUERY, {
    variables: { asset_category_id: null },
  });

  // Create asset type map
  const assetTypeMap = useMemo(() => {
    const assetTypes = (assetTypesData as any)?.masterAssetTypes || [];
    return new Map(assetTypes.map((at: any) => [at.id, at.name || ""]));
  }, [assetTypesData]);

  const filteredData = useMemo(
    () =>
      assetPartData.filter((item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [assetPartData, searchTerm]
  );

  // Fetch asset parts data from GraphQL API
  const getAssetPartDetails = async () => {
    try {
      showLoader();
      
      // Use refetch if query has been executed before, otherwise use fetchAssetParts
      let queryData, error;
      if (hasFetched && refetch) {
        const result = await refetch();
        queryData = result.data;
        error = result.error;
      } else {
        const result = await fetchAssetParts();
        queryData = result.data;
        error = result.error;
        setHasFetched(true);
      }
      
      if (error) {
        console.error("GraphQL error:", error);
        setAssetPartData([]);
        return;
      }

      const resultData = (queryData as any)?.masterAssetParts;
      
      // Map asset parts to display format
      const normalizedData = Array.isArray(resultData)
        ? resultData.map((item: any) => {
            return {
              id: item.id,
              name: item.name || "",
              description: item.description || "",
              asset_type_id: item.asset_type_id || "",
              assetTypeName: item.asset_type_id 
                ? (assetTypeMap.get(item.asset_type_id) || "N/A")
                : "N/A",
            };
          })
        : resultData
        ? [{
            id: resultData.id,
            name: resultData.name || "",
            description: resultData.description || "",
            asset_type_id: resultData.asset_type_id || "",
            assetTypeName: resultData.asset_type_id 
              ? (assetTypeMap.get(resultData.asset_type_id) || "N/A")
              : "N/A",
          }]
        : [];
      
      setAssetPartData(normalizedData);
    } catch (err: any) {
      console.error("Error fetching asset parts:", err);
      setAssetPartData([]);
    } finally {
      hideLoader();
    }
  };

  // Re-map asset part data when asset types are loaded
  useEffect(() => {
    if (assetTypesData && assetPartData.length > 0) {
      const assetTypes = (assetTypesData as any)?.masterAssetTypes || [];
      const assetTypeMap = new Map(assetTypes.map((at: any) => [at.id, at.name || ""]));
      
      const updatedData = assetPartData.map((item: any) => ({
        ...item,
        assetTypeName: item.asset_type_id 
          ? (assetTypeMap.get(item.asset_type_id) || "N/A")
          : "N/A",
      }));
      
      // Only update if asset type names have changed
      const hasChanges = updatedData.some((item: any, index: number) => 
        item.assetTypeName !== assetPartData[index]?.assetTypeName
      );
      
      if (hasChanges) {
        setAssetPartData(updatedData);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetTypesData]);

  useEffect(() => {
    getAssetPartDetails();
  }, []);

  const openAddModal = () => {
    setModalMode("add");
    setSelectedAssetPart(null);
    setAssetPartModalOpen(true);
  };

  const openEditModal = (assetPart: any) => {
    setModalMode("edit");
    setSelectedAssetPart(assetPart);
    setAssetPartModalOpen(true);
  };

  const handleDeleteAssetPart = async (assetPartId: any) => {
    if (!assetPartId?.id) {
      showToast({
        status: "error",
        title: "Invalid asset part ID.",
      });
      return;
    }

    

    try {
      showLoader();
      
      const result = await deleteAssetPart({
        variables: { id: assetPartId.id },
      });

      const deleteResult = (result.data as any)?.deleteMasterAssetPart;
      if (deleteResult?.success) {
        showToast({
          status: "success",
          title: deleteResult.message || "Asset part deleted successfully.",
        });
        
        // Refresh table
        getAssetPartDetails();
      }
    } catch (error: any) {
      console.error("Error deleting asset part:", error);
      showToast({
        status: "error",
        title: error?.message || "Failed to delete asset part. Please try again.",
      });
    } finally {
      hideLoader();
    }
  };
  

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 160,
      sortable: true,
    },
    {
      field: "description",
      headerName: "Description",
      flex: 1.5,
      minWidth: 180,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {params.row.description || "NA"}
        </Box>
      ),
    },
    {
      field: "assetTypeName",
      headerName: "Asset Type",
      flex: 1,
      minWidth: 160,
      sortable: true,
      valueGetter: (params) => params.row.assetTypeName || "N/A",
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
            onClick={() => handleDeleteAssetPart(params.row)}
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
        id: row.id || row.name,
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
              placeholder="Search by Name or Description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              fullWidth
              sx={{ maxWidth: { xs: "100%", sm: 200, md: 250 } }}
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
              onClick={openAddModal}
              startIcon={<Plus size={16}/>}
            >
              Create Asset Part
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
              loading={queryLoading}
              localeText={{
                noRowsLabel: "No Data Found",
              }}
            />
          </div>
        </div>

        <RightSideModal
          isOpen={assetPartModalOpen}
          onClose={() => {
            setAssetPartModalOpen(false);
            setSelectedAssetPart(null);
          }}
          title={modalMode === "add" ? "Add Asset Part" : "Edit Asset Part"}
        >
          {assetPartModalOpen && (
            <AssetPartModal
              key={`${modalMode}-${selectedAssetPart?.id || 'new'}`}
              mode={modalMode}
              data={selectedAssetPart}
              getData={getAssetPartDetails}
              onClose={() => {
                setAssetPartModalOpen(false);
                setSelectedAssetPart(null);
              }}
            />
          )}
        </RightSideModal>
      </Box>
    </ThemeProvider>
  );
};

export default AssetParts;

