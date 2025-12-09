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
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useMutation } from "@apollo/client/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { showToast } from "../components/toastService";
import { useLoader } from "../context/LoaderContext";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import muiTheme from "../themes/muiTheme";
import { RESET_PASSWORD_MUTATION } from "../graphql/mutations";

type ResetPasswordFormInputs = {
  newPassword: string;
  confirmPassword: string;
};

const schema = yup.object({
  newPassword: yup
    .string()
    .required("New password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[a-zA-Z]/, "Password must contain at least one letter")
    .matches(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: yup
    .string()
    .required("Confirm password is required")
    .oneOf([yup.ref("newPassword")], "Passwords must match"),
});

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { showLoader, hideLoader } = useLoader();

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [resetPasswordMutation, { loading: resetPasswordLoading }] =
    useMutation(RESET_PASSWORD_MUTATION);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormInputs>({
    resolver: yupResolver(schema),
    mode: "all",
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const handleResetPassword = async (data: ResetPasswordFormInputs) => {
    if (!token) {
      showToast({
        status: "error",
        title: "Invalid reset link. Please request a new password reset.",
      });
      return;
    }

    try {
      showLoader();

      await resetPasswordMutation({
        variables: {
          input: {
            token: token,
            newPassword: data.newPassword,
          },
        },
      });

      showToast({
        status: "success",
        title: "Password reset successfully! Please login with your new password.",
      });
      navigate("/login");
    } catch (error: any) {
      const errorMessage =
        error?.graphQLErrors?.[0]?.message ||
        error?.message ||
        "Failed to reset password. Please try again.";
      showToast({ status: "error", title: errorMessage });
    } finally {
      hideLoader();
    }
  };

  const handleCancel = () => {
    navigate("/login");
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
              style={{ maxWidth: "420px", width: "100%" }}
            >
              <Typography
                className="text-center"
                variant="h4"
                component="h1"
                sx={{ fontWeight: 600 }}
              >
                Reset Password
              </Typography>
              <Typography
                variant="body2"
                sx={{ mt: 2, mb: 3, textAlign: "center", color: "text.secondary" }}
              >
                Enter your new password below.
              </Typography>
              <Box
                component="form"
                onSubmit={handleSubmit(handleResetPassword)}
                sx={{ textAlign: "left" }}
              >
                {/* New Password */}
                <FormControl
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  error={!!errors.newPassword}
                  size="small"
                >
                  <InputLabel htmlFor="new-password-input">New Password</InputLabel>
                  <OutlinedInput
                    id="new-password-input"
                    type={showNewPassword ? "text" : "password"}
                    {...register("newPassword")}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          onClick={toggleNewPasswordVisibility}
                          onMouseDown={(event) => event.preventDefault()}
                          edge="end"
                          aria-label={
                            showNewPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showNewPassword ? (
                            <VisibilityOff sx={{ fontSize: 16 }} />
                          ) : (
                            <Visibility sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    }
                    label="New Password"
                    placeholder="Enter new password"
                  />
                  <FormHelperText>{errors.newPassword?.message}</FormHelperText>
                </FormControl>

                {/* Confirm Password */}
                <FormControl
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  error={!!errors.confirmPassword}
                  size="small"
                >
                  <InputLabel htmlFor="confirm-password-input">
                    Confirm Password
                  </InputLabel>
                  <OutlinedInput
                    id="confirm-password-input"
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          onClick={toggleConfirmPasswordVisibility}
                          onMouseDown={(event) => event.preventDefault()}
                          edge="end"
                          aria-label={
                            showConfirmPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showConfirmPassword ? (
                            <VisibilityOff sx={{ fontSize: 16 }} />
                          ) : (
                            <Visibility sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    }
                    label="Confirm Password"
                    placeholder="Confirm new password"
                  />
                  <FormHelperText>{errors.confirmPassword?.message}</FormHelperText>
                </FormControl>

                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    fullWidth
                    size="large"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    fullWidth
                    size="large"
                    disabled={isSubmitting || resetPasswordLoading || !token}
                  >
                    {resetPasswordLoading ? "Resetting..." : "Submit"}
                  </Button>
                </Stack>

                <Box sx={{ mt: 3, textAlign: "center" }}>
                  <Typography variant="body2">
                    Remember your password?{" "}
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

export default ResetPassword;

