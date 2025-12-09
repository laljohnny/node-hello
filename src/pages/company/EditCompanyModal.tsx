import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useLazyQuery } from "@apollo/client/react";
import { UPDATE_COMPANY_MUTATION } from "../../graphql/mutations";
import { COMPANIES_QUERY } from "../../graphql/queries";
import { showToast } from "../../components/toastService";
import { useLoader } from "../../context/LoaderContext";
import { useAuth } from "../../context/AuthContext";

type EditCompanyModalProps = {
  data: any;
  onClose: () => void;
  onSave: (companyData: any) => void;
  onCompanyUpdated?: () => void | Promise<void>;
};

type EditCompanyFormInputs = {
  name: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  website?: string;
  industry?: string;
  phone: string;
  businessType?: string;
  countryAlpha2: string;
};

const schema = yup.object({
  name: yup.string().required("Name is required"),
  email: yup
    .string()
    .optional()
    .test("email-format", "Invalid email format", (value) => {
      if (!value || value.trim() === "") return true; // Optional field
      return yup.string().email().isValidSync(value);
    }),
  phone: yup
    .string()
    .required("Phone Number is required")
    .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits and contain only numbers"),
  businessType: yup.string().optional(),
  countryAlpha2: yup.string().required("Country is required"),
  website: yup
    .string()
    .optional()
    .test("website-format", "Invalid website URL format", (value) => {
      if (!value || value.trim() === "") return true; // Optional field
      try {
        const url = new URL(value.startsWith("http") ? value : `https://${value}`);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    }),
  industry: yup.string().optional(),
  address: yup.string().optional(),
  city: yup.string().optional(),
  state: yup.string().optional(),
  zip: yup.string().optional(),
}) as yup.ObjectSchema<EditCompanyFormInputs>;

const industryOptions = [
  "Agriculture & Farming",
  "Automotive & Transportation",
  "Aviation & Aerospace",
  "Commercial Real Estate & Property Management",
  "Construction & Engineering",
  "Energy",
  "Other",
];
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];
const BUSINESS_TYPES = [
  "Corporation",
  "LLC",
  "Partnership",
  "Sole Proprietorship",
  "Non-Profit",
  "Other",
];

