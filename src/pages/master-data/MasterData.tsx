import React, { useState } from "react";
import {
    Box,
    Button,
    Card,
    Typography,
    IconButton,
    Tooltip,
    Tabs,
    Tab,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useQuery, useMutation } from "@apollo/client/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { showToast } from "../../components/toastService";
import { useLoader } from "../../context/LoaderContext";
import MasterDataModal from "./MasterDataModal";
import * as Queries from "../../graphql/queries";
import * as Mutations from "../../graphql/mutations";

// Type definition for query data
interface MasterDataQueryResult {
    [key: string]: any[];
}

const ENTITY_TYPES = [
    { value: "masterAssetCategories", label: "Asset Categories" },
    { value: "masterAssetPartFields", label: "Asset Part Fields" },
    { value: "masterAssetParts", label: "Asset Parts" },
    { value: "masterAssetServiceTypes", label: "Asset Service Types" },
    { value: "masterAssetTypeFields", label: "Asset Type Fields" },
    { value: "masterAssetTypes", label: "Asset Types" },
    { value: "masterManufacturers", label: "Manufacturers" },
    { value: "masterVendors", label: "Vendors" },
];

const QUERY_MAP: any = {
    masterAssetCategories: Queries.MASTER_ASSET_CATEGORIES_QUERY,
    masterAssetPartFields: Queries.MASTER_ASSET_PART_FIELDS_QUERY,
    masterAssetParts: Queries.MASTER_ASSET_PARTS_QUERY,
    masterAssetServiceTypes: Queries.MASTER_ASSET_SERVICE_TYPES_QUERY,
    masterAssetTypeFields: Queries.MASTER_ASSET_TYPE_FIELDS_QUERY,
    masterAssetTypes: Queries.MASTER_ASSET_TYPES_QUERY,
    masterManufacturers: Queries.MASTER_MANUFACTURERS_QUERY,
    masterVendors: Queries.MASTER_VENDORS_QUERY,
};

const DELETE_MUTATION_MAP: any = {
    masterAssetCategories: Mutations.DELETE_MASTER_ASSET_CATEGORY_MUTATION,
    // masterAssetPartFields: Mutations.DELETE_MASTER_ASSET_PART_FIELD_MUTATION,
    masterAssetParts: Mutations.DELETE_MASTER_ASSET_PART_MUTATION,
    masterAssetServiceTypes: Mutations.DELETE_MASTER_ASSET_SERVICE_TYPE_MUTATION,
    // masterAssetTypeFields: Mutations.DELETE_MASTER_ASSET_TYPE_FIELD_MUTATION,
    masterAssetTypes: Mutations.DELETE_MASTER_ASSET_TYPE_MUTATION,
    masterManufacturers: Mutations.DELETE_MASTER_MANUFACTURER_MUTATION,
    masterVendors: Mutations.DELETE_MASTER_VENDOR_MUTATION,
};

const MasterData = () => {
    const [selectedEntity, setSelectedEntity] = useState(ENTITY_TYPES[0].value);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const { showLoader, hideLoader } = useLoader();

    const { data, loading, refetch } = useQuery<MasterDataQueryResult>(QUERY_MAP[selectedEntity], {
        fetchPolicy: "network-only",
    });

    const [deleteMutation] = useMutation(DELETE_MUTATION_MAP[selectedEntity]);

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            showLoader();
            try {
                await deleteMutation({
                    variables: { input: { id } },
                });
                showToast({ status: "success", title: "Deleted successfully" });
                refetch();
            } catch (error: any) {
                console.error("Error deleting:", error);
                showToast({ status: "error", title: "Failed to delete" });
            } finally {
                hideLoader();
            }
        }
    };

    const handleEdit = (item: any) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedItem(null);
        setIsModalOpen(true);
    };

    const getColumns = (): GridColDef[] => {
        const baseColumns: GridColDef[] = [
            { field: "id", headerName: "ID", width: 90 },
            { field: "name", headerName: "Name", flex: 1 },
            { field: "description", headerName: "Description", flex: 1 },
        ];

        // Add specific columns based on entity type if needed
        if (selectedEntity === "masterAssetCategories") {
            baseColumns.push(
                { field: "icon_name", headerName: "Icon", width: 120 },
                { field: "is_default", headerName: "Default", width: 100, type: "boolean" }
            );
        } else if (selectedEntity === "masterAssetPartFields" || selectedEntity === "masterAssetTypeFields") {
            baseColumns.push(
                { field: "field_name", headerName: "Field Name", flex: 1 },
                { field: "field_type", headerName: "Type", width: 120 },
                { field: "is_required", headerName: "Required", width: 100, type: "boolean" }
            );
        } else if (selectedEntity === "masterManufacturers") {
            baseColumns.push(
                { field: "company_name", headerName: "Company", flex: 1 },
                { field: "contact_person", headerName: "Contact", flex: 1 }
            );
        } else if (selectedEntity === "masterVendors") {
            baseColumns.push(
                { field: "company_name", headerName: "Company", flex: 1 },
                { field: "vendor_type", headerName: "Type", width: 150 }
            );
        }

        baseColumns.push({
            field: "actions",
            headerName: "Actions",
            width: 120,
            renderCell: (params) => (
                <Box>
                    <Tooltip title="Edit">
                        <IconButton onClick={() => handleEdit(params.row)} size="small">
                            <Edit size={18} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton onClick={() => handleDelete(params.row.id)} size="small" color="error">
                            <Trash2 size={18} />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        });

        return baseColumns;
    };

    const rows = data ? data[selectedEntity] || [] : [];

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3, alignItems: "center" }}>
                <Typography variant="h5" fontWeight="bold">
                    Master Data Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={handleCreate}
                >
                    Add New
                </Button>
            </Box>

            <Card sx={{ mb: 3 }}>
                <Tabs
                    value={selectedEntity}
                    onChange={(e, newValue) => setSelectedEntity(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            minWidth: 120,
                            fontWeight: 500,
                        },
                    }}
                >
                    {ENTITY_TYPES.map((type) => (
                        <Tab
                            key={type.value}
                            label={type.label}
                            value={type.value}
                        />
                    ))}
                </Tabs>
            </Card>

            <Card sx={{ height: 600, width: "100%" }}>
                <DataGrid
                    rows={rows}
                    columns={getColumns()}
                    loading={loading}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    disableRowSelectionOnClick
                />
            </Card>

            {isModalOpen && (
                <MasterDataModal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    entityType={selectedEntity}
                    data={selectedItem}
                    onSave={refetch}
                />
            )}
        </Box>
    );
};

export default MasterData;
