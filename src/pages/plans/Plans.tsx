import React, { useState, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import { ThemeProvider } from "@mui/material/styles";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridPaginationModel,
} from "@mui/x-data-grid";
import { Search, X, Trash2, Pencil, Plus, Users, Package, HardDrive, MapPin } from "lucide-react";
import { useLazyQuery, useMutation } from "@apollo/client/react";
import RightSideModal from "../../components/RightSideModal";
import PlanForm from "./PlanForm";
import { showToast } from "../../components/toastService";
import { useLoader } from "../../context/LoaderContext";
import muiTheme from "../../themes/muiTheme";
import { PLANS_QUERY } from "../../graphql/queries";
import { DELETE_PLAN_MUTATION } from "../../graphql/mutations";

const Plans = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planData, setPlanData] = useState<any[]>([]);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const { showLoader, hideLoader } = useLoader();
  const [fetchPlans, { loading: queryLoading, refetch }] = useLazyQuery(PLANS_QUERY);
  const [hasFetched, setHasFetched] = useState(false);
  const [deletePlan] = useMutation(DELETE_PLAN_MUTATION, {
    refetchQueries: [{ query: PLANS_QUERY }],
  });

  const filteredData = useMemo(
    () =>
      planData.filter((item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.currency?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.interval?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [planData, searchTerm]
  );

  // Fetch plans data from GraphQL API
  const getPlanDetails = async () => {
    try {
      showLoader();
      
      // Use refetch if query has been executed before, otherwise use fetchPlans
      let queryData, error;
      if (hasFetched && refetch) {
        const result = await refetch();
        queryData = result.data;
        error = result.error;
      } else {
        const result = await fetchPlans();
        queryData = result.data;
        error = result.error;
        setHasFetched(true);
      }
      
      if (error) {
        console.error("GraphQL error:", error);
        setPlanData([]);
        return;
      }

      const resultData = (queryData as any)?.plans || [];
      
      const normalizedData = Array.isArray(resultData)
        ? resultData.map((item: any) => ({
            ...item,
            id: item.id,
          }))
        : [];
      
      setPlanData(normalizedData);
    } catch (err) {
      console.error("Error fetching plans:", err);
      setPlanData([]);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    getPlanDetails();
  }, []);

  const openAddModal = () => {
    setModalMode("add");
    setSelectedPlan(null);
    setPlanModalOpen(true);
  };

  const openEditModal = (plan: any) => {
    setModalMode("edit");
    setSelectedPlan(plan);
    setPlanModalOpen(true);
  };

  const handleDeletePlan = async (planId: any) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) {
      return;
    }

    try {
      showLoader();
      
      const result = await deletePlan({
        variables: { input: { id: planId.id } },
      });

      const deleteResult = (result.data as any)?.deletePlan;
      if (deleteResult) {
        if (deleteResult.success) {
          showToast({
            status: "success",
            title: deleteResult.message || "Plan deleted successfully.",
          });
          
          // Refresh table
          getPlanDetails();
        } else {
          showToast({
            status: "error",
            title: deleteResult.message || "Failed to delete plan.",
          });
        }
      }
    } catch (error: any) {
      console.error("Error deleting plan:", error);
      showToast({
        status: "error",
        title: error?.message || "Failed to delete plan.",
      });
    } finally {
      hideLoader();
    }
  };

  const parseLimits = (limits: any) => {
    if (!limits) return null;
    try {
      const parsed = typeof limits === 'string' ? JSON.parse(limits) : limits;
      // Check if object is empty
      if (Object.keys(parsed).length === 0) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const LimitBadge = ({ 
    icon: Icon, 
    value, 
    label, 
    colorClass 
  }: { 
    icon: React.ElementType; 
    value: number; 
    label: string; 
    colorClass: string;
  }) => {
    const displayValue = value === -1 ? "∞" : value;
    const tooltipText = `${label}: ${value === -1 ? "Unlimited" : value}`;
    
    return (
      <Tooltip title={tooltipText} arrow>
        <span className={colorClass} style={{ 
          display: "inline-flex", 
          alignItems: "center", 
          padding: "2px 6px",
          marginRight: "6px",
          cursor: "pointer"
        }}>
          <Icon size={10} />
          <span className="d-inline-block ps-1" style={{fontSize: "12px" }}>{displayValue}</span>
        </span>
      </Tooltip>
    );
  };

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 160,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Box>{params.row.name || "N/A"}</Box>
        </Box>
      ),
    },
    {
        field: "description",
        headerName: "Description",
        flex: 1,
        minWidth: 160,
        sortable: true,
        renderCell: (params: GridRenderCellParams) => (
          <Box>
              <Box>{params.row.description || "N/A"} </Box>
          </Box>
        ),
      },
    {
      field: "price",
      headerName: "Price",
      flex: 0.8,
      minWidth: 120,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          {params.row.currency?.toUpperCase() || "USD"} {params.row.amount || 0}
        </Box>
      ),
    },
    {
      field: "interval",
      headerName: "Interval",
      flex: 0.6,
      minWidth: 100,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ textTransform: "capitalize" }}>
          {params.row.interval || "N/A"}
        </Box>
      ),
    },
    {
      field: "active",
      headerName: "Status",
      flex: 0.6,
      minWidth: 100,
      sortable: true,
      renderCell: (params: GridRenderCellParams) => (
        <>
        <span className={`${params.row.active ? "green-badge" : "red-badge"}`}>{params.row.active ? "Active" : "Inactive"}</span>
        </>
      ),
    },
    {
      field: "limits",
      headerName: "Limits",
      flex: 1.5,
      minWidth: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const limits = parseLimits(params.row.limits);
        
        if (!limits || Object.keys(limits).length === 0) {
          return <Box sx={{ fontSize: "0.75rem", color: "text.secondary" }}>N/A</Box>;
        }

        return (
          <Box sx={{ 
            display: "flex", 
            flexWrap: "wrap", 
            gap: 0.5,
            fontSize: "0.75rem",
            alignItems: "center"
          }}>
            {limits.users !== undefined && (
              <LimitBadge 
                icon={Users} 
                value={limits.users} 
                label="Users" 
                colorClass="green-badge"
              />
            )}
            {limits.assets !== undefined && (
              <LimitBadge 
                icon={Package} 
                value={limits.assets} 
                label="Assets" 
                colorClass="orange-badge"
              />
            )}
            {limits.storage !== undefined && (
              <LimitBadge 
                icon={HardDrive} 
                value={limits.storage} 
                label="Storage (GB)" 
                colorClass="blue-badge"
              />
            )}
            {limits.locations !== undefined && (
              <LimitBadge 
                icon={MapPin} 
                value={limits.locations} 
                label="Locations" 
                colorClass="purple-badge"
              />
            )}
          </Box>
        );
      },
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
            onClick={() => handleDeletePlan(params.row)}
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
              placeholder="Search by Name, Description, Currency, or Interval"
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
              Add Plan
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
          isOpen={planModalOpen}
          onClose={() => {
            setPlanModalOpen(false);
            setSelectedPlan(null);
          }}
          title={modalMode === "add" ? "Add Plan" : "Edit Plan"}
        >
          {planModalOpen && (
            <PlanForm
              key={`${modalMode}-${selectedPlan?.id || 'new'}`}
              mode={modalMode}
              data={selectedPlan}
              getData={getPlanDetails}
              onClose={() => {
                setPlanModalOpen(false);
                setSelectedPlan(null);
              }}
            />
          )}
        </RightSideModal>
      </Box>
    </ThemeProvider>
  );
};

export default Plans;
