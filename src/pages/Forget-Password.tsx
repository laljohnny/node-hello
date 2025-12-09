import { useState } from "react";
import {
  Box,
  Button,
  Grid,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
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
import { FORGOT_PASSWORD_MUTATION } from "../graphql/mutations";

type ForgotPasswordFormInputs = {
  email: string;
};

const schema = yup.object({
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
});

const ForgetPassword = () => {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();

  const [forgotPasswordMutation, { loading: forgotPasswordLoading }] =
    useMutation(FORGOT_PASSWORD_MUTATION);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormInputs>({
    resolver: yupResolver(schema),
    mode: "all",
    defaultValues: {
      email: "",
    },
  });

  const handleForgotPassword = async (data: ForgotPasswordFormInputs) => {
    try {
      showLoader();

      await forgotPasswordMutation({
        variables: {
          input: {
            email: data.email.trim(),
          },
        },
      });

      showToast({
        status: "success",
        title: "Password reset email sent! Please check your inbox.",
      });
      navigate("/login");
    } catch (error: any) {
      const errorMessage =
        error?.graphQLErrors?.[0]?.message ||
        error?.message ||
        "Failed to send reset email. Please try again.";
      
      // Check for user not found error
      if (errorMessage.toLowerCase().includes("not found") || 
          errorMessage.toLowerCase().includes("not exist") ||
          errorMessage.toLowerCase().includes("no user")) {
        showToast({ status: "error", title: "User not found. Please check your email address." });
      } else {
        showToast({ status: "error", title: errorMessage });
      }
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
                Forgot Password
              </Typography>
              <Typography
                variant="body2"
                sx={{ mt: 2, mb: 3, textAlign: "center", color: "text.secondary" }}
              >
                Enter your email address and we'll send you a link to reset your
                password.
              </Typography>
              <Box
                component="form"
                onSubmit={handleSubmit(handleForgotPassword)}
                sx={{ textAlign: "left" }}
              >
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  margin="normal"
                  {...register("email")}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  size="small"
                  placeholder="Enter your email"
                  autoFocus
                />

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
                    disabled={isSubmitting || forgotPasswordLoading}
                  >
                    {forgotPasswordLoading ? "Sending..." : "Submit"}
                  </Button>
                </Stack>

                {/* <Box sx={{ mt: 3, textAlign: "center" }}>
                  <Typography variant="body2">
                    Remember your password?{" "}
                    <Link href="/login" underline="hover">
                      Sign in
                    </Link>
                  </Typography>
                </Box> */}
              </Box>
            </div>
          </Grid>
        </Grid>
      </Box>
    </ThemeProvider>
  );
};

export default ForgetPassword;

