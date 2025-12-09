import { useState, useEffect } from "react";
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
  OutlinedInput,
  TextField,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import { showToast } from "../../components/toastService";
import { useLoader } from "../../context/LoaderContext";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import muiTheme from "../../themes/muiTheme";
import { ACCEPT_INVITATION_MUTATION } from "../../graphql/mutations";

type AcceptInvitationFormInputs = {
  firstName: string;
  lastName: string;
  // phone: string; // Commented out
  password: string;
};

type AcceptInvitationResponse = {
  acceptInvitation: boolean | object;
};

const schema = yup.object({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  // phone: yup
  //   .string()
  //   .required("Phone is required")
  //   .test("phone-format", "Invalid phone number format", (value) => {
  //     if (!value || value.trim() === "") return false;
  //     // Accept formats like: +1234567890, (123) 456-7890, 123-456-7890, 1234567890
  //     const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  //     return phoneRegex.test(value);
  //   }), // Commented out
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[a-zA-Z]/, "Password must contain at least one letter")
    .matches(/[0-9]/, "Password must contain at least one number"),
});

const AcceptInvitation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showLoader, hideLoader } = useLoader();
  const [acceptInvitationMutation] = useMutation(ACCEPT_INVITATION_MUTATION);

  // Get token from URL parameters
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInvitationFormInputs>({
    resolver: yupResolver(schema),
    mode: "all",
    defaultValues: {
      firstName: "",
      lastName: "",
      // phone: "", // Commented out
      password: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if required parameter is present
    if (!token) {
      showToast({
        status: "error",
        title: "Invalid invitation link. Missing token parameter.",
      });
      // Optionally redirect to login after a delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }
  }, [token, navigate]);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleAcceptInvitation = async (data: AcceptInvitationFormInputs) => {
    if (!token) {
      showToast({
        status: "error",
        title: "Invalid invitation link. Missing token parameter.",
      });
      return;
    }

    try {
      showLoader();
      
      const result = await acceptInvitationMutation({
        variables: {
          input: {
            token: token,
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            // phone: data.phone.trim(), // Commented out
            password: data.password,
          },
        },
      });

      if (result.data && typeof result.data === 'object' && 'acceptInvitation' in result.data) {
        const response = result.data as AcceptInvitationResponse;
        if (response.acceptInvitation) {
          showToast({
            status: "success",
            title: "Invitation accepted successfully. You can now login.",
          });
          // Redirect to login page after successful acceptance
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error("Failed to accept invitation", error);
      const errorMessage = error?.graphQLErrors?.[0]?.message || 
                          error?.message || 
                          "Failed to accept invitation. Please try again.";
      showToast({
        status: "error",
        title: errorMessage,
      });
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
              py: { xs: 6, md: 8 },
              px: { xs: 3, md: 8 },
            }}
          >
            <div
              className="card custom-card p-4"
              style={{ maxWidth: "420px" }}
            >
              <Typography
                className="text-center"
                variant="h4"
                component="h1"
                sx={{ fontWeight: 600 }}
              >
                Accept Invitation
              </Typography>
              <Box
                component="form"
                onSubmit={handleSubmit(handleAcceptInvitation)}
                sx={{ mt: 4, textAlign: "left" }}
              >
                <TextField
                  label="First Name"
                  type="text"
                  fullWidth
                  margin="normal"
                  {...register("firstName")}
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                  size="small"
                  required
                />
                <TextField
                  label="Last Name"
                  type="text"
                  fullWidth
                  margin="normal"
                  {...register("lastName")}
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                  size="small"
                  required
                />
                {/* Phone field commented out */}
                {/* <TextField
                  label="Phone"
                  type="text"
                  fullWidth
                  margin="normal"
                  {...register("phone")}
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                  size="small"
                  required
                  placeholder="Enter phone number"
                /> */}
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
                  color="secondary"
                  type="submit"
                  fullWidth
                  size="large"
                  sx={{ mt: 2 }}
                //   disabled={isSubmitting || !id || !token}
                >
                   Accept Invitation
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

export default AcceptInvitation;

