import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@apollo/client/react";
import { UPDATE_COMPANY_MUTATION } from "../../graphql/mutations";
import { COMPANIES_QUERY } from "../../graphql/queries";
import { showToast } from "../../components/toastService";
import { useLoader } from "../../context/LoaderContext";

type EditPartnerModalProps = {
  data: any;
  onClose: () => void;
  onSave: (partnerData: any) => void;
};

type EditPartnerFormInputs = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

const schema = yup.object({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  phone: yup
    .string()
    .required("Phone is required")
    .test("phone-format", "Invalid phone number format", (value) => {
      if (!value || value.trim() === "") return false;
      // Accept formats like: +1234567890, (123) 456-7890, 123-456-7890, 1234567890
      const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
      return phoneRegex.test(value);
    }),
}) as yup.ObjectSchema<EditPartnerFormInputs>;

const EditPartnerModal: React.FC<EditPartnerModalProps> = ({
  data,
  onClose,
  onSave,
}) => {
  const { showLoader, hideLoader } = useLoader();
  const [updateCompanyMutation, { loading: updateCompanyLoading }] = useMutation(UPDATE_COMPANY_MUTATION, {
    refetchQueries: [{ query: COMPANIES_QUERY }],
    awaitRefetchQueries: true,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditPartnerFormInputs>({
    resolver: yupResolver(schema),
    mode: "all",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  const isEmailConfirmed = Boolean(data?.emailConfirmed);

  useEffect(() => {
    if (data) {
      reset({
        firstName: data.firstName || data.firstname || "",
        lastName: data.lastName || data.lastname || "",
        email: data.email || data.workemail || "",
        phone: data.phone || data.phonenumber || "",
      });
    }
  }, [data, reset]);

  const onSubmit = async (formData: EditPartnerFormInputs) => {
    try {
      showLoader();
      
      // Prepare GraphQL mutation input for company update
      // Map partner form fields to company fields:
      // firstName -> name (company name)
      // email -> email
      // phone -> phoneNumber
      const input = {
        id: data.id || null,
        name: formData.firstName.trim() || null, // Partner firstName maps to company name
        email: formData.email.trim() || null,
        phoneNumber: formData.phone.trim() || null,
      };

      // Update company using GraphQL mutation
      const result = await updateCompanyMutation({
        variables: {
          input: input,
        },
      });

      if (result.data && typeof result.data === 'object' && 'updateCompany' in result.data) {
        const companyData = (result.data as { updateCompany: any }).updateCompany;

        onSave(companyData);
        
        showToast({
          status: "success",
          title: "Partner information has been updated.",
        });

        // Reset form
        reset({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
        });

        onClose();
      }
    } catch (error: any) {
      console.error("Failed to update partner", error);
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
          {/* FIRST NAME */}
          <TextField
            {...register("firstName")}
            label="First Name"
            placeholder="Enter first name"
            error={!!errors.firstName}
            helperText={errors.firstName?.message}
            size="small"
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />

          {/* LAST NAME */}
          <TextField
            {...register("lastName")}
            label="Last Name"
            placeholder="Enter last name"
            error={!!errors.lastName}
            helperText={errors.lastName?.message}
            size="small"
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />

          {/* EMAIL - Disabled if emailConfirmed is true */}
          <TextField
            {...register("email")}
            label="Email"
            type="email"
            placeholder="Enter email"
            error={!!errors.email}
            helperText={errors.email?.message}
            size="small"
            fullWidth
            disabled={isEmailConfirmed}
            InputLabelProps={{ shrink: true }}
          />

          {/* PHONE */}
          <TextField
            {...register("phone")}
            label="Phone"
            placeholder="Enter phone number"
            error={!!errors.phone}
            helperText={errors.phone?.message}
            size="small"
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
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
          Update Partner
        </Button>
      </Stack>
    </Box>
  );
};

export default EditPartnerModal;

