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
import { Search, X, Trash2, Pencil, Plus } from "lucide-react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import RightSideModal from "../../../components/RightSideModal";
import ServiceTypeModal from "./ServiceTypeModal";
import { showToast } from "../../../components/toastService";
import { useLoader } from "../../../context/LoaderContext";
import muiTheme from "../../../themes/muiTheme";
import { SERVICE_TYPE_QUERY, ASSET_CATEGORIES_QUERY } from "../../../graphql/queries";
import { DELETE_SERVICE_TYPE_MUTATION } from "../../../graphql/mutations";

const ServiceType = () => {
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
  const [fetchServiceTypes, { loading: queryLoading, refetch }] = useLazyQuery(SERVICE_TYPE_QUERY);
  const [hasFetched, setHasFetched] = useState(false);
  const [deleteServiceType] = useMutation(DELETE_SERVICE_TYPE_MUTATION, {
    refetchQueries: [{ query: SERVICE_TYPE_QUERY }],
  });

  // Fetch asset categories to map asset_category_ids to names
  const { data: assetCategoriesData } = useQuery(ASSET_CATEGORIES_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  // Create asset category map
  const assetCategoryMap = useMemo(() => {
    const assetCategories = (assetCategoriesData as any)?.masterAssetCategories || [];
    return new Map(assetCategories.map((ac: any) => [ac.id, ac.name || ""]));
  }, [assetCategoriesData]);

  const filteredData = useMemo(
    () =>
      manufacturerData.filter((item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.assetCategoryNames?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [manufacturerData, searchTerm]
  );

  // Fetch service type data from GraphQL API
  const getServiceTypeDetails = async () => {
    try {
      showLoader();
      
      // Use refetch if query has been executed before, otherwise use fetchServiceTypes
      let queryData, error;
      if (hasFetched && refetch) {
        const result = await refetch();
        queryData = result.data;
        error = result.error;
      } else {
        const result = await fetchServiceTypes();
        queryData = result.data;
        error = result.error;
        setHasFetched(true);
      }
      
      if (error) {
        console.error("GraphQL error:", error);
        setManufacturerData([]);
        return;
      }

      const resultData = (queryData as any)?.masterAssetServiceTypes;
      
      // Get asset categories map for mapping IDs to names
      const assetCategories = (assetCategoriesData as any)?.masterAssetCategories || [];
      const categoryMap = new Map(assetCategories.map((ac: any) => [ac.id, ac.name || ""]));
      
      const normalizedData = Array.isArray(resultData)
        ? resultData.map((item: any) => {
            const categoryIds = item.asset_category_ids || [];
            const categoryNames = categoryIds
              .map((id: string) => categoryMap.get(id))
              .filter((name: string | undefined) => name)
              .join(", ");
            
            return {
              ...item,
              assetCategoryNames: categoryNames || "N/A",
            };
          })
        : resultData
        ? [{
            ...resultData,
            assetCategoryNames: (resultData.asset_category_ids || [])
              .map((id: string) => categoryMap.get(id))
              .filter((name: string | undefined) => name)
              .join(", ") || "N/A",
          }]
        : [];
      
      setManufacturerData(normalizedData);
    } catch (err) {
      console.error("Error fetching service types:", err);
      setManufacturerData([]);
    } finally {
      hideLoader();
    }
  };

  // Re-map service type data when asset categories are loaded
  useEffect(() => {
    if (assetCategoriesData && manufacturerData.length > 0) {
      const assetCategories = (assetCategoriesData as any)?.masterAssetCategories || [];
      const assetCategoryMap = new Map(assetCategories.map((ac: any) => [ac.id, ac.name || ""]));
      
      const updatedData = manufacturerData.map((item: any) => {
        const categoryIds = item.asset_category_ids || [];
        const categoryNames = categoryIds
          .map((id: string) => assetCategoryMap.get(id))
          .filter((name: string | undefined) => name)
          .join(", ");
        
        return {
          ...item,
          assetCategoryNames: categoryNames || "N/A",
        };
      });
      
      // Only update if asset category names have changed
      const hasChanges = updatedData.some((item: any, index: number) => 
        item.assetCategoryNames !== manufacturerData[index]?.assetCategoryNames
      );
      
      if (hasChanges) {
        setManufacturerData(updatedData);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetCategoriesData]);

  useEffect(() => {
    getServiceTypeDetails();
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
  const handleDeleteServiceType = async (workId: any) => {
    try {
      showLoader();
      
      const result = await deleteServiceType({
        variables: { id: workId.id },
      });

      const deleteResult = (result.data as any)?.deleteMasterAssetServiceType;
      if (deleteResult) {
        if (deleteResult.success) {
          showToast({
            status: "success",
            title: deleteResult.message || "Service type deleted successfully.",
          });
          
          // Refresh table
          getServiceTypeDetails();
        } else {
          showToast({
            status: "error",
            title: deleteResult.message || "Failed to delete service type.",
          });
        }
      }
    } catch (error: any) {
      console.error("Error deleting service type:", error);
      showToast({
        status: "error",
        title: error?.message || "Failed to delete service type.",
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
      field: "assetCategoryNames",
      headerName: "Asset Category",
      flex: 1,
      minWidth: 160,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          {params.row.assetCategoryNames || "N/A"}
        </Box>
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
            onClick={() => handleDeleteServiceType(params.row)}
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
        id: row.id || row.ID || row.name,
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
              placeholder="Search by Name, Description, or Asset Category"
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
              Add Service Type
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
          isOpen={manufacturerModalOpen}
          onClose={() => {
            setManufacturerModalOpen(false);
            setSelectedManufacturer(null);
          }}
          title={modalMode === "add" ? "Add Service Type" : "Edit Service Type"}
        >
          {manufacturerModalOpen && (
            <ServiceTypeModal
              key={`${modalMode}-${selectedManufacturer?.id || 'new'}`}
              mode={modalMode}
              data={selectedManufacturer}
              getData={getServiceTypeDetails}
              onClose={() => {
                setManufacturerModalOpen(false);
                setSelectedManufacturer(null);
              }}
            />
          )}
        </RightSideModal>
      </Box>
    </ThemeProvider>
  );
};

export default ServiceType;