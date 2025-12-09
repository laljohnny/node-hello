import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

type locationModalProps = {
  data: any;
  setData: React.Dispatch<React.SetStateAction<any>>;
  submitData: (data: any, isEdit: boolean) => void;
};
const initialState = {
  name: "",
  description: "",
  type: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
  countryalpha2: "",
};
const LocationModal: React.FC<locationModalProps> = ({ data, setData, submitData }) => {
  
  // const [formData, setFormData] = useState<any>({
  //   // id: "",
  //   name: "",
  //   description: "",
  //   type: "",
  //   address1: "",
  //   address2: "",
  //   city: "",
  //   state: "",
  //   zip: "",
  //   countryalpha2: "",
  //   // parentid: "",
  // });
  const [formData, setFormData] = useState<any>(initialState);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      const locationData = {
        name: data?.name,
        description: data?.description,
        type: data?.location_type,
        address1: data?.address?.address1,
        address2: data?.address?.address2,
        city: data?.address?.city,
        state: data?.address?.state,
        zip: data?.address?.zip,
        countryalpha2: data?.address?.countryalpha2,
        id: data?.id,
      }
      setFormData(locationData);
    } else {
      setFormData(initialState);
    }
  }, [data]);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev:any) => ({ ...prev, [name]: value }));

    // clear error when user types again
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    Object.entries(formData).forEach(([key, value]:any) => {
      // if (key === "id" || key === "parentid") return;
      if (!value?.trim()) {
        newErrors[key] = `${key} is required`;
      }
    });

    // special check for zip
    if (formData.zip && !/^\d+$/.test(formData.zip)) {
      newErrors.zip = "Zip must be numeric";
    }

    return newErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const isEdit = !!formData.id;
    submitData(formData, isEdit);
    setFormData(initialState);
    // console.log("✅ Form submitted:", formData);
    // here you can trigger API call
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Stack className="form-modal" spacing={3}>
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
          multiline
          minRows={3}
          size="small"
          fullWidth
        />

        <TextField
          name="type"
          label="Type"
          value={formData.type}
          onChange={handleChange}
          placeholder="Select type"
          select
          error={!!errors.type}
          helperText={errors.type}
          size="small"
          fullWidth
        >
          <MenuItem value="building">Building</MenuItem>
          <MenuItem value="floor">Floor</MenuItem>
          <MenuItem value="room">Room</MenuItem>
          <MenuItem value="area">Area</MenuItem>
          <MenuItem value="zone">Zone</MenuItem>
        </TextField>

        <TextField
          name="address1"
          label="Address 1"
          value={formData.address1}
          onChange={handleChange}
          placeholder="Enter address line 1"
          error={!!errors.address1}
          helperText={errors.address1}
          size="small"
          fullWidth
        />

        <TextField
          name="address2"
          label="Address 2"
          value={formData.address2}
          onChange={handleChange}
          placeholder="Enter address line 2"
          error={!!errors.address2}
          helperText={errors.address2}
          size="small"
          fullWidth
        />

        <TextField
          name="city"
          label="City"
          value={formData.city}
          onChange={handleChange}
          placeholder="Enter city"
          error={!!errors.city}
          helperText={errors.city}
          size="small"
          fullWidth
        />

        <TextField
          name="state"
          label="State"
          value={formData.state}
          onChange={handleChange}
          placeholder="Enter state"
          error={!!errors.state}
          helperText={errors.state}
          size="small"
          fullWidth
        />

        <TextField
          name="zip"
          label="Zip"
          value={formData.zip}
          onChange={handleChange}
          placeholder="Enter zip"
          error={!!errors.zip}
          helperText={errors.zip}
          size="small"
          fullWidth
        />

        <TextField
          name="countryalpha2"
          label="Country (Alpha-2)"
          value={formData.countryalpha2}
          onChange={handleChange}
          placeholder="Enter country code"
          error={!!errors.countryalpha2}
          helperText={errors.countryalpha2}
          size="small"
          fullWidth
        />
      </Stack>
      <Box pt={4} px={2}>
        <Button
          className="add-btn"
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          fullWidth
        >
          Save
        </Button>
      </Box>
    </Box>
  );
};

export default LocationModal;

