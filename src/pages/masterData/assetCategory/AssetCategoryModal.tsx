import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { useMutation } from "@apollo/client/react";
import { showToast } from "../../../components/toastService";
import { useLoader } from "../../../context/LoaderContext";
import { AssetIconField, IconType } from "../../../components/assetIcons";
import { defaultAssetCategoryColors } from "../../../components/assetIcons/ColorPicker";
import { CREATE_ASSET_CATEGORY_MUTATION, UPDATE_ASSET_CATEGORY_MUTATION } from "../../../graphql/mutations";
import { ASSET_CATEGORIES_QUERY } from "../../../graphql/queries";

type AssetCategoryModalProps = {
  mode: "add" | "edit";
  data?: any;
  onClose: () => void;
  getData: () => void;
};

const AssetCategoryModal: React.FC<AssetCategoryModalProps> = ({
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
    is_default: false,
  });

  const [errors, setErrors] = useState({
    name: "",
    icon: "",
  });
  const [touched, setTouched] = useState({
    icon: false,
  });

  const { showLoader, hideLoader } = useLoader();
  const [createAssetCategory, { loading: createLoading }] = useMutation(CREATE_ASSET_CATEGORY_MUTATION, {
    refetchQueries: [{ query: ASSET_CATEGORIES_QUERY }],
  });
  const [updateAssetCategory, { loading: updateLoading }] = useMutation(UPDATE_ASSET_CATEGORY_MUTATION, {
    refetchQueries: [{ query: ASSET_CATEGORIES_QUERY }],
  });

  useEffect(() => {
    if (mode === "edit" && data) {
      setFormData({
        name: data.name || "",
        description: data.description || "",
        icon: data.icon_name || data.icon || data.iconName || "",
        iconcolor: data.icon_color || data.iconcolor || data.iconColor || defaultAssetCategoryColors[0],
        icontype: (data.icon_type || data.icontype || data.iconType || "Square") as IconType,
        is_default: data.is_default || false,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        icon: "",
        iconcolor: defaultAssetCategoryColors[0],
        icontype: "Square" as IconType,
        is_default: false,
      });
    }
    setErrors({ name: "", icon: "" });
    setTouched({ icon: false });
  }, [mode, data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "name" && value.trim() !== "") {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    let newErrors = { name: "", icon: "" };

    if (!formData.name.trim()) {
      newErrors.name = "Name is required.";
      isValid = false;
    }

    // Icon validation: iconName is mandatory
    const hasIconName = !!formData.icon?.trim();
    const hasIconColor = !!formData.iconcolor?.trim();
    const hasIconType = !!formData.icontype;

    if (!hasIconName) {
      newErrors.icon = "Icon is required.";
      isValid = false;
    } else if (hasIconName && (!hasIconColor || !hasIconType)) {
      newErrors.icon = "Icon Color and Icon Type are required when Icon is provided.";
      isValid = false;
    }

    setErrors(newErrors);
    setTouched({ icon: true });
    return isValid;
  };

  // const handleUpdate = async () => {
  //   if (!validateForm()) return;

  //   const payload = {
  //     operations: [
  //       {
  //         actions: {
  //           ca_asset_category: mode === "edit" ? "update" : "create",
  //         },
  //         data: {
  //           ca_asset_category: {
  //             name: formData.name,
  //             description: formData.description,
  //             // icon: formData.icon,
  //             // iconcolor: formData.iconcolor,
  //             // ...(mode === "edit" && data?.id ? { id: data.id } : {}),
  //           },
  //         },
  //       },
  //     ],
  //   };

  //   try {
  //     await api({
  //       url: "/data/rest",
  //       method: mode === "edit" ? "put" : "post",
  //       data: payload,
  //     });

  //     getData();

  //     toast({
  //       title: mode === "edit" ? "Details updated." : "Asset Category added.",
  //       description:
  //         mode === "edit"
  //           ? "Asset category information has been saved."
  //           : "New asset category has been created.",
  //       status: "success",
  //       duration: 3000,
  //       isClosable: true,
  //     });

  //     onClose();
  //   } catch (error) {
  //     toast({
  //       title: "Error",
  //       description: "Something went wrong while saving the data.",
  //       status: "error",
  //       duration: 3000,
  //       isClosable: true,
  //     });
  //   }
  // };


  const handleUpdate = async () => {
    if (!validateForm()) return;
  
    try {
      showLoader();
      
      // Prepare input data with proper field mapping
      const input: any = {
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
        result = await updateAssetCategory({
          variables: { input },
        });
      } else {
        result = await createAssetCategory({
          variables: { input },
        });
      }

      if (result.data) {
        getData();
        showToast({
          status: "success",
          title:
            mode === "edit"
              ? "Asset category updated successfully."
              : "Asset category created successfully.",
        });
        onClose();
      }
    } catch (error: any) {
      console.error("Error saving asset category:", error);
      showToast({
        status: "error",
        title: error?.message || "Something went wrong while saving the data.",
      });
    } finally {
      hideLoader();
    }
  };
  

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
          onClick={handleUpdate}
          fullWidth
        >
          {mode === "edit" ? "Update Details" : "Add Asset Category"}
        </Button>
      </Box>
    </Box>
  );
};

export default AssetCategoryModal;
