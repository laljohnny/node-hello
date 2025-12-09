
import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation } from "@apollo/client/react";
import { useLoader } from "../../../context/LoaderContext";
import { showToast } from "../../../components/toastService";
import { CREATE_SERVICE_CATEGORY_MUTATION, UPDATE_SERVICE_CATEGORY_MUTATION } from "../../../graphql/mutations";
import { SERVICE_CATEGORIES_QUERY } from "../../../graphql/queries";

type ServiceCategoryFormInputs = {
  name: string;
};

const schema = yup.object({
  name: yup.string().required("Name is required").min(3, "Name must be at least 3 characters"),
});

type ServiceCategoryModalProps = {
  mode: "add" | "edit";
  data?: any;
  onClose: () => void;
  getData: () => void;
};

const ServiceCategoryModal: React.FC<ServiceCategoryModalProps> = ({
  mode,
  data,
  onClose,
  getData
}) => {
  const { showLoader, hideLoader } = useLoader();
  const [createServiceCategory, { loading: createLoading }] = useMutation(CREATE_SERVICE_CATEGORY_MUTATION, {
    refetchQueries: [{ query: SERVICE_CATEGORIES_QUERY }],
  });
  const [updateServiceCategory, { loading: updateLoading }] = useMutation(UPDATE_SERVICE_CATEGORY_MUTATION, {
    refetchQueries: [{ query: SERVICE_CATEGORIES_QUERY }],
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    clearErrors,
    trigger,
  } = useForm<ServiceCategoryFormInputs>({
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
    
    if (mode === "edit" && data) {
      reset({
        name: data.name || "",
      });
    } else {
      reset({
        name: ""
      });
    }
  }, [mode, data, reset, clearErrors]);

  // Reset form when modal closes
  const handleClose = () => {
    reset({
      name: ""
    });
    clearErrors();
    onClose();
  };

  const onSubmit = async (formData: ServiceCategoryFormInputs) => {
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
        ...(mode === "edit" && data?.id ? { id: data.id } : {}), // Add id only in edit mode
      };

      let result;
      if (mode === "edit") {
        result = await updateServiceCategory({
          variables: { input },
        });
      } else {
        result = await createServiceCategory({
          variables: { input },
        });
      }

      if (result.data) {
        // Refetch data to update the grid
        getData();
        const text = mode === "edit" 
          ? "Service category details have been updated successfully." 
          : "Service category has been added successfully.";
        showToast({ status: "success", title: text });
        // Reset form after successful submission
        reset({
          name: ""
        });
        clearErrors();
        handleClose();
      }
    } catch (error: any) {
      console.error("Error saving service category:", error);
      showToast({
        status: "error",
        title: error?.message || "Something went wrong while saving the data.",
      });
    } finally {
      hideLoader();
    }
  };

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
            {mode === "edit" ? "Update Service Category" : "Add Service Category"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ServiceCategoryModal;
