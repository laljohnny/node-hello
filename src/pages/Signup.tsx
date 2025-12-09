import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Link,
  MenuItem,
  OutlinedInput,
  TextField,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useMutation } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import { showToast } from "../components/toastService";
import { useLoader } from "../context/LoaderContext";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import muiTheme from "../themes/muiTheme";
import { SIGNUP_MUTATION } from "../graphql/mutations";

type SignupFormInputs = {
  companyName: string;
  subdomain: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  countryCode: string;
  email: string;
  password: string;
  jobTitle: string;
  industry: string;
};

// Type for signup mutation response
type SignupUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  companyId?: string;
  schema?: string;
};

type SignupResponse = {
  signup: {
    accessToken: string;
    refreshToken: string;
    user: SignupUser;
  };
};

const schema = yup.object({
  companyName: yup.string().required("Company Name is required"),
  // subdomain: yup
  //   .string()
  //   .required("Subdomain is required")
  //   .matches(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens")
  //   .min(3, "Subdomain must be at least 3 characters"),
  firstName: yup.string().required("First Name is required"),
  lastName: yup.string().required("Last Name is required"),
  phoneNumber: yup.string().optional(),
  countryCode: yup.string().optional(),
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
  jobTitle: yup.string().required("Job Title is required"),
  industry: yup.string().required("Industry is required"),
}) as yup.ObjectSchema<SignupFormInputs>;

const jobTitleOptions = [
  "CEO/President/Owner",
  "CFO",
  "CIO",
  "COO",
  "CTO",
  "Building Owner",
  "Facility Manager",
  "Property Manager",
  "Operations Manager",
  "Others",
];

const industryOptions = [
  "Commercial Real Estate",
  "Healthcare",
  "Education",
  "Government",
  "Manufacturing",
  "Retail",
  "Hospitality",
  "Technology",
  "Finance",
  "Others",
];

