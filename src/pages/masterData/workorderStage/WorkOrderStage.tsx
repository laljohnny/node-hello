import React, { useState, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { ThemeProvider } from "@mui/material/styles";
import { DataGrid, GridColDef, GridRenderCellParams, GridPaginationModel } from "@mui/x-data-grid";
import { useLazyQuery, useMutation } from "@apollo/client/react";
import RightSideModal from "../../../components/RightSideModal";
import WorkOrderStageModal from "./WorkOrderStageModal";
import { showToast } from "../../../components/toastService";
import { useLoader } from "../../../context/LoaderContext";
import muiTheme from "../../../themes/muiTheme";
import { Trash2, Pencil, Plus, X, Search } from 'lucide-react';
import { WORKORDER_STAGES_QUERY } from "../../../graphql/queries";
import { DELETE_WORK_ORDER_STAGE_MUTATION } from "../../../graphql/mutations";

const WorkOrderStage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [manufacturerModalOpen, setManufacturerModalOpen] = useState(false);
  const [manufacturerData, setManufacturerData] = useState<any[]>([]);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedManufacturer, setSelectedManufacturer] = useState<any>(null);
  const { showLoader, hideLoader } = useLoader();
  const [fetchWorkOrderStages, { loading: queryLoading, refetch }] = useLazyQuery(WORKORDER_STAGES_QUERY);
  const [hasFetched, setHasFetched] = useState(false);
  const [deleteWorkOrderStage] = useMutation(DELETE_WORK_ORDER_STAGE_MUTATION, {
    refetchQueries: [{ query: WORKORDER_STAGES_QUERY }],
  });
  
  // Filter data based on search
  const filteredData = useMemo(
    () =>
      manufacturerData.filter((item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [manufacturerData, searchTerm]
  );

  // Fetch workorder stage data from GraphQL API
  const getWorkOrderStageDetails = async () => {
    try {
      showLoader();
      
      // Use refetch if query has been executed before, otherwise use fetchWorkOrderStages
      let queryData, error;
      if (hasFetched && refetch) {
        const result = await refetch();
        queryData = result.data;
        error = result.error;
      } else {
        const result = await fetchWorkOrderStages();
        queryData = result.data;
        error = result.error;
        setHasFetched(true);
      }
      
      if (error) {
        console.error("GraphQL error:", error);
        setManufacturerData([]);
        return;
      }

      const resultData = (queryData as any)?.workorderstages;
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
      
      setManufacturerData(sortedData);
    } catch (err) {
      console.error("Error fetching work order stages:", err);
      setManufacturerData([]);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    getWorkOrderStageDetails();
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
  
  const handleDeleteWorkOrderStage = async (workId: any) => {
    try {
      showLoader();
      
      const result = await deleteWorkOrderStage({
        variables: { id: workId.id },
      });

      if (result.data) {
        showToast({
          status: "success",
          title: "Work order stage deleted successfully.",
        });
        
        // Refresh table
        getWorkOrderStageDetails();
      }
    } catch (error: any) {
      console.error("Error deleting work order stage:", error);
      showToast({
        status: "error",
        title: error?.message || "Failed to delete work order stage.",
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
      sortable: true,
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
            onClick={() => handleDeleteWorkOrderStage(params.row)}
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
              placeholder="Search by Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              fullWidth
              sx={{ maxWidth: { xs: "100%", sm: 200, md: 250 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search  size={14} />
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
            startIcon={<Plus size={16}/>}
            onClick={openAddModal}
          >
            Add Workorder Stage
          </Button>
        </div>
        <div className="mt-1" style={{height:'500px'}}>
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

      {/* Modal */}
      <RightSideModal
        isOpen={manufacturerModalOpen}
        onClose={() => {
          setManufacturerModalOpen(false);
          setSelectedManufacturer(null);
        }}
        title={modalMode === "add" ? "Add Workorder Stage" : "Edit Workorder Stage"}
      >
        {manufacturerModalOpen && (
          <WorkOrderStageModal
            key={`${modalMode}-${selectedManufacturer?.id || 'new'}`}
            mode={modalMode}
            data={selectedManufacturer}
            getData={getWorkOrderStageDetails}
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

export default WorkOrderStage;

