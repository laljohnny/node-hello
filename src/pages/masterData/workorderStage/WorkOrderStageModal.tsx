import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useMutation } from '@apollo/client/react';
import { useLoader } from '../../../context/LoaderContext';
import { showToast } from '../../../components/toastService';
import { CREATE_WORK_ORDER_STAGE_MUTATION, UPDATE_WORK_ORDER_STAGE_MUTATION } from '../../../graphql/mutations';
import { WORKORDER_STAGES_QUERY } from '../../../graphql/queries';

type WorkOrderStageModalProps = {
  mode: 'add' | 'edit';
  data?: any;
  onClose: () => void;
  getData: () => void;
};

const WorkOrderStageModal: React.FC<WorkOrderStageModalProps> = ({
  mode,
  data,
  onClose,
  getData
}) => {
  const [formData, setFormData] = useState({  name: ''});
  const [errors, setErrors] = useState<{ name?: string }>({});
  const { showLoader, hideLoader } = useLoader();
  const [createWorkOrderStage, { loading: createLoading }] = useMutation(CREATE_WORK_ORDER_STAGE_MUTATION, {
    refetchQueries: [{ query: WORKORDER_STAGES_QUERY }],
  });
  const [updateWorkOrderStage, { loading: updateLoading }] = useMutation(UPDATE_WORK_ORDER_STAGE_MUTATION, {
    refetchQueries: [{ query: WORKORDER_STAGES_QUERY }],
  });

  useEffect(() => {
    // Clear all errors when modal opens
    setErrors({});
    
    if (mode === 'edit' && data) {
      setFormData({
        name: data.name || '',
      });
    } else {
      setFormData({
        name: ''
      });
    }
  }, [mode, data]);

  // Reset form when modal closes
  const handleClose = () => {
    setErrors({});
    setFormData({
      name: ''
    });
    onClose();
  };

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    validateField(name, value);
  };
  
  const validateField = (name: string, value: string) => {
    let error = "";
  
    if (name === "name") {
      if (!value.trim()) {
        error = "Name is required.";
      } else if (value.trim().length < 3) {
        error = "Name must be at least 3 characters.";
      }
    }
  
    setErrors((prev) => ({ ...prev, [name]: error }));
  };
  
  const validate = () => {
    let valid = true;
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      validateField("name", formData.name);
      valid = false;
    }
    return valid;
  };

  const handleUpdate = async () => {
    if (!validate()) return;
    
    try {
      showLoader();
      
      // Prepare input data
      const input = {
        name: formData.name || null,
        color: data?.color || null,
        ...(mode === 'edit' && data?.id ? { id: data.id } : {}), // Add id only in edit mode
      };

      let result;
      if (mode === 'edit') {
        result = await updateWorkOrderStage({
          variables: { input },
        });
      } else {
        result = await createWorkOrderStage({
          variables: { input },
        });
      }

      if (result.data) {
        // Refetch data to update the grid
        getData();
        const text = mode === 'edit' 
          ? 'Work order stage details have been updated successfully.' 
          : 'Work order stage has been added successfully.';
        showToast({ status: "success", title: text });
        // Reset form after successful submission
        setErrors({});
        setFormData({
          name: ''
        });
        handleClose();
      }
    } catch (error: any) {
      console.error("Error saving work order stage:", error);
      showToast({
        status: "error",
        title: error?.message || 'Something went wrong while saving the data.',
      });
    } finally {
      hideLoader();
    }
  };

  return (
    <Box width="100%">
      <Stack className='form-modal' >
        <TextField
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          type="text"
          placeholder="Enter name"
          error={!!errors.name}
          helperText={errors.name || ""}
          size="small"
          fullWidth
          required
        />
        
      </Stack>
        <Box className="form-modal-buttons">
          <Button className="add-btn"
            variant="contained"
            color="secondary"
            onClick={handleUpdate}
            fullWidth
          >
            {mode === 'edit' ? 'Update Workorder Stage' : 'Add Workorder Stage'}
          </Button>
        </Box>
    </Box>
  );
};

export default WorkOrderStageModal;

