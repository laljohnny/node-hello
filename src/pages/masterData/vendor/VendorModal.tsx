import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Stack from "@mui/material/Stack";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation } from "@apollo/client/react";
import { showToast } from "../../../components/toastService";
import { useLoader } from "../../../context/LoaderContext";
import { CREATE_VENDOR_MUTATION, UPDATE_VENDOR_MUTATION } from "../../../graphql/mutations";
import { VENDORS_QUERY } from "../../../graphql/queries";

type VendorDetailsModalProps = {
  mode: "add" | "edit";
  data?: any;
  onClose: () => void;
  getData: () => void;
};

const schema = yup.object({
  name: yup.string().required("Name is required"),
  company_name: yup.string().required("Company name is required"),
  email: yup.string().email("Invalid email format").optional().nullable().transform((value, originalValue) => {
    return originalValue === "" ? null : value;
  }),
  website: yup.string().url("Invalid website URL").optional().nullable().transform((value, originalValue) => {
    return originalValue === "" ? null : value;
  }),
  phone_number: yup.string().optional().nullable().transform((value, originalValue) => {
    return originalValue === "" ? null : value;
  }),
  country_code: yup.string().optional().nullable().transform((value, originalValue) => {
    return originalValue === "" ? null : value;
  }),
  vendor_type: yup.string().optional().nullable().transform((value, originalValue) => {
    return originalValue === "" ? null : value;
  }),
});

type VendorFormInputs = yup.InferType<typeof schema>;

const VendorModal: React.FC<VendorDetailsModalProps> = ({
  mode,
  data,
  onClose,
  getData,
}) => {
  const { showLoader, hideLoader } = useLoader();
  const [createVendor, { loading: createLoading }] = useMutation(CREATE_VENDOR_MUTATION, {
    refetchQueries: [{ query: VENDORS_QUERY }],
  });
  const [updateVendor, { loading: updateLoading }] = useMutation(UPDATE_VENDOR_MUTATION, {
    refetchQueries: [{ query: VENDORS_QUERY }],
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    clearErrors,
  } = useForm<VendorFormInputs>({
    resolver: yupResolver(schema) as any,
    mode: "onSubmit",
    defaultValues: {
      name: "",
      email: "",
      company_name: "",
      website: "",
      phone_number: "",
      country_code: "",
      vendor_type: "",
    },
  });

  useEffect(() => {
    // Always clear errors first when modal opens
    clearErrors();
    
    if (mode === "edit" && data) {
      reset({
        name: data.name || "",
        email: data.email || "",
        company_name: data.company_name || "",
        website: data.website || "",
        phone_number: data.phone_number || "",
        country_code: data.country_code || "",
        vendor_type: data.vendor_type || "",
      }, {
        keepErrors: false,
        keepDirty: false,
        keepIsSubmitted: false,
        keepTouched: false,
        keepIsValid: false,
        keepSubmitCount: false,
      });
    } else {
      // Always reset to empty for add mode
      reset({
        name: "",
        email: "",
        company_name: "",
        website: "",
        phone_number: "",
        country_code: "",
        vendor_type: "",
      }, {
        keepErrors: false,
        keepDirty: false,
        keepIsSubmitted: false,
        keepTouched: false,
        keepIsValid: false,
        keepSubmitCount: false,
      });
    }
  }, [mode, data, reset, clearErrors]);

  // Reset form when modal closes
  const handleClose = () => {
    clearErrors();
    reset({
      name: "",
      email: "",
      company_name: "",
      website: "",
      phone_number: "",
      country_code: "",
      vendor_type: "",
    }, {
      keepErrors: false,
      keepDirty: false,
      keepIsSubmitted: false,
      keepTouched: false,
      keepIsValid: false,
      keepSubmitCount: false,
    });
    onClose();
  };

  const handleUpdate = async (formData: VendorFormInputs) => {
    try {
      showLoader();
      
      // Prepare input data with proper field mapping
      const input: any = {
        name: formData.name || null,
        email: formData.email || null,
        company_name: formData.company_name || null,
        website: formData.website || null,
        phone_number: formData.phone_number || null,
        country_code: formData.country_code || null,
        vendor_type: formData.vendor_type || null,
      };

      // Add id only in edit mode
      if (mode === "edit" && data?.id) {
        input.id = data.id;
      }

      let result;
      if (mode === "edit") {
        result = await updateVendor({
          variables: { input },
        });
      } else {
        result = await createVendor({
          variables: { input },
        });
      }

      if (result.data) {
        // Refetch data to update the grid
        getData();
        showToast({
          status: "success",
          title:
            mode === "edit"
              ? "Vendor information has been updated."
              : "Vendor has been created successfully.",
        });
        // Reset form after successful submission
        reset({
          name: "",
          email: "",
          company_name: "",
          website: "",
          phone_number: "",
          country_code: "",
          vendor_type: "",
        });
        handleClose();
      }
    } catch (error: any) {
      console.error("Error saving vendor:", error);
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
      <Stack
        component="form"
        onSubmit={handleSubmit(handleUpdate)}
        className="form-modal"
        spacing={2}
      >
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Name"
              placeholder="Enter name"
              error={!!errors.name}
              helperText={errors.name?.message}
              size="small"
              fullWidth
              required
            />
          )}
        />

        <Controller
          name="company_name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Company Name"
              placeholder="Enter company name"
              error={!!errors.company_name}
              helperText={errors.company_name?.message}
              size="small"
              fullWidth
              required
            />
          )}
        />

        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Email"
              type="email"
              placeholder="Enter email"
              error={!!errors.email}
              helperText={errors.email?.message}
              size="small"
              fullWidth
            />
          )}
        />

        <Controller
          name="website"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Website"
              placeholder="Enter website URL"
              error={!!errors.website}
              helperText={errors.website?.message}
              size="small"
              fullWidth
            />
          )}
        />

        <Controller
          name="phone_number"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Phone Number"
              placeholder="Enter phone number"
              error={!!errors.phone_number}
              helperText={errors.phone_number?.message}
              size="small"
              fullWidth
            />
          )}
        />

        <Controller
          name="country_code"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Country Code"
              placeholder="Enter country code"
              error={!!errors.country_code}
              helperText={errors.country_code?.message}
              size="small"
              fullWidth
            />
          )}
        />

        <Controller
          name="vendor_type"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth size="small" error={!!errors.vendor_type}>
              <InputLabel>Vendor Type</InputLabel>
              <Select
                {...field}
                label="Vendor Type"
                value={field.value || ""}
              >
                <MenuItem value="maintenance_provider">Maintenance Provider</MenuItem>
                <MenuItem value="procurement_partner">Procurement Partner</MenuItem>
                <MenuItem value="both">Both</MenuItem>
              </Select>
              {errors.vendor_type && (
                <FormHelperText>{errors.vendor_type.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Stack>
      <Box className="form-modal-buttons">
        <Button
          className="add-btn"
          variant="contained"
          color="secondary"
          type="submit"
          onClick={handleSubmit(handleUpdate)}
          disabled={isSubmitting}
          fullWidth
        >
          {mode === "edit" ? "Update Vendor" : "Add Vendor"}
        </Button>
      </Box>
    </Box>
  );
};

export default VendorModal;
