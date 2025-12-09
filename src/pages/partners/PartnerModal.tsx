import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useLazyQuery } from "@apollo/client/react";
import { CREATE_PARTNER_MUTATION } from "../../graphql/mutations";
import { COMPANIES_QUERY } from "../../graphql/queries";
import { showToast } from "../../components/toastService";
import { useLoader } from "../../context/LoaderContext";
import { useAuth } from "../../context/AuthContext";

type PartnerModalProps = {
  companyData?: any[];
  onClose: () => void;
  onSave: (partnerData: any) => void;
};

type PartnerFormInputs = {
  firstName: string;
  lastName: string;
  phone: string;
  name: string; // Company Name
  jobTitle: string;
  industry: string;
  email: string;
  password: string;
};

const schema = yup.object({
  firstName: yup.string().required("First Name is required"),
  lastName: yup.string().required("Last Name is required"),
  phone: yup
    .string()
    .required("Phone Number is required")
    .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits and contain only numbers"),
  name: yup.string().required("Company is required"),
  jobTitle: yup.string().required("Job Title is required"),
  industry: yup.string().required("Industry is required"),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[a-zA-Z]/, "Password must contain at least one letter")
    .matches(/[0-9]/, "Password must contain at least one number"),
}) as yup.ObjectSchema<PartnerFormInputs>;

const jobTitleOptions = [
  "CEO/President/Owner",
  "CFO",
  "CIO",
  "COO",
  "CTO",
  "Building Owner",
  "Others",
];

const industryOptions = [
  "Agriculture & Farming",
  "Automotive & Transportation",
  "Aviation & Aerospace",
  "Commercial Real Estate & Property Management",
  "Construction & Engineering",
  "Energy",
  "Others",
];

const PartnerModal: React.FC<PartnerModalProps> = ({
  companyData = [],
  onClose,
  onSave,
}) => {
  const { showLoader, hideLoader } = useLoader();
  const { setTenantList } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [createCompanyMutation, { loading: createCompanyLoading }] = useMutation(CREATE_PARTNER_MUTATION, {
    refetchQueries: [{ query: COMPANIES_QUERY }],
    awaitRefetchQueries: true,
  });
  const [fetchCompanies] = useLazyQuery(COMPANIES_QUERY, {
    fetchPolicy: 'network-only',
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PartnerFormInputs>({
    resolver: yupResolver(schema),
    mode: "all",
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      name: "",
      jobTitle: "",
      industry: "",
      email: "",
      password: "",
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Reset form when modal opens
  useEffect(() => {
    reset({
      firstName: "",
      lastName: "",
      phone: "",
      name: "",
      jobTitle: "",
      industry: "",
      email: "",
      password: "",
    });
    setShowPassword(false);
  }, [reset]);

  const onSubmit = async (formData: PartnerFormInputs) => {
    try {
      showLoader();
      
      // Prepare GraphQL mutation input
      const input = {
        phoneNumber: formData.phone.trim(),
        companyName: formData.name.trim(), // Company Name
        jobTitle: formData.jobTitle,
        industry: formData.industry,
        email: formData.email.trim(),
        password: formData.password,
        // role: 'PARTNER_ADMIN',
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      };

      // Create company and user using GraphQL mutation
      const result = await createCompanyMutation({
        variables: {
          input: input,
        },
      });

      if (result.data && typeof result.data === 'object' && 'partnerSignup' in result.data) {
        // Fetch updated companies list and update tenantList
        try {
          const companiesResult = await fetchCompanies();
          if (companiesResult.data && typeof companiesResult.data === 'object' && 'companies' in companiesResult.data) {
            const companies = (companiesResult.data as { companies: any[] }).companies;
            // Map companies to Tenant format (same as Layout.tsx)
            const tenants = companies.map((company: any) => ({
              id: company.id,
              displayname: company.name || company.displayName || '',
              slug: company.id,
              ...company, // Include all company data
            }));
            setTenantList(tenants);
          }
        } catch (getError) {
          console.error("Failed to fetch updated company list:", getError);
        }

        showToast({
          status: "success",
          title: "Partner has been created successfully.",
        });

        // Call onSave callback to notify parent component
        onSave(result.data);

        // Reset form and close modal
        handleClose();
      }
    } catch (error: any) {
      console.error("Failed to create partner", error);
      const errorMessage = error?.graphQLErrors?.[0]?.message || error?.message || "Something went wrong while saving the data.";
      showToast({
        status: "error",
        title: errorMessage,
      });
    } finally {
      hideLoader();
    }
  };

  const handleClose = () => {
    // Reset form when closing modal
    reset({
      firstName: "",
      lastName: "",
      phone: "",
      name: "",
      jobTitle: "",
      industry: "",
      email: "",
      password: "",
    });
    setShowPassword(false); // Reset password visibility
    onClose();
  };

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="modal-form-sec"
    >
      <Stack className="modal-form gap">
          {/* First Name - Required */}
          <TextField
            {...register("firstName")}
            label="First Name"
            placeholder="Enter first name"
            error={!!errors.firstName}
            helperText={errors.firstName?.message}
            size="small"
            fullWidth
            required
          />

          {/* Last Name - Required */}
          <TextField
            {...register("lastName")}
            label="Last Name"
            placeholder="Enter last name"
            error={!!errors.lastName}
            helperText={errors.lastName?.message}
            size="small"
            fullWidth
            required
          />

          {/* Phone Number - Required */}
          <TextField
            {...register("phone")}
            label="Phone Number"
            placeholder="Enter 10 digit phone number"
            error={!!errors.phone}
            helperText={errors.phone?.message}
            size="small"
            fullWidth
            required
            inputProps={{ maxLength: 10 }}
            onInput={(e: any) => {
              e.target.value = e.target.value.replace(/[^0-9]/g, '');
            }}
          />

          {/* Company Name - Required */}
          <TextField
            {...register("name")}
            label="Company"
            placeholder="Enter company name"
            error={!!errors.name}
            helperText={errors.name?.message}
            size="small"
            fullWidth
            required
          />

          {/* Job Title - Required */}
          <Controller
            name="jobTitle"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Job Title"
                select
                size="small"
                fullWidth
                required
                error={!!error}
                helperText={error?.message}
                value={field.value ?? ""}
              >
                <MenuItem value="">
                  <em>Select Job Title</em>
                </MenuItem>
                {jobTitleOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          {/* Industry - Required */}
          <Controller
            name="industry"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Industry"
                select
                size="small"
                fullWidth
                required
                error={!!error}
                helperText={error?.message}
                value={field.value ?? ""}
              >
                <MenuItem value="">
                  <em>Select Industry</em>
                </MenuItem>
                {industryOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          {/* Email - Required */}
          <TextField
            {...register("email")}
            label="Email"
            type="email"
            placeholder="Enter email"
            error={!!errors.email}
            helperText={errors.email?.message}
            size="small"
            fullWidth
            required
          />

          {/* Password - Required */}
          <TextField
            {...register("password")}
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter password"
            error={!!errors.password}
            helperText={errors.password?.message}
            size="small"
            fullWidth
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={togglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
      </Stack>
      <Stack className="modal-form-buttons">
        <Button
          className="add-btn"
          variant="contained"
          color="secondary"
          type="submit"
          fullWidth
          disabled={isSubmitting || createCompanyLoading}
        >
          Add Partner
        </Button>
      </Stack>
    </Box>
  );
};

export default PartnerModal;
