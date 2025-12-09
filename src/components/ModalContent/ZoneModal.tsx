import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
type zoneModalProps = {
  data: any;
  setData: React.Dispatch<React.SetStateAction<any>>;
  submitData: (data: any, isEdit: boolean) => void;
};
const initialState = {
   // id: "",
   name: "",
   description: "",
   // floorid: "",
}
const ZoneModal: React.FC<zoneModalProps> = ({ data, setData, submitData }) => {
  const [formData, setFormData] = useState<any>(initialState);
useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      const locationData = {
        name: data.name,
        description: data.description,
        id: data.id,
      }
      setFormData(locationData);
    } else {
      setFormData(initialState);
    }
  }, [data]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));

    // clear error when user types again
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    Object.entries(formData).forEach(([key, value]: any) => {
      if (!value.trim()) {
        newErrors[key] = `${key} is required`;
      }
    });

    return newErrors;
  };

  // const handleSubmit = () => {
  //   const validationErrors = validate();
  //   if (Object.keys(validationErrors).length > 0) {
  //     setErrors(validationErrors);
  //     return;
  //   }
  //   const isEdit = !!formData.id;
  //   submitData(formData, isEdit);
  //   console.log("✅ Form submitted:", formData);
  //   // here you can trigger API call
  // };
  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
 
    const isEdit = !!formData.id;
 
    try {
      console.log("Submitting data...", formData);
      await submitData(formData, isEdit); // ✅ wait for async function
      console.log("✅ Data submitted successfully");
    } catch (error) {
      console.error("❌ Error submitting data:", error);
    }
 
    setFormData(initialState); // reset form after submission
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

export default ZoneModal;
