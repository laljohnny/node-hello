import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
type floorModalProps = {
  data: any;
  setData: React.Dispatch<React.SetStateAction<any>>;
  submitData: (data: any, isEdit: boolean) => void;
};
const initialState = {
  name: "",
    description: "",
    // path: "",
    // type: "",
    // locationid: "",
    // filesize: "",
    // createdusing: "",
};
const FloorModal: React.FC<floorModalProps> = ({data, setData, submitData }) => {
  const [formData, setFormData] = useState<any>(initialState);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      const floorData = {
        name: data.name,
        description: data.description,
        id: data.id,
      }
      setFormData({...initialState,...floorData});
    } else {
      setFormData(initialState);
    }
  }, [data]);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));

    // clear error when user types again
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    Object.entries(formData).forEach(([key, value]: any) => {
      if (!value?.trim()) {
        newErrors[key] = `${key} is required`;
      }
    });

    // special check for filesize
    if (formData.filesize && !/^\d+$/.test(formData.filesize)) {
      newErrors.filesize = "Filesize must be numeric";
    }

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
  //   setFormData(initialState);
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
      
      await submitData(formData, isEdit);
      setFormData(initialState);
    } catch (err) {
      console.error("Error in submitData:", err);
    }
 
 
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
          error={!!errors.description}
          helperText={errors.description}
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

export default FloorModal;
