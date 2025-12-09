
import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Autocomplete from "@mui/material/Autocomplete";
import { useMutation, useQuery } from "@apollo/client/react";
import { useLoader } from "../../../context/LoaderContext";
import { showToast } from "../../../components/toastService";
import { CREATE_SERVICE_TYPE_MUTATION, UPDATE_SERVICE_TYPE_MUTATION } from "../../../graphql/mutations";
import { SERVICE_TYPE_QUERY, ASSET_CATEGORIES_QUERY } from "../../../graphql/queries";

type ServiceTypeModalProps = {
  mode: "add" | "edit";
  data?: any;
  onClose: () => void;
  getData: () => void;
};

const ServiceTypeModal: React.FC<ServiceTypeModalProps> = ({
  mode,
  data,
  onClose,
  getData
}) => {
  const [formData, setFormData] = useState({ 
    name: "",
    description: "",
    asset_category_ids: [] as string[]
  });
  const [errors, setErrors] = useState<{ 
    name?: string;
    description?: string;
    asset_category_ids?: string;
  }>({});
  const { showLoader, hideLoader } = useLoader();
  const [createServiceType, { loading: createLoading }] = useMutation(CREATE_SERVICE_TYPE_MUTATION, {
    refetchQueries: [{ query: SERVICE_TYPE_QUERY }],
  });
  const [updateServiceType, { loading: updateLoading }] = useMutation(UPDATE_SERVICE_TYPE_MUTATION, {
    refetchQueries: [{ query: SERVICE_TYPE_QUERY }],
  });

  // Fetch asset categories for the dropdown
  const { data: assetCategoriesData, loading: assetCategoriesLoading } = useQuery(ASSET_CATEGORIES_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const assetCategories = (assetCategoriesData as any)?.masterAssetCategories || [];

  useEffect(() => {
    // Clear all errors when modal opens
    setErrors({});
    
    if (mode === "edit" && data) {
      // Handle asset_category_ids - could be array or undefined
      const categoryIds = Array.isArray(data.asset_category_ids) 
        ? data.asset_category_ids 
        : data.asset_category_ids 
        ? [data.asset_category_ids] 
        : [];
      
      setFormData({
        name: data.name || "",
        description: data.description || "",
        asset_category_ids: categoryIds,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        asset_category_ids: []
      });
    }
  }, [mode, data]);

  // Reset form when modal closes
  const handleClose = () => {
    setErrors({});
    setFormData({
      name: "",
      description: "",
      asset_category_ids: []
    });
    onClose();
  };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    validateField(name, value);
  };

  const handleAssetCategoryChange = (event: any, newValue: any[]) => {
    const categoryIds = newValue.map((category: any) => category.id);
    setFormData((prev) => ({ ...prev, asset_category_ids: categoryIds }));
    setErrors((prev) => ({ ...prev, asset_category_ids: undefined }));
  };

  const validateField = (name: string, value: string | string[]) => {
    let error = "";
  
    if (name === "name") {
      if (typeof value === "string" && !value.trim()) {
        error = "Name is required.";
      } else if (typeof value === "string" && value.trim().length < 3) {
        error = "Name must be at least 3 characters.";
      }
    }
  
    setErrors((prev) => ({ ...prev, [name]: error }));
  };
  
//   const validate = () => {
//     const newErrors: { name?: string } = {};
//     if (!formData.name.trim()) {
//       newErrors.name = "Name is required.";
//     } else if (formData.name.trim().length < 3) {
//       newErrors.name = "Name must be at least 3 characters.";
//     }
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };
  const validate = () => {
    let valid = true;
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      validateField("name", formData.name);
      valid = false;
    }
    return valid;
  };
  const handleUpdate = async () => {
    if (!validate()) return;
    
    try {
      showLoader();
      
      // Prepare input data
      const input: any = {
        name: formData.name || null,
        description: formData.description || null,
        asset_category_ids: formData.asset_category_ids.length > 0 ? formData.asset_category_ids : null,
        ...(mode === "edit" && data?.id ? { id: data.id } : {}), // Add id only in edit mode
      };

      let result;
      if (mode === "edit") {
        result = await updateServiceType({
          variables: { input },
        });
      } else {
        result = await createServiceType({
          variables: { input },
        });
      }

      if (result.data) {
        // Refetch data to update the grid
        getData();
        const text = mode === "edit" 
          ? "Service type details have been updated successfully." 
          : "Service type has been added successfully.";
        showToast({ status: "success", title: text });
        // Reset form after successful submission
        setErrors({});
        setFormData({
          name: "",
          description: "",
          asset_category_ids: []
        });
        handleClose();
      }
    } catch (error: any) {
      console.error("Error saving service type:", error);
      showToast({
        status: "error",
        title: error?.message || "Something went wrong while saving the data.",
      });
    } finally {
      hideLoader();
    }
  };

  // Get selected asset categories for Autocomplete
  const selectedAssetCategories = assetCategories.filter((category: any) =>
    formData.asset_category_ids.includes(category.id)
  );

  return (
    <Box sx={{ width: "100%" }}>
      <Stack className="form-modal">
        <TextField
          name="name"
          label="Name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter name"
          error={!!errors.name}
          helperText={errors.name}
          size="small"
          fullWidth
          required
        />
        <TextField
          name="description"
          label="Description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter description"
          error={!!errors.description}
          helperText={errors.description}
          size="small"
          fullWidth
          multiline
          rows={3}
        />
        <Autocomplete
          multiple
          options={assetCategories}
          getOptionLabel={(option: any) => option.name || ""}
          value={selectedAssetCategories}
          onChange={handleAssetCategoryChange}
          loading={assetCategoriesLoading}
          size="small"
          renderInput={(params) => (
            <TextField
              {...params}
              label="Asset Category"
              placeholder="Select asset categories"
              error={!!errors.asset_category_ids}
              helperText={errors.asset_category_ids}
            />
          )}
        />
      </Stack>
      <Box className="form-modal-buttons">
        <Button
          className="add-btn"
          variant="contained"
          color="secondary"
          onClick={handleUpdate}
          fullWidth
          disabled={createLoading || updateLoading}
        >
          {mode === "edit" ? "Update Service Type" : "Add Service Type"}
        </Button>
      </Box>
    </Box>
  );
};

export default ServiceTypeModal;
