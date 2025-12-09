import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Autocomplete from "@mui/material/Autocomplete";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery } from "@apollo/client/react";
import { useLoader } from "../../../context/LoaderContext";
import { showToast } from "../../../components/toastService";
import { CREATE_ASSET_PART_MUTATION, UPDATE_ASSET_PART_MUTATION } from "../../../graphql/mutations";
import { ASSET_TYPES_QUERY, ASSET_PARTS_QUERY } from "../../../graphql/queries";

type AssetPartFormInputs = {
  name: string;
  description: string;
  assetTypeId: string;
};

const schema = yup.object({
  name: yup.string().required("Name is required").min(1, "Name must be at least 1 character"),
  description: yup.string().default(""),
  assetTypeId: yup.string().required("Asset Type is required"),
});

type AssetPartModalProps = {
  mode: "add" | "edit";
  data?: any;
  onClose: () => void;
  getData: () => void;
};

const AssetPartModal: React.FC<AssetPartModalProps> = ({
  mode,
  data,
  onClose,
  getData
}) => {
  const { showLoader, hideLoader } = useLoader();
  const [createAssetPart, { loading: createLoading }] = useMutation(CREATE_ASSET_PART_MUTATION, {
    refetchQueries: [{ query: ASSET_PARTS_QUERY }],
  });
  const [updateAssetPart, { loading: updateLoading }] = useMutation(UPDATE_ASSET_PART_MUTATION, {
    refetchQueries: [{ query: ASSET_PARTS_QUERY }],
  });

  // Fetch asset types for dropdown
  const { data: assetTypesData, loading: assetTypesLoading } = useQuery(ASSET_TYPES_QUERY, {
    variables: { asset_category_id: null },
    fetchPolicy: 'cache-and-network',
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    clearErrors,
    trigger,
  } = useForm<AssetPartFormInputs>({
    resolver: yupResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      assetTypeId: "",
    },
  });

  useEffect(() => {
    // Clear all errors and reset form when modal opens
    clearErrors();
    
    if (mode === "edit" && data) {
      reset({
        name: data.name || "",
        description: data.description || "",
        assetTypeId: data.asset_type_id || data.assetTypeId || "",
      });
    } else {
      reset({
        name: "",
        description: "",
        assetTypeId: "",
      });
    }
  }, [mode, data, reset, clearErrors]);

  // Reset form when modal closes
  const handleClose = () => {
    reset({
      name: "",
      description: "",
      assetTypeId: "",
    });
    clearErrors();
    onClose();
  };

  const onSubmit = async (formData: AssetPartFormInputs) => {
    // Trigger validation to ensure all fields are validated
    const isValid = await trigger();
    if (!isValid) {
      return;
    }

    try {
      showLoader();
      
      // Prepare input data
      const input: any = {
        name: formData.name || null,
        description: formData.description?.trim() || null,
        asset_type_id: formData.assetTypeId || null,
      };

      // Add id only in edit mode
      if (mode === "edit" && data?.id) {
        input.id = data.id;
      }

      let result;
      if (mode === "edit") {
        result = await updateAssetPart({
          variables: { input },
        });
      } else {
        result = await createAssetPart({
          variables: { input },
        });
      }

      if (result.data) {
        // Refetch data to update the grid
        getData();
        const text = mode === "edit" 
          ? "Asset part has been updated successfully." 
          : "Asset part has been created successfully.";
        showToast({ status: "success", title: text });
        // Reset form after successful submission
        reset({
          name: "",
          description: "",
          assetTypeId: "",
        });
        clearErrors();
        handleClose();
      }
    } catch (error: any) {
      console.error("Error saving asset part:", error);
      showToast({
        status: "error",
        title: error?.message || "Something went wrong while saving the data.",
      });
    } finally {
      hideLoader();
    }
  };

  // Get asset types for dropdown
  const assetTypes = (assetTypesData as any)?.masterAssetTypes || [];

  return (
    <Box width="100%">
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        sx={{ width: "100%" }}
      >
        <Stack className="form-modal">
          <Controller
            name="assetTypeId"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={assetTypes}
                getOptionLabel={(option: any) => option.name || `Asset Type ${option.id}` || ""}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={assetTypes.find((assetType: any) => assetType.id === field.value) || null}
                onChange={(_event, newValue: any | null) => {
                  field.onChange(newValue?.id || "");
                }}
                onBlur={field.onBlur}
                disabled={assetTypesLoading}
                loading={assetTypesLoading}
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Asset Type"
                    required
                    error={!!errors.assetTypeId}
                    helperText={errors.assetTypeId?.message || ""}
                  />
                )}
              />
            )}
          />
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Name"
                type="text"
                placeholder="Enter name"
                error={!!errors.name}
                helperText={errors.name?.message || ""}
                size="small"
                fullWidth
                required
              />
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Description"
                type="text"
                placeholder="Enter description"
                error={!!errors.description}
                helperText={errors.description?.message || ""}
                size="small"
                fullWidth
                multiline
                rows={3}
              />
            )}
          />

          
        </Stack>
        <Box className="form-modal-buttons">
          <Button
            className="add-btn"
            variant="contained"
            color="secondary"
            type="submit"
            fullWidth
          >
            {mode === "edit" ? "Update Asset Part" : "Create Asset Part"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AssetPartModal;

