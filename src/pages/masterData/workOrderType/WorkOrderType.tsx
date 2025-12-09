import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ThemeProvider } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import SvgIcon, { SvgIconProps } from "@mui/material/SvgIcon";
import { DataGrid, GridColDef, GridRenderCellParams, GridPaginationModel } from "@mui/x-data-grid";
import { useLazyQuery, useMutation } from "@apollo/client/react";
// import ManufacturerDetailsModal from "./ManufacturerModal";
import RightSideModal from "../../../components/RightSideModal";
import WorkOrderTypeModal from "./WorkOrderTypeModal";
import { showToast } from "../../../components/toastService";
import { useLoader } from "../../../context/LoaderContext";
import muiTheme from "../../../themes/muiTheme";
import { Trash2, Pencil, Plus, X, Search   } from 'lucide-react';
import { WORKORDER_TYPES_QUERY } from "../../../graphql/queries";
import { DELETE_WORK_ORDER_TYPE_MUTATION } from "../../../graphql/mutations";

const WorkOrderType = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [manufacturerModalOpen, setManufacturerModalOpen] = useState(false);
  const [wordorderTypeData, setWorkorrdwrTypeData] = useState<any[]>([]);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedManufacturer, setSelectedManufacturer] = useState<any>(null);
  const { showLoader, hideLoader } = useLoader();
  const [fetchWorkOrderTypes, { loading: queryLoading, refetch }] = useLazyQuery(WORKORDER_TYPES_QUERY);
  const [hasFetched, setHasFetched] = useState(false);
  const [deleteWorkOrderType] = useMutation(DELETE_WORK_ORDER_TYPE_MUTATION, {
    refetchQueries: [{ query: WORKORDER_TYPES_QUERY }],
  });
  
  // Filter data based on search
  const filteredData = wordorderTypeData.filter((item) =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fetch work order type data from GraphQL API
  const getWorkOrderTypesDetails = async () => {
    try {
      showLoader();
      
      // Use refetch if query has been executed before, otherwise use fetchWorkOrderTypes
      let queryData, error;
      if (hasFetched && refetch) {
        const result = await refetch();
        queryData = result.data;
        error = result.error;
      } else {
        const result = await fetchWorkOrderTypes();
        queryData = result.data;
        error = result.error;
        setHasFetched(true);
      }
      
      if (error) {
        console.error("GraphQL error:", error);
      
        setWorkorrdwrTypeData([]);
        return;
      }

      const resultData = (queryData as any)?.workordertypes;
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
      
      setWorkorrdwrTypeData(sortedData);
    } catch (err: any) {
      console.error("Error fetching work order types:", err);
     
      setWorkorrdwrTypeData([]);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    getWorkOrderTypesDetails();
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
  const handleDeleteWorkOrder = async (workId: any) => {
    if (!workId?.id) {
      showToast({
        status: "error",
        title: "Invalid work order type ID.",
      });
      return;
    }

    try {
      showLoader();
      
      const result = await deleteWorkOrderType({
        variables: { id: workId.id },
      });

      if (result.data) {
        showToast({
          status: "success",
          title: "Work order type deleted successfully.",
        });
        
        // Refresh table
        getWorkOrderTypesDetails();
      }
    } catch (error: any) {
      console.error("Error deleting work order type:", error);
      showToast({
        status: "error",
        title: error?.message || "Failed to delete work order type. Please try again.",
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
            // className="edit-btn"
            aria-label="Edit"
            onClick={() => openEditModal(params.row)}
            size="small"
            
          >
            <Pencil size={16} />
          </IconButton>
          <IconButton
            // className="delete-btn"
            aria-label="Delete"
            color="error"
            onClick={() => handleDeleteWorkOrder(params.row)}
            size="small"
          >
            <Trash2 size={16} />
          </IconButton>
          
          
        </Box>
      ),
    },
  ];

  const rows = filteredData.map((row) => ({ ...row, id: row.id || row.ID || row.name }));

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
            Add Workorder Type
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

      {/* Table */}
      {/* <Box className="table-card">
      <Box className="table-card-header" display="flex" justifyContent="space-between" alignItems="center">
        <Typography className="table-card-title" component="div">
          Workorder Type
        </Typography>
        <Box display="flex" gap={3}>
          
          <Box display="flex" justifyContent="flex-end">
           
          </Box>
          <Button
            className="add-btn"
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={openAddModal}
          >
            Add Workorder
          </Button>
        </Box>
      </Box>
        <Paper className="master-data-table" sx={{ height: 500, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            disableRowSelectionOnClick
            sortingOrder={["asc", "desc"]}
            paginationModel={paginationModel}
            pageSizeOptions={[5, 10, 25, 50]}
            onPaginationModelChange={setPaginationModel}
            sx={{
              "& .MuiDataGrid-columnHeaders": {
                fontWeight: 600,
              },
            }}
            localeText={{
              noRowsLabel: "No Data Found",
            }}
          />
        </Paper>
      </Box> */}

      {/* Pagination */}
        {/* <Flex justify="flex-end" mt={6} gap={2}>
          <Button isDisabled={currentPage === 1} variant="outline">
            Previous
          </Button>
          <Button variant="outline">Next</Button>
        </Flex> */}

      {/* Modal */}
      <RightSideModal
        isOpen={manufacturerModalOpen}
        onClose={() => {
          setManufacturerModalOpen(false);
          setSelectedManufacturer(null);
        }}
        title={modalMode === "add" ? "Add Workorder Type" : "Edit Workorder Type"}
      >
        {manufacturerModalOpen && (
          <WorkOrderTypeModal
            key={`${modalMode}-${selectedManufacturer?.id || 'new'}`}
            mode={modalMode}
            data={selectedManufacturer}
            getData={getWorkOrderTypesDetails}
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

export default WorkOrderType;

