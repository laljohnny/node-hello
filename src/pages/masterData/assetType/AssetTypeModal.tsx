import React, { useState, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Autocomplete from "@mui/material/Autocomplete";
import InputAdornment from "@mui/material/InputAdornment";
import FormHelperText from "@mui/material/FormHelperText";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useMutation, useQuery } from "@apollo/client/react";
import { Search } from "lucide-react";
import { showToast } from "../../../components/toastService";
import { useLoader } from "../../../context/LoaderContext";
import { AssetIconField, IconType } from "../../../components/assetIcons";
import { defaultAssetCategoryColors } from "../../../components/assetIcons/ColorPicker";
import { CREATE_ASSET_TYPE_MUTATION, UPDATE_ASSET_TYPE_MUTATION } from "../../../graphql/mutations";
import { ASSET_TYPES_QUERY, ASSET_CATEGORIES_QUERY } from "../../../graphql/queries";

type AssetTypeModalProps = {
  mode: "add" | "edit";
  data?: any;
  onClose: () => void;
  getData: () => void;
};

const AssetTypeModal: React.FC<AssetTypeModalProps> = ({
  mode,
  data,
  onClose,
  getData,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    iconcolor: "",
    icontype: "Square" as IconType,
    assetCategoryId: "",
    is_default: false,
  });

  const [errors, setErrors] = useState({
    name: "",
    assetCategoryId: "",
    icon: "",
  });
  const [touched, setTouched] = useState({
    icon: false,
  });
  const { showLoader, hideLoader } = useLoader();
  const [createAssetType, { loading: createLoading }] = useMutation(CREATE_ASSET_TYPE_MUTATION, {
    refetchQueries: [{ query: ASSET_TYPES_QUERY, variables: { asset_category_id: null } }],
  });
  const [updateAssetType, { loading: updateLoading }] = useMutation(UPDATE_ASSET_TYPE_MUTATION, {
    refetchQueries: [{ query: ASSET_TYPES_QUERY, variables: { asset_category_id: null } }],
  });

  // Fetch asset categories for dropdown
  const { data: assetCategoriesData, loading: categoriesLoading, error: categoriesError } = useQuery(ASSET_CATEGORIES_QUERY, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  useEffect(() => {
    if (categoriesError) {
      console.error("Error fetching asset categories:", categoriesError);
      showToast({
        status: "error",
        title: "Failed to load asset categories.",
      });
    }
    if (assetCategoriesData) {
      console.log("Asset categories data:", assetCategoriesData);
      const categories = (assetCategoriesData as any)?.masterAssetCategories || [];
      console.log("Categories array:", categories);
    }
  }, [assetCategoriesData, categoriesError]);

  useEffect(() => {
    if (mode === "edit" && data) {
      setFormData({
        name: data.name || "",
        description: data.description || "",
        icon: data.icon_name || data.icon || data.iconName || "",
        iconcolor: data.icon_color || data.iconcolor || data.iconColor || defaultAssetCategoryColors[0],
        icontype: (data.icon_type || data.icontype || data.iconType || "Square") as IconType,
        assetCategoryId: data.asset_category_id || data.assetCategoryId || "",
        is_default: data.is_default || false,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        icon: "",
        iconcolor: defaultAssetCategoryColors[0],
        icontype: "Square" as IconType,
        assetCategoryId: "",
        is_default: false,
      });
    }
    setErrors({ name: "", assetCategoryId: "", icon: "" });
    setTouched({ icon: false });
  }, [mode, data]);

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      icon: "",
      iconcolor: defaultAssetCategoryColors[0],
      icontype: "Square" as IconType,
      assetCategoryId: "",
      is_default: false,
    });
    setErrors({ name: "", assetCategoryId: "", icon: "" });
    setTouched({ icon: false });
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "name" && value.trim() !== "") {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  };

  const handleAssetCategoryChange = (_: any, newValue: any) => {
    setFormData((prev) => ({ ...prev, assetCategoryId: newValue?.id || "" }));
    if (newValue) {
      setErrors((prev) => ({ ...prev, assetCategoryId: "" }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    let newErrors = { name: "", assetCategoryId: "", icon: "" };

    if (!formData.name.trim()) {
      newErrors.name = "Name is required.";
      isValid = false;
    }

    if (!formData.assetCategoryId) {
      newErrors.assetCategoryId = "Asset Category is required.";
      isValid = false;
    }

    // Icon validation: iconName is mandatory
    // If any icon field is filled, all must be filled
    const hasIconName = !!formData.icon?.trim();
    const hasIconColor = !!formData.iconcolor?.trim();
    const hasIconType = !!formData.icontype;

    if (!hasIconName) {
      newErrors.icon = "Icon Name is required.";
      isValid = false;
    } else if (hasIconName && (!hasIconColor || !hasIconType)) {
      newErrors.icon = "Icon Color and Icon Type are required when Icon Name is provided.";
      isValid = false;
    } else if ((hasIconColor || hasIconType) && !hasIconName) {
      newErrors.icon = "Icon Name is required when Icon Color or Icon Type is provided.";
      isValid = false;
    }

    setErrors(newErrors);
    setTouched({ icon: true });
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      showLoader();
      
      // Prepare input data with proper field mapping
      const input: any = {
        asset_category_id: formData.assetCategoryId || null,
        name: formData.name || null,
        description: formData.description || null,
        icon_name: formData.icon || null,
        icon_color: formData.iconcolor || null,
        icon_type: formData.icontype || null,
        is_default: formData.is_default || false,
      };

      // Add id only in edit mode
      if (mode === "edit" && data?.id) {
        input.id = data.id;
      }

      let result;
      if (mode === "edit") {
        result = await updateAssetType({
          variables: { input },
        });
      } else {
        result = await createAssetType({
          variables: { input },
        });
      }

      if (result.data) {
        getData();
        showToast({
          status: "success",
          title:
            mode === "edit"
              ? "Asset type updated successfully."
              : "Asset type created successfully.",
        });
        // Reset form and close modal
        setFormData({
          name: "",
          description: "",
          icon: "",
          iconcolor: defaultAssetCategoryColors[0],
          icontype: "Square" as IconType,
          assetCategoryId: "",
          is_default: false,
        });
        setErrors({ name: "", assetCategoryId: "", icon: "" });
        setTouched({ icon: false });
        onClose();
      }
    } catch (error: any) {
      console.error("Error saving asset type:", error);
      showToast({
        status: "error",
        title: error?.message || "Something went wrong while saving the asset type.",
      });
    } finally {
      hideLoader();
    }
  };

  const assetCategories = useMemo(() => {
    const categories = (assetCategoriesData as any)?.masterAssetCategories || [];
    console.log("Computed assetCategories:", categories);
    return categories;
  }, [assetCategoriesData]);

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
          size="small"
          fullWidth
        />
  <Autocomplete
          options={assetCategories}
          getOptionLabel={(option) => option.name || ""}
          value={assetCategories.find((cat: any) => cat.id === formData.assetCategoryId) || null}
          onChange={handleAssetCategoryChange}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Asset Category"
              placeholder="Search or select asset category"
              size="small"
              required
              error={!!errors.assetCategoryId}
              helperText={errors.assetCategoryId || ""}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <Search size={14} />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
          fullWidth
        />
        <AssetIconField
          iconName={formData.icon}
          iconColor={formData.iconcolor}
          iconType={formData.icontype}
          onIconNameChange={(value) => {
            setFormData((prev) => ({ ...prev, icon: value }));
            if (value && formData.iconcolor && formData.icontype) {
              setErrors((prev) => ({ ...prev, icon: "" }));
            }
            setTouched((prev) => ({ ...prev, icon: true }));
          }}
          onIconColorChange={(value) => {
            setFormData((prev) => ({ ...prev, iconcolor: value }));
            if (formData.icon && value && formData.icontype) {
              setErrors((prev) => ({ ...prev, icon: "" }));
            }
            setTouched((prev) => ({ ...prev, icon: true }));
          }}
          onIconTypeChange={(value) => {
            setFormData((prev) => ({ ...prev, icontype: value }));
            if (formData.icon && formData.iconcolor && value) {
              setErrors((prev) => ({ ...prev, icon: "" }));
            }
            setTouched((prev) => ({ ...prev, icon: true }));
          }}
          error={errors.icon}
          touched={touched.icon}
        />

        <FormControlLabel
          control={
            <Switch
              checked={formData.is_default}
              onChange={(e) => setFormData((prev) => ({ ...prev, is_default: e.target.checked }))}
              color="primary"
            />
          }
          label="Is Default"
        />
      </Stack>
      <Box className="form-modal-buttons">
        <Button
          className="add-btn"
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          fullWidth
        >
          {mode === "edit" ? "Update Details" : "Add Asset Type"}
        </Button>
      </Box>
    </Box>
  );
};

export default AssetTypeModal;
