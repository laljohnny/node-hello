import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { api } from "../api";
// import { Box } from "lucide-react";
type assetModalProps = {
  data: any;
  setData: React.Dispatch<React.SetStateAction<any>>;
  submitData: (data: any, isEdit: boolean) => void;
};
const initialState = {
  name: "",
    // description: "",
    assettypeid: "",
    maintenancestatus: "",
};
const AssetModal: React.FC<assetModalProps> = ({data, setData, submitData }) => {
  const [formData, setFormData] = useState<any>(initialState);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [assettype, setAssettype] = useState<any>([]);
useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      const assetData = {
        name: data?.name,
        assettypeid: data?.assettypeid,
        maintenancestatus: data?.maintenancestatus,
        id: data?.id,
      }
      setFormData(assetData);
    } else {
      setFormData(initialState);
    }
  }, [data]);
  useEffect(() => {
    getAssetType();
  }, []);
  const getAssetType=async()=>{
    try {
      const res = await api.patch("data/rest", {
        query: `ca_asset_type{}`,
      });
      if (res?.data) {
        setAssettype(res.data.data.ca_asset_type || []);
      }
    } catch (error: any) {
      console.error("Fetch error:", error.message);
    } finally {
      // setLoading(false);
    }
  }

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
      if (!value.trim()) {
        newErrors[key] = `${key} is required`;
      }
    });

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
    console.log("✅ Form submitted:", formData);
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
          name="assettypeid"
          label="Asset Type"
          value={formData.assettypeid}
          onChange={handleChange}
          placeholder="Select asset type"
          select
          error={!!errors.assettypeid}
          helperText={errors.assettypeid}
          size="small"
          fullWidth
        >
          {assettype?.map((asset: any) => (
            <MenuItem key={asset.id} value={asset.id}>
              {asset.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          name="maintenancestatus"
          label="Maintenance Status"
          value={formData.maintenancestatus}
          onChange={handleChange}
          placeholder="Enter maintenance status"
          error={!!errors.maintenancestatus}
          helperText={errors.maintenancestatus}
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

export default AssetModal;
