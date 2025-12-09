import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import { useMutation } from "@apollo/client/react";
import { showToast } from "../../../components/toastService";
import { useLoader } from "../../../context/LoaderContext";
import { CREATE_MANUFACTURER_MUTATION, UPDATE_MANUFACTURER_MUTATION } from "../../../graphql/mutations";
import { MANUFACTURERS_QUERY } from "../../../graphql/queries";

type ManufacturerDetailsModalProps = {
  mode: "add" | "edit";
  data?: any;
  onClose: () => void;
  getData: () => void;
};

const ManufacturerDetailsModal: React.FC<ManufacturerDetailsModalProps> = ({
  mode,
  data,
  onClose,
  getData
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company_name: '',
    website: '',
    address: '',
    phone_number: '',
    country_code: '',
    contact_person: '',
  });

  const [errors, setErrors] = useState<{ name?: string }>({});
  const { showLoader, hideLoader } = useLoader();
  const [createManufacturer, { loading: createLoading }] = useMutation(CREATE_MANUFACTURER_MUTATION, {
    refetchQueries: [{ query: MANUFACTURERS_QUERY }],
  });
  const [updateManufacturer, { loading: updateLoading }] = useMutation(UPDATE_MANUFACTURER_MUTATION, {
    refetchQueries: [{ query: MANUFACTURERS_QUERY }],
  });

  useEffect(() => {
    if (mode === "edit" && data) {
      setFormData({
        name: data.name || "",
        email: data.email || "",
        company_name: data.company_name || "",
        website: data.website || "",
        address: data.address || "",
        phone_number: data.phone_number || "",
        country_code: data.country_code || "",
        contact_person: data.contact_person || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        company_name: "",
        website: "",
        address: "",
        phone_number: "",
        country_code: "",
        contact_person: "",
      });
    }
  }, [mode, data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // ✅ clear errors as user types
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleUpdate = async () => {
    const newErrors: { name?: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      showLoader();
      
      // Helper function to convert empty strings to null
      const toNullIfEmpty = (value: string | undefined) => {
        if (!value) return null;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      };
      
      // Prepare input data with proper field mapping
      const input: any = {
        name: formData.name.trim(),
        email: toNullIfEmpty(formData.email),
        company_name: toNullIfEmpty(formData.company_name),
        website: toNullIfEmpty(formData.website),
        address: toNullIfEmpty(formData.address),
        phone_number: toNullIfEmpty(formData.phone_number),
        country_code: toNullIfEmpty(formData.country_code),
        contact_person: toNullIfEmpty(formData.contact_person),
      };
      
      // Add id only in edit mode
      if (mode === "edit" && data?.id) {
        input.id = data.id;
      }

      console.log("Sending mutation with input:", input);
      console.log("Mode:", mode);

      let result;
      if (mode === "edit") {
        result = await updateManufacturer({
          variables: { input },
        });
      } else {
        result = await createManufacturer({
          variables: { input },
        });
      }

      console.log("Mutation result:", result);

      // Check for the specific mutation response field
      const responseData = mode === "edit"
        ? (result.data as any)?.updateMasterManufacturer
        : (result.data as any)?.createMasterManufacturer;

      if (responseData) {
        // Refetch data to update the grid
        getData();
        showToast({
          status: "success",
          title:
            mode === "edit"
              ? "Manufacturer details updated successfully."
              : "Manufacturer created successfully.",
        });
        onClose();
      } else {
        console.warn("Mutation completed but no data returned:", result);
        showToast({
          status: "error",
          title: "No data returned from the server. Please check the console for details.",
        });
      }
    } catch (error: any) {
      console.error("Error saving manufacturer:", error);
      console.error("Error details:", {
        message: error?.message,
        graphQLErrors: error?.graphQLErrors,
        networkError: error?.networkError,
        stack: error?.stack,
      });
      
      const errorMessage = error?.graphQLErrors?.[0]?.message 
        || error?.networkError?.message 
        || error?.message 
        || "Something went wrong while saving the data.";
      
      showToast({
        status: "error",
        title: errorMessage,
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
          required
        />

        <TextField
          name="email"
          label="Email"
          value={formData.email}
          onChange={handleChange}
          type="email"
          placeholder="Enter email"
          size="small"
          fullWidth
        />

        <TextField
          name="company_name"
          label="Company Name"
          value={formData.company_name}
          onChange={handleChange}
          placeholder="Enter company name"
          size="small"
          fullWidth
        />

        <TextField
          name="website"
          label="Website"
          value={formData.website}
          onChange={handleChange}
          placeholder="Enter website"
          size="small"
          fullWidth
        />

        <TextField
          name="address"
          label="Address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Enter address"
          size="small"
          fullWidth
        />

        <TextField
          name="phone_number"
          label="Phone Number"
          value={formData.phone_number}
          onChange={handleChange}
          placeholder="Enter phone number"
          size="small"
          fullWidth
        />

        <TextField
          name="country_code"
          label="Country Code"
          value={formData.country_code}
          onChange={handleChange}
          placeholder="Enter country code"
          size="small"
          fullWidth
        />

        <TextField
          name="contact_person"
          label="Contact Person"
          value={formData.contact_person}
          onChange={handleChange}
          placeholder="Enter contact person"
          size="small"
          fullWidth
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
          {createLoading || updateLoading
            ? "Saving..."
            : mode === "edit"
            ? "Update Details"
            : "Add Manufacturer"}
        </Button>
      </Box>
    </Box>
  );
};

export default ManufacturerDetailsModal;
