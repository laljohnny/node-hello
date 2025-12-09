
import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import FormHelperText from "@mui/material/FormHelperText";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery } from "@apollo/client/react";
import { useLoader } from "../../../context/LoaderContext";
import { showToast } from "../../../components/toastService";
import { useAuth } from "../../../context/AuthContext";
import { CREATE_ASSIGNMENT_MUTATION, UPDATE_ASSIGNMENT_MUTATION } from "../../../graphql/mutations";
import { ASSIGNMENTS_TYPES_QUERY, WORK_ORDERS_QUERY } from "../../../graphql/queries";

type AssignmentFormInputs = {
  assignmentType: string;
  workOrderId: string;
};

const schema = yup.object({
  assignmentType: yup.string().required("Assignment Type is required").min(3, "Assignment Type must be at least 3 characters"),
  workOrderId: yup.string().default(""),
});

type AssignmentTypeModalProps = {
  mode: "add" | "edit";
  data?: any;
  onClose: () => void;
  getData: () => void;
};

const AssignmentTypeModal: React.FC<AssignmentTypeModalProps> = ({
  mode,
  data,
  onClose,
  getData
}) => {
  const { showLoader, hideLoader } = useLoader();
  const { user } = useAuth();
  const [createAssignment, { loading: createLoading }] = useMutation(CREATE_ASSIGNMENT_MUTATION, {
    refetchQueries: [{ query: ASSIGNMENTS_TYPES_QUERY }],
  });
  const [updateAssignment, { loading: updateLoading }] = useMutation(UPDATE_ASSIGNMENT_MUTATION, {
    refetchQueries: [{ query: ASSIGNMENTS_TYPES_QUERY }],
  });

  // Fetch work orders for dropdown
  const { data: workOrdersData, loading: workOrdersLoading } = useQuery(WORK_ORDERS_QUERY);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    clearErrors,
    trigger,
  } = useForm<AssignmentFormInputs>({
    resolver: yupResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      assignmentType: "",
      workOrderId: "",
    },
  });

  useEffect(() => {
    // Clear all errors and reset form when modal opens
    clearErrors();
    
    if (mode === "edit" && data) {
      reset({
        assignmentType: data.assignmentType || data.name || "",
        workOrderId: data.workOrderId || "",
      });
    } else {
      reset({
        assignmentType: "",
        workOrderId: "",
      });
    }
  }, [mode, data, reset, clearErrors]);

  // Reset form when modal closes
  const handleClose = () => {
    reset({
      assignmentType: "",
      workOrderId: "",
    });
    clearErrors();
    onClose();
  };

  const onSubmit = async (formData: AssignmentFormInputs) => {
    // Trigger validation to ensure all fields are validated
    const isValid = await trigger();
    if (!isValid) {
      return;
    }

    try {
      showLoader();
      
      // Get userId from AuthContext
      const userId = user?.id || user?.userid || null;
      if (!userId) {
        showToast({
          status: "error",
          title: "User ID not found. Please login again.",
        });
        hideLoader();
        return;
      }

      // Prepare input data
      const input = {
        assignmentType: formData.assignmentType || null,
        workOrderId: formData.workOrderId || null,
        userId: userId,
        ...(mode === "edit" && data?.id ? { id: data.id } : {}), // Add id only in edit mode
      };

      let result;
      if (mode === "edit") {
        result = await updateAssignment({
          variables: { input },
        });
      } else {
        result = await createAssignment({
          variables: { input },
        });
      }

      if (result.data) {
        // Refetch data to update the grid
        getData();
        const text = mode === "edit" 
          ? "Assignment details have been updated successfully." 
          : "Assignment has been added successfully.";
        showToast({ status: "success", title: text });
        // Reset form after successful submission
        reset({
          assignmentType: "",
          workOrderId: "",
        });
        clearErrors();
        handleClose();
      }
    } catch (error: any) {
      console.error("Error saving assignment:", error);
      showToast({
        status: "error",
        title: error?.message || "Something went wrong while saving the data.",
      });
    } finally {
      hideLoader();
    }
  };

  // Get work orders for dropdown
  const workOrders = (workOrdersData as any)?.workorders || [];

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
            name="assignmentType"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Assignment Type"
                type="text"
                placeholder="Enter assignment type"
                error={!!errors.assignmentType}
                helperText={errors.assignmentType?.message || ""}
                size="small"
                fullWidth
                required
              />
            )}
          />

          {/* <Controller
            name="workOrderId"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth size="small" error={!!errors.workOrderId} required>
                <InputLabel>Work Order</InputLabel>
                <Select
                  {...field}
                  label="Work Order *"
                  disabled={workOrdersLoading}
                >
                  {workOrders.map((workOrder: any) => (
                    <MenuItem key={workOrder.id} value={workOrder.id}>
                      {workOrder.name || workOrder.key || `Work Order ${workOrder.id}`}
                    </MenuItem>
                  ))}
                </Select>
                {errors.workOrderId && (
                  <FormHelperText>{errors.workOrderId.message}</FormHelperText>
                )}
              </FormControl>
            )}
          /> */}
        </Stack>
        <Box className="form-modal-buttons">
          <Button
            className="add-btn"
            variant="contained"
            color="secondary"
            type="submit"
            fullWidth
            disabled={createLoading || updateLoading || workOrdersLoading}
          >
            {mode === "edit" ? "Update Assignment" : "Add Assignment"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AssignmentTypeModal;
