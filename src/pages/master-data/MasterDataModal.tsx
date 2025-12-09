import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    TextField,
    Grid,
    MenuItem,
    FormControlLabel,
    Checkbox,
} from "@mui/material";
import { useMutation } from "@apollo/client/react";
import { useLoader } from "../../context/LoaderContext";
import { showToast } from "../../components/toastService";
import RightSideModal from "../../components/RightSideModal";
import * as Mutations from "../../graphql/mutations";

interface MasterDataModalProps {
    open: boolean;
    onClose: () => void;
    entityType: string;
    data?: any;
    onSave: () => void;
}

// Helper function to convert camelCase to snake_case
const camelToSnake = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(camelToSnake);

    const snakeObj: any = {};
    Object.keys(obj).forEach(key => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        snakeObj[snakeKey] = camelToSnake(obj[key]);
    });
    return snakeObj;
};

const ENTITY_CONFIG: any = {
    masterAssetCategories: {
        createMutation: Mutations.CREATE_MASTER_ASSET_CATEGORY_MUTATION,
        updateMutation: Mutations.UPDATE_MASTER_ASSET_CATEGORY_MUTATION,
        fields: [
            { name: "name", label: "Name", type: "text", required: true },
            { name: "description", label: "Description", type: "text", multiline: true },
            { name: "iconName", label: "Icon Name", type: "text" },
            { name: "iconColor", label: "Icon Color", type: "text" },
            { name: "iconType", label: "Icon Type", type: "text" },
            { name: "isDefault", label: "Is Default", type: "checkbox" },
        ],
    },
    masterAssetPartFields: {
        // createMutation: Mutations.CREATE_MASTER_ASSET_PART_FIELD_MUTATION,
        // updateMutation: Mutations.UPDATE_MASTER_ASSET_PART_FIELD_MUTATION,
        fields: [
            { name: "assetPartId", label: "Asset Part ID", type: "text", required: true },
            { name: "parentId", label: "Parent ID", type: "text" },
            { name: "fieldName", label: "Field Name", type: "text", required: true },
            { name: "fieldType", label: "Field Type", type: "select", options: ["text", "number", "date", "boolean", "select"] },
            { name: "allowedValues", label: "Allowed Values (comma separated)", type: "text" },
            { name: "isRequired", label: "Is Required", type: "checkbox" },
            { name: "displayOrder", label: "Display Order", type: "number" },
            { name: "showInPanel", label: "Show In Panel", type: "checkbox" },
        ],
    },
    masterAssetParts: {
        createMutation: Mutations.CREATE_MASTER_ASSET_PART_MUTATION,
        updateMutation: Mutations.UPDATE_MASTER_ASSET_PART_MUTATION,
        fields: [
            { name: "name", label: "Name", type: "text", required: true },
            { name: "description", label: "Description", type: "text", multiline: true },
            { name: "assetTypeId", label: "Asset Type ID", type: "text", required: true },
        ],
    },
    masterAssetServiceTypes: {
        createMutation: Mutations.CREATE_MASTER_ASSET_SERVICE_TYPE_MUTATION,
        updateMutation: Mutations.UPDATE_MASTER_ASSET_SERVICE_TYPE_MUTATION,
        fields: [
            { name: "name", label: "Name", type: "text", required: true },
            { name: "description", label: "Description", type: "text", multiline: true },
        ],
    },
    masterAssetTypeFields: {
        // createMutation: Mutations.CREATE_MASTER_ASSET_TYPE_FIELD_MUTATION,
        // updateMutation: Mutations.UPDATE_MASTER_ASSET_TYPE_FIELD_MUTATION,
        fields: [
            { name: "assetTypeId", label: "Asset Type ID", type: "text", required: true },
            { name: "parentFieldId", label: "Parent Field ID", type: "text" },
            { name: "fieldName", label: "Field Name", type: "text", required: true },
            { name: "fieldType", label: "Field Type", type: "select", options: ["text", "number", "date", "boolean", "select"] },
            { name: "allowedValues", label: "Allowed Values (comma separated)", type: "text" },
            { name: "isRequired", label: "Is Required", type: "checkbox" },
            { name: "displayOrder", label: "Display Order", type: "number" },
            { name: "showInPanel", label: "Show In Panel", type: "checkbox" },
        ],
    },
    masterAssetTypes: {
        createMutation: Mutations.CREATE_MASTER_ASSET_TYPE_MUTATION,
        updateMutation: Mutations.UPDATE_MASTER_ASSET_TYPE_MUTATION,
        fields: [
            { name: "name", label: "Name", type: "text", required: true },
            { name: "description", label: "Description", type: "text", multiline: true },
            { name: "assetCategoryId", label: "Asset Category ID", type: "text", required: true },
            { name: "isDefault", label: "Is Default", type: "checkbox" },
            { name: "iconName", label: "Icon Name", type: "text" },
            { name: "iconColor", label: "Icon Color", type: "text" },
            { name: "iconType", label: "Icon Type", type: "text" },
        ],
    },
    masterManufacturers: {
        createMutation: Mutations.CREATE_MASTER_MANUFACTURER_MUTATION,
        updateMutation: Mutations.UPDATE_MASTER_MANUFACTURER_MUTATION,
        fields: [
            { name: "name", label: "Name", type: "text", required: true },
            { name: "description", label: "Description", type: "text", multiline: true },
            { name: "companyName", label: "Company Name", type: "text" },
            { name: "phoneNumber", label: "Phone Number", type: "text" },
            { name: "countryCode", label: "Country Code", type: "text" },
            { name: "contactPerson", label: "Contact Person", type: "text" },
        ],
    },
    masterVendors: {
        createMutation: Mutations.CREATE_MASTER_VENDOR_MUTATION,
        updateMutation: Mutations.UPDATE_MASTER_VENDOR_MUTATION,
        fields: [
            { name: "name", label: "Name", type: "text", required: true },
            { name: "description", label: "Description", type: "text", multiline: true },
            { name: "companyId", label: "Company ID", type: "text" },
            { name: "companyName", label: "Company Name", type: "text" },
            { name: "phoneNumber", label: "Phone Number", type: "text" },
            { name: "countryCode", label: "Country Code", type: "text" },
            { name: "vendorType", label: "Vendor Type", type: "text" },
            { name: "canLogin", label: "Can Login", type: "checkbox" },
            { name: "invitedByUser", label: "Invited By User", type: "text" },
        ],
    },
};