const Signup = () => {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();
  const [showPassword, setShowPassword] = useState(false);

  const [signupMutation, { loading: signupLoading }] = useMutation<SignupResponse>(SIGNUP_MUTATION);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormInputs>({
    resolver: yupResolver(schema),
    mode: "all",
    defaultValues: {
      companyName: "",
      subdomain: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      countryCode: "+1",
      email: "",
      password: "",
      jobTitle: "",
      industry: "",
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSignup = async (data: SignupFormInputs) => {
    try {
      showLoader();

      const result = await signupMutation({
        variables: {
          input: {
            companyName: data.companyName.trim(),
            subdomain: data.subdomain.toLowerCase().trim(),
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            email: data.email.trim(),
            password: data.password,
            phoneNumber: data.phoneNumber?.trim() || undefined,
            countryCode: data.countryCode?.trim() || undefined,
            jobTitle: data.jobTitle,
            industry: data.industry,
          },
        },
      });

      if (result.data?.signup) {
        showToast({ status: "success", title: "Account created successfully! Please login." });
        navigate("/login");
      }
    } catch (error: any) {
      const errorMessage =
        error?.graphQLErrors?.[0]?.message ||
        error?.message ||
        "Signup failed. Please try again.";
      
      // Check for subdomain already taken error
      if (errorMessage.toLowerCase().includes("subdomain") && 
          (errorMessage.toLowerCase().includes("taken") || 
           errorMessage.toLowerCase().includes("already"))) {
        showToast({ status: "error", title: "Subdomain already taken. Please choose a different one." });
      } else {
        showToast({ status: "error", title: errorMessage });
      }
    } finally {
      hideLoader();
    }
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", display: "flex" }}>
        <Grid container sx={{ flex: 1 }}>
          <Grid
            item
            xs={12}
            lg={6}
            sx={{
              display: { xs: "none", lg: "flex" },
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
              bgcolor: "black",
              color: "white",
            }}
          >
            <Box
              sx={{
                opacity: 0.05,
                position: "absolute",
                inset: "-25rem",
                borderRadius: "50%",
                width: "50rem",
                height: "50rem",
                borderWidth: "10rem",
                borderColor: "white",
                borderStyle: "solid",
              }}
            />
            <Box
              sx={{
                width: "75%",
                textAlign: "left",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div>
                <Box
                  component="img"
                  src="/images/logo-white.png"
                  alt="Logo"
                  sx={{ width: 255, position: "relative", zIndex: 1, mb: 4 }}
                />
              </div>
              <Typography
                variant="h3"
                sx={{ fontWeight: 600, lineHeight: 1.2, color: "white" }}
              >
                The world's smartest buildings are powered by CriticalAsset
              </Typography>
              <Typography variant="h6" sx={{ mt: 5, color: "white" }}>
                CriticalAsset is trusted by the world's best companies, cities,
                schools, healthcare facilities, contractors and property
                managers.
              </Typography>
            </Box>
            <Box
              sx={{
                opacity: 0.05,
                position: "absolute",
                bottom: "-25rem",
                right: "-25rem",
                borderRadius: "50%",
                width: "50rem",
                height: "50rem",
                borderWidth: "10rem",
                borderColor: "white",
                borderStyle: "solid",
              }}
            />
          </Grid>
          <Grid
            item
            xs={12}
            lg={6}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              py: { xs: 4, md: 6 },
              px: { xs: 3, md: 8 },
            }}
          >
            <div
              className="card custom-card p-4"
              style={{ maxWidth: "480px", width: "100%" }}
            >
              <Typography
                className="text-center"
                variant="h4"
                component="h1"
                sx={{ fontWeight: 600 }}
              >
                Create an Account
              </Typography>
              <Box
                component="form"
                onSubmit={handleSubmit(handleSignup)}
                sx={{ mt: 3, textAlign: "left" }}
              >
                {/* Company Name */}
                <TextField
                  label="Company Name"
                  type="text"
                  fullWidth
                  margin="normal"
                  {...register("companyName")}
                  error={!!errors.companyName}
                  helperText={errors.companyName?.message}
                  size="small"
                  required
                />

                {/* Subdomain */}
                <TextField
                  label="Subdomain"
                  type="text"
                  fullWidth
                  margin="normal"
                  {...register("subdomain")}
                  error={!!errors.subdomain}
                  // helperText={errors.subdomain?.message || "Your company URL will be: subdomain.criticalasset.com"}
                  size="small"
                  required
                  placeholder="your-company"
                  inputProps={{ style: { textTransform: 'lowercase' } }}
                />

                {/* First Name & Last Name */}
                <Grid container spacing={2} sx={{ mt: 0 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="First Name"
                      type="text"
                      fullWidth
                      {...register("firstName")}
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message}
                      size="small"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Last Name"
                      type="text"
                      fullWidth
                      {...register("lastName")}
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message}
                      size="small"
                      required
                    />
                  </Grid>
                </Grid>

                {/* Email */}
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  margin="normal"
                  {...register("email")}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  size="small"
                  required
                />

                {/* Phone with Country Code (Optional) */}
                <Grid container spacing={2} sx={{ mt: 0 }}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Country Code"
                      type="text"
                      fullWidth
                      {...register("countryCode")}
                      error={!!errors.countryCode}
                      helperText={errors.countryCode?.message}
                      size="small"
                      placeholder="+1"
                    />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      label="Phone Number"
                      type="tel"
                      fullWidth
                      {...register("phoneNumber")}
                      error={!!errors.phoneNumber}
                      helperText={errors.phoneNumber?.message}
                      size="small"
                      placeholder="Phone number (optional)"
                    />
                  </Grid>
                </Grid>

                {/* Job Title & Industry */}
                <Grid container spacing={2} sx={{ mt: 0 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      label="Job Title"
                      fullWidth
                      margin="normal"
                      {...register("jobTitle")}
                      error={!!errors.jobTitle}
                      helperText={errors.jobTitle?.message}
                      size="small"
                      required
                      defaultValue=""
                    >
                      <MenuItem value="" disabled>Select Job Title</MenuItem>
                      {jobTitleOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      label="Industry"
                      fullWidth
                      margin="normal"
                      {...register("industry")}
                      error={!!errors.industry}
                      helperText={errors.industry?.message}
                      size="small"
                      required
                      defaultValue=""
                    >
                      <MenuItem value="" disabled>Select Industry</MenuItem>
                      {industryOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                {/* Password */}
                <FormControl
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  error={!!errors.password}
                  size="small"
                >
                  <InputLabel htmlFor="password-input">Password</InputLabel>
                  <OutlinedInput
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          onClick={togglePasswordVisibility}
                          onMouseDown={(event) => event.preventDefault()}
                          edge="end"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <VisibilityOff sx={{ fontSize: 16 }} />
                          ) : (
                            <Visibility sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    }
                    label="Password"
                  />
                  <FormHelperText>{errors.password?.message}</FormHelperText>
                </FormControl>

                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  fullWidth
                  size="large"
                  sx={{ mt: 2 }}
                  disabled={isSubmitting || signupLoading}
                >
                  SIGN UP
                </Button>
                <Box sx={{ mt: 3, textAlign: "center" }}>
                  <Typography variant="body2">
                    Already have an account?{" "}
                    <Link href="/login" underline="hover">
                      Sign in
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </div>
          </Grid>
        </Grid>
      </Box>
    </ThemeProvider>
  );
};

export default Signup;
