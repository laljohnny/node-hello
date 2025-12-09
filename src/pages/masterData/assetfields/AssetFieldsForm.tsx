import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Autocomplete from "@mui/material/Autocomplete";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery } from "@apollo/client/react";
import { Search } from "lucide-react";
import { showToast } from "../../../components/toastService";
import { useLoader } from "../../../context/LoaderContext";
import { CREATE_ASSET_TYPE_FIELD_MUTATION, UPDATE_ASSET_TYPE_FIELD_MUTATION } from "../../../graphql/mutations";
import { ASSET_TYPES_QUERY, ASSET_FIELDS_QUERY } from "../../../graphql/queries";

const fieldTypeOptions = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "datetime", label: "DateTime" },
  { value: "boolean", label: "Boolean" },
  { value: "select", label: "Select" },
  { value: "multi_select", label: "Multi Select" },
  { value: "file", label: "File" },
  { value: "url", label: "URL" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
];

const schema = yup.object({
  asset_type_id: yup.string().required("Asset Type is required"),
  field_name: yup.string().required("Name is required").min(1, "Name must be at least 1 character"),
  description: yup.string().nullable().default(""),
  field_type: yup.string().required("Field Type is required"),
  allowed_values: yup.string().when("field_type", {
    is: (val: string) => val === "select" || val === "multi_select",
    then: (schema) => schema.required("Values are required when Field Type is Select or Multi Select"),
    otherwise: (schema) => schema.nullable(),
  }),
  unit: yup.string().nullable().matches(/^\d*$/, "Unit must contain only numbers").default(""),
  display_order: yup.number().nullable().transform((value, originalValue) => {
    return originalValue === "" ? null : value;
  }),
  is_required: yup.boolean().default(false),
  show_in_panel: yup.boolean().default(false),
});

type AssetFieldFormInputs = yup.InferType<typeof schema>;

type AssetFieldsFormProps = {
  mode: "add" | "edit";
  data?: any;
  onClose: () => void;
  getData: () => void;
};

