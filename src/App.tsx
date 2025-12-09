import { useMemo } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import {
  StyledEngineProvider,
  ThemeProvider as MuiThemeProvider,
} from "@mui/material";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ApolloProvider } from "@apollo/client/react";
import apolloClient from "./graphql/apolloClient";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import { AuthProvider } from "./context/AuthContext";
import Signup from "./pages/Signup";
import ForgetPassword from "./pages/Forget-Password";
import ResetPassword from "./pages/Reset-password";
import AcceptInvitation from "./pages/accept-invitation/AcceptInvitation";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";
import Dashboard from "./pages/dashboard/Dashboard";
import MainDashboard from "./pages/dashboard/MainDashboard";
import Onboard from "./pages/onBoard/Onboard";
import TicketingBoard from "./pages/ticketing";
import { getRoleTheme } from "./themes/theme";
import { LoaderProvider } from "./context/LoaderContext";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import PageWithTitle from "./components/PageWithTitle";
import muiTheme from "./themes/muiTheme";
import Gallery from "./pages/gallery";
import SubscriptionOverview from "./pages/subscription/SubscriptionOverview";
import Team from "./pages/team/Team";
import Partners from "./pages/partners/Partners";
import Company from "./pages/company/Company";
import { PublicRoute } from "./components/PublicRoute";
import AiAddons from "./pages/ai-addons/AiAddons";
import MasterData from "./pages/master-data/MasterData";
import AssetCategory from "./pages/masterData/assetCategory/AssetCategory";
import AssetType from "./pages/masterData/assetType/AssetType";
import AssetFields from "./pages/masterData/assetfields/AssetFields";
import AssetPartFields from "./pages/masterData/assetpartfields/AssetPartFields";
import AssetParts from "./pages/masterData/assetparts/AssetParts";
import AssignmentType from "./pages/masterData/assignmentType/AssignmentType";
import Manufacturer from "./pages/masterData/manufacturer/Manufacturer";
import ServiceType from "./pages/masterData/serviceType/ServiceType";
import ServiceCategory from "./pages/masterData/serviecCategory/ServiceCategory";
import Vendor from "./pages/masterData/vendor/Vendor";
import WorkOrderType from "./pages/masterData/workOrderType/WorkOrderType";
import WorkOrderStage from "./pages/masterData/workorderStage/WorkOrderStage";
import Plans from "./pages/plans/Plans";
// import PlanForm from "./pages/plans/PlanForm";
import SettingsPage from "./pages/settings/Settings";
const muiCache = createCache({ key: "mui", prepend: true });
const chakraCache = createCache({ key: "chakra" });

