import React, { useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation } from '@apollo/client/react';
import { useLoader } from '../../../context/LoaderContext';
import { showToast } from '../../../components/toastService';
import { CREATE_WORK_ORDER_TYPE_MUTATION, UPDATE_WORK_ORDER_TYPE_MUTATION } from '../../../graphql/mutations';
import { WORKORDER_TYPES_QUERY } from '../../../graphql/queries';

type WorkOrderTypeFormInputs = {
  name: string;
};

const schema = yup.object({
  name: yup.string().required("Name is required").min(3, "Name must be at least 3 characters"),
});

type WorkOrderTypeModalProps = {
  mode: 'add' | 'edit';
  data?: any;
  onClose: () => void;
  getData: () => void;
};

const WorkOrderTypeModal: React.FC<WorkOrderTypeModalProps> = ({
  mode,
  data,
  onClose,
  getData
}) => {
  const { showLoader, hideLoader } = useLoader();
  const [createWorkOrderType, { loading: createLoading }] = useMutation(CREATE_WORK_ORDER_TYPE_MUTATION, {
    refetchQueries: [{ query: WORKORDER_TYPES_QUERY }],
  });
  const [updateWorkOrderType, { loading: updateLoading }] = useMutation(UPDATE_WORK_ORDER_TYPE_MUTATION, {
    refetchQueries: [{ query: WORKORDER_TYPES_QUERY }],
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    clearErrors,
    trigger,
  } = useForm<WorkOrderTypeFormInputs>({
    resolver: yupResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    // Clear all errors and reset form when modal opens
    clearErrors();
    
    if (mode === 'edit' && data) {
      reset({
        name: data.name || '',
      });
    } else {
      reset({
        name: ''
      });
    }
  }, [mode, data, reset, clearErrors]);

  // Reset form when modal closes
  const handleClose = () => {
    reset({
      name: ''
    });
    clearErrors();
    onClose();
  };

  const onSubmit = async (formData: WorkOrderTypeFormInputs) => {
    // Trigger validation to ensure all fields are validated
    const isValid = await trigger();
    if (!isValid) {
      return;
    }

    try {
      showLoader();
      
      // Prepare input data
      const input = {
        name: formData.name || null,
        ...(mode === 'edit' && data?.id ? { id: data.id } : {}), // Add id only in edit mode
      };

      let result;
      if (mode === 'edit') {
        result = await updateWorkOrderType({
          variables: { input },
        });
      } else {
        result = await createWorkOrderType({
          variables: { input },
        });
      }

      if (result.data) {
        // Refetch data to update the grid
        getData();
        const text = mode === 'edit' 
          ? 'Work order type details have been updated successfully.' 
          : 'Work order type has been added successfully.';
        showToast({ status: "success", title: text });
        // Reset form after successful submission
        reset({
          name: ''
        });
        clearErrors();
        handleClose();
      }
    } catch (error: any) {
      console.error("Error saving work order type:", error);
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
      <Box
        component="form" noValidate
        onSubmit={handleSubmit(onSubmit)}
        sx={{ width: "100%" }}
      >
        <Stack className='form-modal'>
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
        </Stack>
        <Box className="form-modal-buttons">
          <Button 
            className="add-btn"
            variant="contained"
            color="secondary"
            type="submit"
            fullWidth
            disabled={createLoading || updateLoading}
          >
            {mode === 'edit' ? 'Update Workorder Type' : 'Add Workorder Type'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default WorkOrderTypeModal;
