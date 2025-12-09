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
import { useLazyQuery, useMutation } from "@apollo/client/react";
import RightSideModal from "../../../components/RightSideModal";
import AssetPartFieldsForm from "./AssetPartFieldsForm";
import { showToast } from "../../../components/toastService";
import { useLoader } from "../../../context/LoaderContext";
import muiTheme from "../../../themes/muiTheme";
import { ASSET_PART_FIELDS_QUERY } from "../../../graphql/queries";
import { DELETE_ASSET_PART_FIELD_MUTATION } from "../../../graphql/mutations";

const AssetPartFields = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [assetPartFieldsData, setAssetPartFieldsData] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedField, setSelectedField] = useState<any>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const { showLoader, hideLoader } = useLoader();
  const [fetchAssetPartFields, { loading: queryLoading, refetch }] = useLazyQuery(ASSET_PART_FIELDS_QUERY);
  const [hasFetched, setHasFetched] = useState(false);
  const [deleteAssetPartField] = useMutation(DELETE_ASSET_PART_FIELD_MUTATION, {
    refetchQueries: [{ query: ASSET_PART_FIELDS_QUERY, variables: { asset_part_id: null } }],
  });

  const filteredData = useMemo(
    () =>
      assetPartFieldsData.filter((item) =>
        item.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [assetPartFieldsData, searchTerm]
  );

  // Fetch asset part fields data from GraphQL API
  const getAssetPartFieldsDetails = async () => {
    try {
      showLoader();
      
      // Use refetch if query has been executed before, otherwise use fetchAssetPartFields
      let queryData, error;
      if (hasFetched && refetch) {
        const result = await refetch({ asset_part_id: null });
        queryData = result.data;
        error = result.error;
      } else {
        const result = await fetchAssetPartFields({
          variables: { asset_part_id: null },
        });
        queryData = result.data;
        error = result.error;
        setHasFetched(true);
      }
      
      if (error) {
        console.error("GraphQL error:", error);
        setAssetPartFieldsData([]);
        return;
      }

      const resultData = (queryData as any)?.masterAssetPartFields;
      
      // Map asset part fields to display format
      const normalizedData = Array.isArray(resultData)
        ? resultData.map((item: any) => {
            return {
              id: item.id,
              parent_id: item.parent_id || null,
              asset_part_id: item.asset_part_id || "",
              label: item.field_name || "",
              field_name: item.field_name || "",
              description: item.description || "",
              type: item.field_type || "",
              field_type: item.field_type || "",
              unit: item.unit || "",
              required: item.is_required ? "Yes" : "No",
              is_required: item.is_required || false,
              order: item.display_order || 0,
              display_order: item.display_order || 0,
              selectOptions: item.allowed_values || "",
              allowed_values: item.allowed_values || "",
              showInPanel: item.show_in_panel ? "Yes" : "No",
              show_in_panel: item.show_in_panel || false,
            };
          })
        : resultData
        ? [{
            id: resultData.id,
            parent_id: resultData.parent_id || null,
            asset_part_id: resultData.asset_part_id || "",
            label: resultData.field_name || "",
            field_name: resultData.field_name || "",
            description: resultData.description || "",
            type: resultData.field_type || "",
            field_type: resultData.field_type || "",
            unit: resultData.unit || "",
            required: resultData.is_required ? "Yes" : "No",
            is_required: resultData.is_required || false,
            order: resultData.display_order || 0,
            display_order: resultData.display_order || 0,
            selectOptions: resultData.allowed_values || "",
            allowed_values: resultData.allowed_values || "",
            showInPanel: resultData.show_in_panel ? "Yes" : "No",
            show_in_panel: resultData.show_in_panel || false,
          }]
        : [];
      
      // Sort by display_order, then by id
      const sortedData = [...normalizedData].sort((a: any, b: any) => {
        if (a.display_order !== b.display_order) {
          return (a.display_order || 0) - (b.display_order || 0);
        }
        return (a.id || "").localeCompare(b.id || "");
      });
      
      setAssetPartFieldsData(sortedData);
    } catch (err: any) {
      console.error("Error fetching asset part fields:", err);
      setAssetPartFieldsData([]);
      showToast({
        status: "error",
        title: "Failed to load asset part fields.",
      });
    } finally {
      hideLoader();
    }
  };

  const handleDelete = async (fieldId: string) => {
    try {
      showLoader();
      
      const result = await deleteAssetPartField({
        variables: { id: fieldId },
      });

      const deleteResult = (result.data as any)?.deleteMasterAssetPartField;
      if (deleteResult?.success) {
        showToast({
          status: "success",
          title: deleteResult.message || "Asset part field deleted successfully.",
        });
        
        // Refresh table
        getAssetPartFieldsDetails();
      }
    } catch (error: any) {
      console.error("Error deleting asset part field:", error);
      showToast({
        status: "error",
        title: error?.message || "Failed to delete the asset part field.",
      });
    } finally {
      hideLoader();
    }
  };

  const openAddModal = () => {
    setModalMode("add");
    setSelectedField(null);
    setModalOpen(true);
  };

  const openEditModal = (field: any) => {
    setModalMode("edit");
    setSelectedField(field);
    setModalOpen(true);
  };

  useEffect(() => {
    getAssetPartFieldsDetails();
  }, []);

  const columns: GridColDef[] = [
    {
      field: "label",
      headerName: "Label",
      flex: 1,
      minWidth: 160,
      sortable: true,
    },
    {
      field: "type",
      headerName: "Field Type",
      flex: 1,
      minWidth: 120,
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
        id: row.id || row.label,
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
              placeholder="Search by Label, Description, or Type"
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
              startIcon={<Plus size={16} />}
              onClick={openAddModal}
            >
              Add Asset Part Field
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
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={modalMode === "add" ? "Add Asset Part Field" : "Edit Asset Part Field"}
          key={modalOpen ? `${modalMode}-${selectedField?.id || 'new'}` : undefined}
        >
          <AssetPartFieldsForm
            mode={modalMode}
            data={selectedField}
            getData={getAssetPartFieldsDetails}
            onClose={() => setModalOpen(false)}
          />
        </RightSideModal>
      </Box>
    </ThemeProvider>
  );
};

export default AssetPartFields;

