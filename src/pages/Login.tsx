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
  TextField,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useMutation, useLazyQuery } from "@apollo/client/react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { showToast } from "../components/toastService";
import { useLoader } from "../context/LoaderContext";
import {useForm} from "react-hook-form";
import * as yup from "yup";
import {yupResolver} from "@hookform/resolvers/yup";
import muiTheme from "../themes/muiTheme";
import { LOGIN_MUTATION } from "../graphql/mutations";
import { USER_QUERY } from "../graphql/queries";

type loginFormInputs = {
  email: string;
  password: string;
};

// Helper function to decode JWT token
const decodeJWT = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const schema = yup.object({
  email: yup.string().email("Invalid email format").required("Email is required"),
  password: yup.string().required("Password is required"),
  // password: yup.string().required("Password is required").min(6, "Password must be at least 6 characters").matches(/[a-zA-Z]/, "Password must contain at least one letter").matches(/[0-9]/, "Password must contain at least one number"),
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<loginFormInputs>({
    resolver: yupResolver(schema),
    mode: "all",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loginMutation, { loading: loginLoading }] = useMutation(LOGIN_MUTATION);
  const [fetchUser] = useLazyQuery(USER_QUERY, { fetchPolicy: 'network-only' });

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLogin = async (data: loginFormInputs) => {
    try {
      showLoader();
      
      const result = await loginMutation({
        variables: {
          input: {
            email: data.email,
            password: data.password,
          },
        },
      });

      if (result.data && typeof result.data === 'object' && 'login' in result.data) {
        const accessToken = (result.data as { login: { accessToken: string } }).login.accessToken;
        localStorage.setItem("accessToken", accessToken);
        const refreshToken = (result.data as { login: { refreshToken: string } }).login.refreshToken;
        localStorage.setItem("refreshToken", refreshToken);
        
        // Fetch user data using GraphQL query
        try {
          const userResult = await fetchUser();
          
          if (userResult.data && typeof userResult.data === 'object' && 'me' in userResult.data && userResult.data.me) {
            const user = (userResult.data as { me: any }).me;
            login(user);
            navigate("/dashboard");
          } else {
            // User query returned but no user data - decode token as fallback
            console.warn("User query returned no user data, using token data");
            const tokenData = decodeJWT(accessToken);
            if (tokenData) {
              login({ id: tokenData.sub, email: tokenData.email, role: tokenData.role });
            }
            navigate("/dashboard");
          }
        } catch (userError: any) {
          // If user query fails, decode token and still navigate
          console.error("Error fetching user:", userError);
          const tokenData = decodeJWT(accessToken);
          if (tokenData) {
            login({ id: tokenData.sub, email: tokenData.email, role: tokenData.role });
          }
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      const errorMessage = error?.graphQLErrors?.[0]?.message || error?.message || 'Login failed. Please check your details and try again.';
      showToast({ status: "error", title: errorMessage });
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
         {/* <div> */}
         
          <Box sx={{ width: "75%", textAlign: "left", position: "relative", zIndex: 1 }}>
          <div>
         <Box
            component="img"
            src="/images/logo-white.png"
            alt="Logo"
            sx={{ width: 255, position: "relative", zIndex: 1, mb: 4 }}
          />
         </div>
            <Typography variant="h3" sx={{ fontWeight: 600, lineHeight: 1.2,color: 'white' }}>
              The world's smartest buildings are powered by CriticalAsset
            </Typography>
            <Typography variant="h6" sx={{ mt: 5,color: 'white' }}>
              CriticalAsset is trusted by the world's best companies, cities, schools, healthcare facilities, contractors and property managers.
            </Typography>
          </Box>
         {/* </div> */}
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
          <div className="card custom-card p-4" style={{maxWidth: '420px'}}
            // elevation={3}
            // sx={{
            //   width: "100%",
            //   maxWidth: 420,
            //   p: { xs: 4, md: 5 },
            //   borderRadius: '8px',
            //   textAlign: "center",
            // }}
          >
            <Typography className="text-center" variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              Welcome back!
            </Typography>
            <Box
              component="form"
              onSubmit={handleSubmit(handleLogin)}
              sx={{ mt: 4, textAlign: "left" }}
            >
              <TextField
                label="Email"
                type="text"
                fullWidth
                margin="normal"
                {...register("email")}
                error={!!errors.email}
                helperText={errors.email?.message}
                size="small"
              />
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
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
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
                disabled={isSubmitting || loginLoading}
              >
                SIGN IN
              </Button>
              <Box sx={{ mt: 3, textAlign: "center" }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <Link href="/forgot-password" underline="hover">
                    Forgot Password
                  </Link>
                </Typography>
                <Typography variant="body2">
                  Don't have an account?{" "}
                  <Link href="/signup" underline="hover">
                    Sign up
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

export default Login;