const MasterDataModal: React.FC<MasterDataModalProps> = ({
    open,
    onClose,
    entityType,
    data,
    onSave,
}) => {
    const config = ENTITY_CONFIG[entityType];
    const [formData, setFormData] = useState<any>({});
    const { showLoader, hideLoader } = useLoader();

    const [createMutation] = useMutation(config?.createMutation);
    const [updateMutation] = useMutation(config?.updateMutation);

    useEffect(() => {
        if (data) {
            setFormData(data);
        } else {
            setFormData({});
        }
    }, [data, entityType]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        showLoader();

        try {
            let input = { ...formData };

            // Clean up fields based on type
            config.fields.forEach((field: any) => {
                if (field.type === 'number' && input[field.name]) {
                    input[field.name] = Number(input[field.name]);
                }
            });

            // Remove __typename and other non-input fields
            delete input.__typename;
            delete input.createdAt;
            delete input.updatedAt;
            delete input.created_at;
            delete input.updated_at;
            delete input.deletedAt;
            delete input.deleted_at;

            // Convert camelCase to snake_case for backend
            input = camelToSnake(input);

            if (data?.id) {
                await updateMutation({
                    variables: {
                        input: {
                            id: data.id,
                            ...input,
                        },
                    },
                });
                showToast({ status: "success", title: "Updated successfully" });
            } else {
                await createMutation({
                    variables: {
                        input,
                    },
                });
                showToast({ status: "success", title: "Created successfully" });
            }
            onSave();
            onClose();
        } catch (error: any) {
            console.error("Error saving:", error);
            const errorMessage =
                error?.graphQLErrors?.[0]?.message ||
                error?.message ||
                "Failed to save";
            showToast({ status: "error", title: errorMessage });
        } finally {
            hideLoader();
        }
    };

    if (!config) return null;

    return (
        <RightSideModal
            isOpen={open}
            onClose={onClose}
            title={`${data?.id ? "Edit" : "Add"} ${entityType.replace(/([A-Z])/g, " $1").trim()}`}
        >
            <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
                <Grid container spacing={2}>
                    {config.fields.map((field: any) => (
                        <Grid item xs={12} key={field.name}>
                            {field.type === "checkbox" ? (
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={!!formData[field.name]}
                                            onChange={handleChange}
                                            name={field.name}
                                        />
                                    }
                                    label={field.label}
                                />
                            ) : (
                                <TextField
                                    select={field.type === "select"}
                                    label={field.label}
                                    name={field.name}
                                    value={formData[field.name] || ""}
                                    onChange={handleChange}
                                    fullWidth
                                    required={field.required}
                                    multiline={field.multiline}
                                    rows={field.rows || (field.multiline ? 3 : 1)}
                                    size="small"
                                    type={field.type === "number" ? "number" : "text"}
                                >
                                    {field.type === "select" &&
                                        field.options.map((option: string) => (
                                            <MenuItem key={option} value={option}>
                                                {option}
                                            </MenuItem>
                                        ))}
                                </TextField>
                            )}
                        </Grid>
                    ))}
                </Grid>
                <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                    <Button onClick={onClose} variant="outlined">
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" color="primary">
                        Save
                    </Button>
                </Box>
            </Box>
        </RightSideModal>
    );
};

export default MasterDataModal;