const EditCompanyModal: React.FC<EditCompanyModalProps> = ({
  data,
  onClose,
  onSave,
  onCompanyUpdated,
}) => {
  const { tenantList, setTenantList } = useAuth();
  const { showLoader, hideLoader } = useLoader();
  const [updateCompanyMutation, { loading: updateCompanyLoading }] = useMutation(UPDATE_COMPANY_MUTATION, {
    refetchQueries: [{ query: COMPANIES_QUERY }],
    awaitRefetchQueries: true,
  });
  const [fetchCompanies] = useLazyQuery(COMPANIES_QUERY);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditCompanyFormInputs>({
    resolver: yupResolver(schema),
    mode: "all",
    defaultValues: {
      name: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      website: "",
      industry: "",
      phone: "",
      businessType: "",
      countryAlpha2: "US",
    },
  });

  useEffect(() => {
    if (data) {
      // Map query fields to form fields
      // Query returns: phoneNumber, address (single), countryCode
      // Form expects: phone, address, countryAlpha2
      reset({
        name: data.name || "",
        email: data.email || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        zip: data.zip || "",
        website: data.website || "",
        industry: data.industry || "",
        phone: data.phoneNumber || "",
        businessType: data.businessType || "",
        countryAlpha2: data.countryCode || "US",
      });
    }
  }, [data, reset]);

  const onSubmit = async (formData: EditCompanyFormInputs) => {
    try {
      showLoader();
      
      // Prepare GraphQL mutation input - all fields included, null for empty values
      // Map single address field to address1, set address2 to null
      const addressValue = formData.address?.trim() || null;
      const input = {
        id: data.id || null,
        name: formData.name.trim() || null,
        email: formData.email?.trim() || null,
        phoneNumber: formData.phone.trim() || null, // Backend expects 'phone', not 'phoneNumber'
        address: addressValue, // Backend expects 'address1', not 'address'
        city: formData.city?.trim() || null,
        state: formData.state?.trim() || null,
        zip: formData.zip?.trim() || null,
        website: formData.website?.trim() || null,
        industry: formData.industry?.trim() || null,
        businessType: formData.businessType?.trim() || null,
        countryCode: formData.countryAlpha2?.trim() || null, // Backend expects 'countryCode'
      };

      // Update company using GraphQL mutation
      const result = await updateCompanyMutation({
        variables: {
          input: input,
        },
      });

      if (result.data && typeof result.data === 'object' && 'updateCompany' in result.data) {
        const companyData = (result.data as { updateCompany: any }).updateCompany;
        
        // Fetch updated company list after successful update
        try {
          const companiesResult = await fetchCompanies();
          if (companiesResult.data && typeof companiesResult.data === 'object' && 'companies' in companiesResult.data) {
            const companies = (companiesResult.data as { companies: any[] }).companies;
            // Map companies to Tenant format
            const tenants = companies.map((company: any) => ({
              id: company.id,
              displayname: company.name || company.displayName || '',
              slug: company.id,
              ...company,
            }));
            setTenantList(tenants);
          }
        } catch (getError) {
          console.error("Failed to fetch updated company list:", getError);
        }

        onSave(companyData);
        
        // Call parent's refresh callback if provided
        if (onCompanyUpdated) {
          await onCompanyUpdated();
        }
        
        showToast({
          status: "success",
          title: "Company information has been updated.",
        });

        reset({
          name: "",
          email: "",
          address: "",
          city: "",
          state: "",
          zip: "",
          website: "",
          industry: "",
          phone: "",
          businessType: "",
          countryAlpha2: "US",
        });

        onClose();
      }
    } catch (error: any) {
      console.error("Failed to update company", error);
      const errorMessage = error?.graphQLErrors?.[0]?.message || error?.message || "Something went wrong while updating the data.";
      showToast({
        status: "error",
        title: errorMessage,
      });
    } finally {
      hideLoader();
    }
  };

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="modal-form-sec"
    >
      <Stack className="modal-form gap">
          {/* Name - Required */}
          <TextField
            {...register("name")}
            label="Company Name"
            placeholder="Enter company name"
            error={!!errors.name}
            helperText={errors.name?.message}
            size="small"
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />

          {/* Email - Optional */}
          <TextField
            {...register("email")}
            label="Email"
            type="email"
            placeholder="Enter email"
            error={!!errors.email}
            helperText={errors.email?.message}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          {/* Address - Optional */}
          <TextField
            {...register("address")}
            label="Address"
            placeholder="Enter address"
            error={!!errors.address}
            helperText={errors.address?.message}
            size="small"
            fullWidth
            multiline
            rows={2}
            InputLabelProps={{ shrink: true }}
          />

          {/* City - Optional */}
          <TextField
            {...register("city")}
            label="City"
            placeholder="Enter city"
            error={!!errors.city}
            helperText={errors.city?.message}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          {/* State - Optional */}
          <TextField
            {...register("state")}
            label="State"
            placeholder="Enter state"
            error={!!errors.state}
            helperText={errors.state?.message}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          {/* Zip - Optional */}
          <TextField
            {...register("zip")}
            label="Zip"
            placeholder="Enter zip code"
            error={!!errors.zip}
            helperText={errors.zip?.message}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          {/* Website URL - Optional */}
          <TextField
            {...register("website")}
            label="Website URL"
            placeholder="Enter website URL"
            error={!!errors.website}
            helperText={errors.website?.message}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          {/* Industry - Optional */}
          <Controller
            name="industry"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Select Your Industry"
                select
                size="small"
                fullWidth
                error={!!error}
                helperText={error?.message}
                value={field.value ?? ""}
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {industryOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            )}
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
            InputLabelProps={{ shrink: true }}
          />

          {/* Business Type - Optional */}
          <Controller
            name="businessType"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Business Type"
                select
                size="small"
                fullWidth
                error={!!error}
                helperText={error?.message}
                value={field.value ?? ""}
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {BUSINESS_TYPES.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          {/* Country Alpha 2 - Required, Disabled, US only */}
          <Controller
            name="countryAlpha2"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Country Alpha 2"
                select
                size="small"
                fullWidth
                required
                disabled
                error={!!error}
                helperText={error?.message}
                value={field.value ?? "US"}
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="US">US</MenuItem>
              </TextField>
            )}
          />
      </Stack>
      <Stack className="modal-form-buttons">
        <Button
          className="add-btn"
          variant="contained"
          color="secondary"
          type="submit"
          fullWidth
          disabled={isSubmitting || updateCompanyLoading}
        >
          Update Company
        </Button>
      </Stack>
    </Box>
  );
};

export default EditCompanyModal;

