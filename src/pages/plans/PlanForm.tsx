import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation } from "@apollo/client/react";
import { CREATE_PLAN_MUTATION, UPDATE_PLAN_MUTATION } from "../../graphql/mutations";
import { PLANS_QUERY } from "../../graphql/queries";
import { useLoader } from "../../context/LoaderContext";
import { showToast } from "../../components/toastService";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  description: yup.string().nullable().default(""),
  price: yup.number().required("Price is required").min(0, "Price must be greater than or equal to 0"),
  currency: yup.string().default("USD"),
  interval: yup.string().oneOf(["month", "year"]).default("month"),
  active: yup.boolean().default(true),
  assetsLimit: yup.number().min(-1, "Assets Limit must be -1 or greater").default(-1).label("Assets Limit"),
  locationsLimit: yup.number().min(-1, "Locations Limit must be -1 or greater").default(-1).label("Locations Limit"),
  usersLimit: yup.number().min(-1, "Users Limit must be -1 or greater").default(-1).label("Users Limit"),
  storageLimit: yup.number().min(-1, "Storage Limit must be -1 or greater").default(-1).label("Storage Limit (GB)"),
});

type PlanFormInputs = yup.InferType<typeof schema>;

type PlanFormProps = {
  mode: "add" | "edit";
  data?: any;
  onClose: () => void;
  getData: () => void;
};

const PlanForm: React.FC<PlanFormProps> = ({
  mode,
  data,
  onClose,
  getData,
}) => {
  const { showLoader, hideLoader } = useLoader();
  const [createPlan, { loading: createLoading }] = useMutation(CREATE_PLAN_MUTATION, {
    refetchQueries: [{ query: PLANS_QUERY }],
  });
  const [updatePlan, { loading: updateLoading }] = useMutation(UPDATE_PLAN_MUTATION, {
    refetchQueries: [{ query: PLANS_QUERY }],
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    clearErrors,
  } = useForm<PlanFormInputs>({
    resolver: yupResolver(schema) as any,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      currency: "USD",
      interval: "month",
      active: true,
      assetsLimit: -1,
      locationsLimit: -1,
      usersLimit: -1,
      storageLimit: -1,
    },
  });

  useEffect(() => {
    clearErrors();
    
    if (mode === "edit" && data) {
      // Parse limits
      const limits = typeof data.limits === 'string' ? JSON.parse(data.limits) : data.limits;
      
      reset({
        name: data.name || "",
        description: data.description || "",
        price: data.amount || 0,
        currency: data.currency || "USD",
        interval: data.interval || "month",
        active: data.active !== undefined ? data.active : true,
        assetsLimit: limits?.assets ?? -1,
        locationsLimit: limits?.locations ?? -1,
        usersLimit: limits?.users ?? -1,
        storageLimit: limits?.storage ?? -1,
      });
    } else {
      reset({
        name: "",
        description: "",
        price: 0,
        currency: "USD",
        interval: "month",
        active: true,
        assetsLimit: -1,
        locationsLimit: -1,
        usersLimit: -1,
        storageLimit: -1,
      });
    }
  }, [mode, data, reset, clearErrors]);

  const handleClose = () => {
    clearErrors();
    reset({
      name: "",
      description: "",
      price: 0,
      currency: "USD",
      interval: "month",
      active: true,
      assetsLimit: -1,
      locationsLimit: -1,
      usersLimit: -1,
      storageLimit: -1,
    });
    onClose();
  };

  const onSubmit = async (formData: PlanFormInputs) => {
    try {
      showLoader();
      
      const limits = {
        assets: formData.assetsLimit,
        locations: formData.locationsLimit,
        users: formData.usersLimit,
        storage: formData.storageLimit,
      };

      const baseInput = {
        name: formData.name,
        description: formData.description || null,
        amount: formData.price,
        currency: formData.currency,
        interval: formData.interval,
        limits: limits,
      };

      let result;
      if (mode === "edit") {
        result = await updatePlan({
          variables: {
            input: {
              id: data?.id,
              ...baseInput,
              active: formData.active,
            },
          },
        });
      } else {
        result = await createPlan({
          variables: {
            input: baseInput,
          },
        });
      }

      if (result.data) {
        // Refetch data to update the grid
        getData();
        const text = mode === "edit" 
          ? "Plan updated successfully." 
          : "Plan created successfully.";
        showToast({ status: "success", title: text });
        
        // Reset form after successful submission
        clearErrors();
        reset({
          name: "",
          description: "",
          price: 0,
          currency: "USD",
          interval: "month",
          active: true,
          assetsLimit: -1,
          locationsLimit: -1,
          usersLimit: -1,
          storageLimit: -1,
        });
        handleClose();
      }
    } catch (error: any) {
      console.error("Error saving plan:", error);
      const errorMessage = error?.graphQLErrors?.[0]?.message 
        || error?.networkError?.message 
        || error?.message 
        || "Something went wrong while saving the plan.";
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
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Plan Name"
                placeholder="Enter plan name"
                error={!!error}
                helperText={error?.message || ""}
                size="small"
                fullWidth
                required
              />
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Description"
                placeholder="Enter description"
                error={!!error}
                helperText={error?.message || ""}
                size="small"
                fullWidth
                multiline
                rows={3}
              />
            )}
          />

          <Controller
            name="price"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Price"
                type="number"
                placeholder="Enter price"
                error={!!error}
                helperText={error?.message || ""}
                size="small"
                fullWidth
                required
                inputProps={{
                  min: 0,
                  step: 0.01,
                }}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : Number(e.target.value);
                  field.onChange(value);
                }}
              />
            )}
          />

          <Controller
            name="currency"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Currency"
                placeholder="Enter currency (e.g., USD)"
                error={!!error}
                helperText={error?.message || ""}
                size="small"
                fullWidth
              />
            )}
          />

          <Controller
            name="interval"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                select
                label="Interval"
                error={!!error}
                helperText={error?.message || ""}
                size="small"
                fullWidth
              >
                <MenuItem value="month">Monthly</MenuItem>
                <MenuItem value="year">Yearly</MenuItem>
              </TextField>
            )}
          />

          <Typography variant="h2" sx={{ mt: 1, mb: 0.5 }}>
            Limits <i>(-1 for unlimited)</i>
          </Typography>

          <Controller
            name="assetsLimit"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Max Assets"
                type="number"
                placeholder="Enter max assets (-1 for unlimited)"
                error={!!error}
                helperText={error?.message || ""}
                size="small"
                fullWidth
              />
            )}
          />

          <Controller
            name="locationsLimit"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Max Locations"
                type="number"
                placeholder="Enter max locations (-1 for unlimited)"
                error={!!error}
                helperText={error?.message || ""}
                size="small"
                fullWidth
              />
            )}
          />
          <Controller
            name="usersLimit"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Max Users"
                type="number"
                placeholder="Enter max users (-1 for unlimited)"
                error={!!error}
                helperText={error?.message || ""}
                size="small"
                fullWidth
              />
            )}
          />
          <Controller
            name="storageLimit"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Storage Limit (GB)"
                type="number"
                placeholder="Enter storage limit (-1 for unlimited)"
                error={!!error}
                helperText={error?.message || ""}
                size="small"
                fullWidth
              />
            )}
          />

          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    color="primary"
                  />
                }
                label="Active"
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
            {createLoading || updateLoading
              ? "Saving..."
              : mode === "edit"
              ? "Update Plan"
              : "Create Plan"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default PlanForm;