function App() {
  const chakraTheme = getRoleTheme("user"); // or 'user', 'manager', etc. based on your role logic
  const memoizedMuiTheme = useMemo(() => muiTheme, []);

  return (
    <ApolloProvider client={apolloClient}>
      <CacheProvider value={muiCache}>
        <StyledEngineProvider injectFirst>
          <ChakraProvider theme={chakraTheme}>
            <CacheProvider value={chakraCache}>
              <MuiThemeProvider theme={memoizedMuiTheme}>
                <BrowserRouter>
                  <AuthProvider>
                    <LoaderProvider>
                      <Routes>
                        <Route
                          path="/login"
                          element={
                            <PublicRoute>
                              <Login />
                            </PublicRoute>
                          }
                        />
                        <Route
                          path="/signup"
                          element={
                            <PublicRoute>
                              <Signup />
                            </PublicRoute>
                          }
                        />
                        <Route
                          path="/forgot-password"
                          element={
                            <PublicRoute>
                              <ForgetPassword />
                            </PublicRoute>
                          }
                        />
                        <Route
                          path="/reset-password"
                          element={
                            <PublicRoute>
                              <ResetPassword />
                            </PublicRoute>
                          }
                        />
                        <Route
                          path="/accept-invitation"
                          element={<AcceptInvitation />}
                        />
                        <Route
                          element={
                            <ProtectedRoute>
                              <Layout />
                            </ProtectedRoute>
                          }
                        >
                          <Route
                            path="/dashboard"
                            element={
                              <PageWithTitle title="Dashboard">
                                <MainDashboard />
                              </PageWithTitle>
                            }
                          />
                          <Route
                            path="/onboard"
                            element={
                              <PageWithTitle title="Onboard">
                                <Onboard />
                              </PageWithTitle>
                            }
                          />
                          <Route
                            path="/ticketing"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "partner_admin"]}>
                                <PageWithTitle title="Ticketing">
                                  <TicketingBoard />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          />
                          <Route
                            path="/gallery"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "partner_admin"]}>
                                <PageWithTitle title="Gallery">
                                  <Gallery />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          />
                          <Route
                            path="/subscription"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "partner_admin"]}>
                                <PageWithTitle title="Plan & Billing">
                                  <SubscriptionOverview />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          />
                          <Route
                            path="/team"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "partner_admin"]}>
                                <PageWithTitle title="Team">
                                  <Team />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          />
                          <Route
                            path="/partners"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                                <PageWithTitle title="Partners">
                                  <Partners />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          />
                          <Route
                            path="/company"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "partner_admin"]}>
                                <PageWithTitle title="Company">
                                  <Company />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          />
                          <Route
                            path="/ai-addons"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "partner_admin"]}>
                                <PageWithTitle title="AI Addons">
                                  <AiAddons />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          />
                          <Route
                            path="/plans"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                                <PageWithTitle title="Subscription Plans">
                                  <Plans />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          />
                          {/* <Route
                            path="/plans/:id"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                                <PageWithTitle title="Subscription Plan">
                                  <PlanForm />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          /> */}
                          <Route
                            path="/settings"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                                <PageWithTitle title="Settings">
                                  <SettingsPage />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          />
                          <Route
                            path="/master-data"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "partner_admin"]}>
                                <PageWithTitle title="Master Data">
                                  <MasterData />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          />
                          {/* master data routes */}
                          <Route
                            path="/manufacturer"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "partner_admin"]}>
                                <PageWithTitle title="Manufacturer">
                                  <Manufacturer />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          />
                          <Route
                            path="/vendor"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "partner_admin"]}>
                                <PageWithTitle title="Vendor">
                                  <Vendor />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          />
                          <Route
                            path="/assettype"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "partner_admin"]}>
                                <PageWithTitle title="Asset Type">
                                  <AssetType />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          />
                          <Route
                            path="/assignmenttype"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "partner_admin"]}>
                                <PageWithTitle title="Assignment Type">
                                  <AssignmentType />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          />
                          <Route
                            path="/servicetype"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "partner_admin"]}>
                                <PageWithTitle title="Service Type">
                                  <ServiceType />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          />
                          <Route
                            path="/servicecategory"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "partner_admin"]}>
                                <PageWithTitle title="Service Category">
                                  <ServiceCategory />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          />
                          <Route
                            path="/assetparts"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "partner_admin"]}>
                                <PageWithTitle title="Asset Parts">
                                  <AssetParts />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          />
                          <Route
                            path="/assetpartfields"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "partner_admin"]}>
                                <PageWithTitle title="Asset Part Fields">
                                  <AssetPartFields />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          />
                          <Route
                            path="/assetfields"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "partner_admin"]}>
                                <PageWithTitle title="Asset Fields">
                                  <AssetFields />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          />
                          <Route
                            path="/assetcategory"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "partner_admin"]}>
                                <PageWithTitle title="Asset Category">
                                  <AssetCategory />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          />
                          <Route
                            path="/workordertype"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "partner_admin"]}>
                                <PageWithTitle title="Work Order Type">
                                  <WorkOrderType />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          />
                          <Route
                            path="/workorderstage"
                            element={
                              <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "partner_admin"]}>
                                <PageWithTitle title="Work Order Stages">
                                  <WorkOrderStage />
                                </PageWithTitle>
                              </RoleProtectedRoute>
                            }
                          />
                        </Route>

                        {/* <Route path="*" element={<Login />} /> */}
                        <Route
                          path="/"
                          element={
                            <Navigate
                              to={
                                localStorage.getItem("accessToken")
                                  ? "/dashboard"
                                  : "/login"
                              }
                              replace
                            />
                          }
                        />
                      </Routes>
                    </LoaderProvider>
                  </AuthProvider>
                </BrowserRouter>
              </MuiThemeProvider>
            </CacheProvider>
          </ChakraProvider>
        </StyledEngineProvider>
      </CacheProvider>
    </ApolloProvider>
  );
}

export default App;