const AssetFieldsForm: React.FC<AssetFieldsFormProps> = ({
  mode,
  data,
  onClose,
  getData,
}) => {
  const { showLoader, hideLoader } = useLoader();
  const [createAssetField, { loading: createLoading }] = useMutation(CREATE_ASSET_TYPE_FIELD_MUTATION, {
    refetchQueries: [{ query: ASSET_FIELDS_QUERY, variables: { asset_type_id: null } }],
  });
  const [updateAssetField, { loading: updateLoading }] = useMutation(UPDATE_ASSET_TYPE_FIELD_MUTATION, {
    refetchQueries: [{ query: ASSET_FIELDS_QUERY, variables: { asset_type_id: null } }],
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
    watch,
    clearErrors,
    setValue,
  } = useForm<AssetFieldFormInputs>({
    resolver: yupResolver(schema) as any,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      asset_type_id: "",
      field_name: "",
      description: "",
      field_type: "text",
      allowed_values: "",
      unit: "",
      display_order: null,
      is_required: false,
      show_in_panel: false,
    },
  });

  const fieldType = watch("field_type");
  const showAllowedValues = fieldType === "select" || fieldType === "multi_select";

  // Clear allowed_values when field_type changes and it's not select/multi_select
  useEffect(() => {
    if (fieldType && fieldType !== "select" && fieldType !== "multi_select") {
      setValue("allowed_values", "");
      clearErrors("allowed_values");
    }
  }, [fieldType, setValue, clearErrors]);

  useEffect(() => {
    clearErrors();
    
    if (mode === "edit" && data) {
      reset({
        asset_type_id: data.asset_type_id || "",
        field_name: data.field_name || "",
        description: data.description || "",
        field_type: data.field_type || "text",
        allowed_values: Array.isArray(data.allowed_values) 
          ? data.allowed_values.join(', ') 
          : (data.allowed_values || ""),
        unit: data.unit || "",
        display_order: data.display_order || null,
        is_required: data.is_required || false,
        show_in_panel: data.show_in_panel || false,
      });
    } else {
      reset({
        asset_type_id: "",
        field_name: "",
        description: "",
        field_type: "text",
        allowed_values: "",
        unit: "",
        display_order: null,
        is_required: false,
        show_in_panel: false,
      });
    }
  }, [mode, data, reset, clearErrors]);

  const handleClose = () => {
    reset({
      asset_type_id: "",
      field_name: "",
      description: "",
      field_type: "text",
      allowed_values: "",
      unit: "",
      display_order: null,
      is_required: false,
      show_in_panel: false,
    });
    clearErrors();
    onClose();
  };

  const onSubmit = async (formData: AssetFieldFormInputs) => {
    try {
      showLoader();
      
      // Prepare input data (description is not part of the input type)
      const input: any = {
        asset_type_id: formData.asset_type_id || null,
        field_name: formData.field_name || null,
        field_type: formData.field_type || null,
        allowed_values: formData.allowed_values?.trim() 
          ? formData.allowed_values.split(',').map((val: string) => val.trim()).filter((val: string) => val.length > 0)
          : null,
        unit: formData.unit?.trim() || null,
        display_order: formData.display_order || null,
        is_required: formData.is_required || false,
        show_in_panel: formData.show_in_panel || false,
      };

      // Add id only in edit mode
      if (mode === "edit" && data?.id) {
        input.id = data.id;
      }

      let result;
      if (mode === "edit") {
        result = await updateAssetField({
          variables: { input },
        });
      } else {
        result = await createAssetField({
          variables: { input },
        });
      }

      if (result.data) {
        getData();
        showToast({
          status: "success",
          title:
            mode === "edit"
              ? "Asset field updated successfully."
              : "Asset field created successfully.",
        });
        // Reset form and close modal
        reset({
          asset_type_id: "",
          field_name: "",
          description: "",
          field_type: "text",
          allowed_values: "",
          unit: "",
          display_order: null,
          is_required: false,
          show_in_panel: false,
        });
        clearErrors();
        onClose();
      }
    } catch (error: any) {
      console.error("Error saving asset field:", error);
      showToast({
        status: "error",
        title: error?.message || "Something went wrong while saving the asset field.",
      });
    } finally {
      hideLoader();
    }
  };

  const assetTypes = (assetTypesData as any)?.masterAssetTypes || [];

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        sx={{ width: "100%" }}
      >
        <Stack className="form-modal">
          <Controller
            name="asset_type_id"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={assetTypes}
                getOptionLabel={(option: any) => option.name || `Asset Type ${option.id}` || ""}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={assetTypes.find((type: any) => type.id === field.value) || null}
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
                    error={!!errors.asset_type_id}
                    helperText={errors.asset_type_id?.message || ""}
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
            )}
          />

          <Controller
            name="field_name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Name"
                type="text"
                placeholder="Enter name"
                error={!!errors.field_name}
                helperText={errors.field_name?.message || ""}
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

          <Controller
            name="field_type"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Field Type"
                error={!!errors.field_type}
                helperText={errors.field_type?.message || ""}
                size="small"
                fullWidth
                required
                onChange={(e) => {
                  field.onChange(e);
                  // Clear allowed_values when changing to non-select/multi_select types
                  if (e.target.value !== "select" && e.target.value !== "multi_select") {
                    setValue("allowed_values", "");
                    clearErrors("allowed_values");
                  }
                }}
              >
                {fieldTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          {showAllowedValues && (
            <Controller
              name="allowed_values"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Values"
                  type="text"
                  placeholder="Enter comma-separated values"
                  error={!!errors.allowed_values}
                  helperText={errors.allowed_values?.message || "Enter comma-separated values (e.g., Option1, Option2, Option3)"}
                  size="small"
                  fullWidth
                  required
                />
              )}
            />
          )}

          <Controller
            name="unit"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Unit"
                type="number"
                placeholder="Enter unit (numbers only)"
                error={!!errors.unit}
                helperText={errors.unit?.message || ""}
                size="small"
                fullWidth
                inputProps={{
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                  min: 0,
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow numbers
                  if (value === "" || /^\d+$/.test(value)) {
                    field.onChange(value);
                  }
                }}
              />
            )}
          />

          <Controller
            name="display_order"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Display Order"
                type="number"
                placeholder="Enter display order"
                error={!!errors.display_order}
                helperText={errors.display_order?.message || ""}
                size="small"
                fullWidth
                value={field.value ?? ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? null : Number(e.target.value);
                  field.onChange(value);
                }}
                inputProps={{
                  min: 0,
                }}
              />
            )}
          />

          <Controller
            name="is_required"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    color="primary"
                  />
                }
                label="Is Required"
              />
            )}
          />

          <Controller
            name="show_in_panel"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    color="primary"
                  />
                }
                label="Show In Panel"
              />
            )}
          />
        </Stack>
        <Box className="form-modal-buttons">
          <Button
            className="add-btn"
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
          >
            {mode === "edit" ? "Update Asset Field" : "Create Asset Field"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AssetFieldsForm;

