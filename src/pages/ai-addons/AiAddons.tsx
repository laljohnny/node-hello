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
import { useMutation, useQuery } from "@apollo/client/react";
import { AI_ADDONS_QUERY } from "../../graphql/queries";
import { DELETE_AI_ADDON_MUTATION } from "../../graphql/mutations";
import RightSideModal from "../../components/RightSideModal";
import AiAddonModal from "./AiAddonModal";
import { showToast } from "../../components/toastService";
import { useLoader } from "../../context/LoaderContext";
import muiTheme from "../../themes/muiTheme";
import { Search, X, Pencil, Trash2, Plus } from "lucide-react";

export interface AiAddon {
    id: string;
    name: string;
    description?: string;
    pricingType?: string;
    amount: number;
    currency: string;
    interval: string;
    intervalCount?: number;
    creditPoolSize?: number;
    stripePriceId?: string;
    stripeProductId?: string;
    eligiblePlanIds?: string[];
    active: boolean;
    type: string;
    credits: number;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string;
}

interface AiAddonsData {
    aiAddons: AiAddon[];
}

const AiAddons = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedAddon, setSelectedAddon] = useState<AiAddon | null>(null);
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 10,
    });
    const { showLoader, hideLoader } = useLoader();

    const { data, loading, error, refetch } = useQuery<AiAddonsData>(AI_ADDONS_QUERY, {
        fetchPolicy: "network-only",
    });

    const [deleteAiAddon] = useMutation(DELETE_AI_ADDON_MUTATION);

    useEffect(() => {
        if (loading) showLoader();
        else hideLoader();
    }, [loading, showLoader, hideLoader]);

    useEffect(() => {
        if (error) {
            showToast({ status: "error", title: "Failed to fetch AI Addons" });
            console.error(error);
        }
    }, [error]);

    const filteredData = useMemo(() => {
        if (!data?.aiAddons) return [];
        return data.aiAddons.filter((item) => {
            const term = searchTerm.toLowerCase();
            const name = item.name?.toLowerCase() || "";
            const description = item.description?.toLowerCase() || "";
            return name.includes(term) || description.includes(term);
        });
    }, [data, searchTerm]);

    const openAddModal = () => {
        setSelectedAddon(null);
        setModalOpen(true);
    };

    const openEditModal = (addon: any) => {
        setSelectedAddon(addon);
        setModalOpen(true);
    };

    const handleSave = async () => {
        await refetch();
        setModalOpen(false);
        setSelectedAddon(null);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this addon?")) return;

        showLoader();
        try {
            const result = await deleteAiAddon({ variables: { input: { id } } });
            const response = (result.data as any)?.deleteAIAddon;
            if (response?.success) {
                showToast({ status: "success", title: response.message || "AI Addon deleted successfully" });
                await refetch();
            } else {
                showToast({ status: "error", title: response?.message || "Failed to delete AI Addon" });
            }
        } catch (error: any) {
            console.error("Delete failed:", error);
            const errorMessage =
                error?.graphQLErrors?.[0]?.message ||
                error?.message ||
                "Failed to delete AI Addon";
            showToast({ status: "error", title: errorMessage });
        } finally {
            hideLoader();
        }
    };

    const columns: GridColDef[] = [
        { field: "name", headerName: "Name", flex: 1, minWidth: 150 },
        { field: "description", headerName: "Description", flex: 2, minWidth: 200 },
        { field: "pricingType", headerName: "Pricing Type", width: 130 },
        { field: "amount", headerName: "Amount", width: 100 },
        { field: "currency", headerName: "Currency", width: 100 },
        { field: "interval", headerName: "Interval", width: 100 },
        { field: "type", headerName: "Type", width: 100 },
        { field: "credits", headerName: "Credits", width: 100 },
        {
            field: "active",
            headerName: "Active",
            width: 100,
            renderCell: (params) => (
                <span>{params.value ? "Yes" : "No"}</span>
            ),
        },
        {
            field: "actions",
            headerName: "Actions",
            width: 120,
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

    return (
        <ThemeProvider theme={muiTheme}>
            <Box>
                <div className="card custom-card p-3">
                    <div className="d-flex justify-content-between align-items-center pb-2">
                        <TextField
                            className="search-field"
                            placeholder="Search AI Addons..."
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
                            Create AI Addon
                        </Button>
                    </div>
                    <div className="mt-1" style={{ height: "500px" }}>
                        <DataGrid
                            rows={filteredData}
                            columns={columns}
                            disableRowSelectionOnClick
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
                    onClose={() => {
                        setModalOpen(false);
                        setSelectedAddon(null);
                    }}
                    title={selectedAddon ? "Edit AI Addon" : "Create AI Addon"}
                >
                    <AiAddonModal
                        data={selectedAddon}
                        onSave={handleSave}
                        onClose={() => {
                            setModalOpen(false);
                            setSelectedAddon(null);
                        }}
                        open={modalOpen}
                    />
                </RightSideModal>
            </Box>
        </ThemeProvider>
    );
};

export default AiAddons;
