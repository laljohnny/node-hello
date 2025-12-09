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
import AssignmentTypeModal from "./AssignmentTypeModal";
import { showToast } from "../../../components/toastService";
import { useLoader } from "../../../context/LoaderContext";
import muiTheme from "../../../themes/muiTheme";
import { ASSIGNMENTS_TYPES_QUERY, WORK_ORDERS_QUERY } from "../../../graphql/queries";
import { DELETE_ASSIGNMENT_MUTATION } from "../../../graphql/mutations";

const AssignmentType = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [assignmentTypeModalOpen, setAssignmentTypeModalOpen] = useState(false);
  const [assignmentTypeData, setAssignmentTypeData] = useState<any[]>([]);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedAssignmentType, setSelectedAssignmentType] = useState<any>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const { showLoader, hideLoader } = useLoader();
  const [fetchAssignmentTypes, { loading: queryLoading, refetch }] = useLazyQuery(ASSIGNMENTS_TYPES_QUERY);
  const [hasFetched, setHasFetched] = useState(false);
  const [deleteAssignment] = useMutation(DELETE_ASSIGNMENT_MUTATION, {
    refetchQueries: [{ query: ASSIGNMENTS_TYPES_QUERY }],
  });
  
  // Fetch work orders to map workOrderId to work order name
  const { data: workOrdersData } = useQuery(WORK_ORDERS_QUERY);
  
  const filteredData = useMemo(
    () =>
      assignmentTypeData.filter((item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [assignmentTypeData, searchTerm]
  );

  // Fetch assignment type data from GraphQL API
  const getAssignmentTypeDetails = async () => {
    try {
      showLoader();
      
      // Use refetch if query has been executed before, otherwise use fetchAssignmentTypes
      let queryData, error;
      if (hasFetched && refetch) {
        const result = await refetch();
        queryData = result.data;
        error = result.error;
      } else {
        const result = await fetchAssignmentTypes();
        queryData = result.data;
        error = result.error;
        setHasFetched(true);
      }
      
      if (error) {
        console.error("GraphQL error:", error);
        setAssignmentTypeData([]);
        return;
      }

      const resultData = (queryData as any)?.workorderassignments;
      
      // Get work orders for mapping
      const workOrders = (workOrdersData as any)?.workorders || [];
      const workOrderMap = new Map(
        workOrders.map((wo: any) => [wo.id, wo.name || wo.key || `Work Order ${wo.id}`])
      );
      
      // Map assignments to display format
      const normalizedData = Array.isArray(resultData)
        ? resultData.map((item: any) => {
            const workOrderName = item.workOrderId ? workOrderMap.get(item.workOrderId) || "N/A" : "N/A";
            return {
              id: item.id,
              name: item.assignmentType || "",
              assignmentType: item.assignmentType || "",
              workOrderId: item.workOrderId || "",
              workOrderName: workOrderName,
              userId: item.userId || "",
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              deletedAt: item.deletedAt,
            };
          })
        : resultData
        ? (() => {
            const workOrderName = resultData.workOrderId ? workOrderMap.get(resultData.workOrderId) || "N/A" : "N/A";
            return [{
              id: resultData.id,
              name: resultData.assignmentType || "",
              assignmentType: resultData.assignmentType || "",
              workOrderId: resultData.workOrderId || "",
              workOrderName: workOrderName,
              userId: resultData.userId || "",
              createdAt: resultData.createdAt,
              updatedAt: resultData.updatedAt,
              deletedAt: resultData.deletedAt,
            }];
          })()
        : [];
      
      // Sort by createdAt descending (newest first)
      const sortedData = [...normalizedData].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      setAssignmentTypeData(sortedData);
    } catch (err: any) {
      console.error("Error fetching assignment types:", err);
      setAssignmentTypeData([]);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    getAssignmentTypeDetails();
  }, []);

  // Re-map assignment data when work orders are loaded
  useEffect(() => {
    if (workOrdersData && assignmentTypeData.length > 0) {
      const workOrders = (workOrdersData as any)?.workorders || [];
      const workOrderMap = new Map(
        workOrders.map((wo: any) => [wo.id, wo.name || wo.key || `Work Order ${wo.id}`])
      );
      
      const updatedData = assignmentTypeData.map((item: any) => {
        const workOrderName = item.workOrderId ? workOrderMap.get(item.workOrderId) || "N/A" : "N/A";
        return {
          ...item,
          workOrderName: workOrderName,
        };
      });
      
      setAssignmentTypeData(updatedData);
    }
  }, [workOrdersData]);

  const openAddModal = () => {
    setModalMode("add");
    setSelectedAssignmentType(null);
    setAssignmentTypeModalOpen(true);
  };

  const openEditModal = (assignmentType: any) => {
    setModalMode("edit");
    setSelectedAssignmentType(assignmentType);
    setAssignmentTypeModalOpen(true);
  };

  const handleDeleteAssignmentType = async (assignmentId: any) => {
    if (!assignmentId?.id) {
      showToast({
        status: "error",
        title: "Invalid assignment ID.",
      });
      return;
    }

    try {
      showLoader();
      
      const result = await deleteAssignment({
        variables: { id: assignmentId.id },
      });

      if (result.data) {
        showToast({
          status: "success",
          title: "Assignment deleted successfully.",
        });
        
        // Refresh table
        getAssignmentTypeDetails();
      }
    } catch (error: any) {
      console.error("Error deleting assignment:", error);
      showToast({
        status: "error",
        title: error?.message || "Failed to delete assignment. Please try again.",
      });
    } finally {
      hideLoader();
    }
  };
  

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Assignment Type",
      flex: 1,
      sortable: true,
    },
    {
      field: "workOrderName",
      headerName: "Work Order",
      flex: 1,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          {params.row.workOrderName || "N/A"}
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
            onClick={() => handleDeleteAssignmentType(params.row)}
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
              Add Assignment Type
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
          isOpen={assignmentTypeModalOpen}
          onClose={() => {
            setAssignmentTypeModalOpen(false);
            setSelectedAssignmentType(null);
          }}
          title={modalMode === "add" ? "Add Assignment type" : "Edit Assignment type"}
        >
          {assignmentTypeModalOpen && (
            <AssignmentTypeModal
              key={`${modalMode}-${selectedAssignmentType?.id || 'new'}`}
              mode={modalMode}
              data={selectedAssignmentType}
              getData={getAssignmentTypeDetails}
              onClose={() => {
                setAssignmentTypeModalOpen(false);
                setSelectedAssignmentType(null);
              }}
            />
          )}
        </RightSideModal>
      </Box>
    </ThemeProvider>
  );
};

export default AssignmentType;
