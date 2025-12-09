import React, { useState, useEffect, useMemo } from "react";
import {
    Box,
    Button,
    Paper,
    TextField,
    Typography,
    Grid,
    Divider,
    CircularProgress,
    Stack,
} from "@mui/material";
import { useQuery, useMutation } from "@apollo/client/react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { USER_QUERY, COMPANIES_QUERY, COMPANY_USERS_QUERY } from "../../graphql/queries";
import { UPDATE_COMPANY_MUTATION, UPDATE_COMPANY_USER_MUTATION } from "../../graphql/mutations";
import { useLoader } from "../../context/LoaderContext";
import { showToast } from "../../components/toastService";
import RightSideModal from "../../components/RightSideModal";

const schema = yup.object().shape({
    firstName: yup.string().required("First Name is required"),
    lastName: yup.string().required("Last Name is required"),
    companyName: yup.string().required("Company Name is required"),
    industry: yup.string().required("Industry is required"),
});

const Settings = () => {
    const [editModalOpen, setEditModalOpen] = useState(false);
    const { showLoader, hideLoader } = useLoader();

    const { data: userData, loading: userLoading, refetch: refetchUser } = useQuery<any>(USER_QUERY);
    const { data: companiesData, loading: companiesLoading, refetch: refetchCompanies } = useQuery<any>(COMPANIES_QUERY);
    const { data: companyUsersData, loading: companyUsersLoading, refetch: refetchCompanyUsers } = useQuery<any>(COMPANY_USERS_QUERY);

    const [updateCompany] = useMutation(UPDATE_COMPANY_MUTATION);
    const [updateCompanyUser] = useMutation(UPDATE_COMPANY_USER_MUTATION, {
        refetchQueries: [{ query: COMPANY_USERS_QUERY }, { query: USER_QUERY }],
        awaitRefetchQueries: true
    });

    const user = userData?.me;
    const company = companiesData?.companies?.find((c: any) => c.id === user?.companyId);
    
    // Find current user from companyUsers by email
    const currentUser = useMemo(() => {
        if (!user?.email || !companyUsersData?.companyUsers) return null;
        return companyUsersData.companyUsers.find((u: any) => u.email === user.email);
    }, [user?.email, companyUsersData?.companyUsers]);

    const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            firstName: "",
            lastName: "",
            companyName: "",
            industry: "",
        },
    });

    useEffect(() => {
        if (currentUser && company && editModalOpen) {
            reset({
                firstName: currentUser.firstName || "",
                lastName: currentUser.lastName || "",
                companyName: company.name || "",
                industry: company.industry || "",
            });
        }
    }, [currentUser, company, editModalOpen, reset]);

    const onSubmit = async (data: any) => {
        if (!currentUser) {
            showToast({ status: "error", title: "User not found" });
            return;
        }

        showLoader();
        try {
            // Update User
            await updateCompanyUser({
                variables: {
                    input: {
                        userId: currentUser.id,
                        firstName: data.firstName,
                        lastName: data.lastName,
                    },
                },
            });

            // Update Company
            await updateCompany({
                variables: {
                    input: {
                        id: company.id,
                        name: data.companyName,
                        industry: data.industry,
                    },
                },
            });

            await refetchUser();
            await refetchCompanies();
            await refetchCompanyUsers();
            setEditModalOpen(false);
            showToast({ status: "success", title: "Settings updated successfully" });
        } catch (err: any) {
            console.error("Error updating settings:", err);
            showToast({ status: "error", title: err.message || "Error updating settings" });
        } finally {
            hideLoader();
        }
    };

    const handleCloseModal = () => {
        setEditModalOpen(false);
        reset();
    };

    if (userLoading || companiesLoading || companyUsersLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
            </Box>
        );
    }

    // Use currentUser data if available, otherwise fallback to user from USER_QUERY
    const displayUser = currentUser || user;

    return (
        <Box sx={{maxWidth: 1000, mx: "auto" }}>

        <div className="card custom-card">
            <div className="card-header d-flex justify-content-between align-items-center py-2">
                <Typography variant="h2" fontWeight="bold">
                    Settings
                </Typography>
                <Button variant="contained" onClick={() => setEditModalOpen(true)}>
                        Edit
                    </Button>
            </div>
            <div className="card-body">
               <Typography variant="h2" mb={2} color="primary" fontWeight="bold">User Info</Typography>
               <div className="row">
                <div className="col-md-6">
                    <div className="view-data">
                        <h6>First Name</h6>
                        <p>{displayUser?.firstName || "---"}</p>    
                    </div>
                   
                </div>
                <div className="col-md-6">
                <div className="view-data">
                        <h6>Last Name</h6>
                        <p>{displayUser?.lastName || "---"}</p>
                    </div>
                   
                </div>
                <div className="col-md-6">
                <div className="view-data">
                        <h6>Email</h6>
                        <p>{displayUser?.email || "---"}</p>
                    </div>
                  
                </div>

                <div className="col-md-6">
                    <div className="view-data">
                        <h6>Role</h6>
                        <p>{displayUser?.role || "---"}</p>
                    </div>
                </div>
                <div className="col-12 mt-4">
                <Typography variant="h2" mb={2} color="primary" fontWeight="bold">Company Info</Typography>
                </div>
                <div className="col-md-6">
                <div className="view-data">
                    <h6>Company Name</h6>
                    <p>{company?.name || "---"}</p>
                </div>
                </div>
                <div className="col-md-6">
                <div className="view-data">
                    <h6>Subdomain</h6>
                    <p>{company?.subdomain || "---"}</p>
                </div>
                </div>
                <div className="col-md-6">
                <div className="view-data">
                    <h6>Industry</h6>
                    <p>{company?.industry || "---"}</p>
                </div>
                </div>
               </div>
            </div>
        </div>
         

            {/* Edit Modal - Right Side Modal like Teams */}
            <RightSideModal
                isOpen={editModalOpen}
                onClose={handleCloseModal}
                title="Edit User Information"
            >
                <Box onSubmit={handleSubmit(onSubmit)} component="form"  noValidate  className="modal-form-sec">
                    <Stack className="modal-form gap">
                        <Controller
                            name="firstName"
                            control={control}
                            render={({ field, fieldState: { error } }) => (
                                <TextField
                                    {...field}
                                    label="First Name"
                                    fullWidth
                                    error={!!error}
                                    helperText={error?.message}
                                    size="small"
                                    required
                                />
                            )}
                        />
                        <Controller
                            name="lastName"
                            control={control}
                            render={({ field, fieldState: { error } }) => (
                                <TextField
                                    {...field}
                                    label="Last Name"
                                    fullWidth
                                    error={!!error}
                                    helperText={error?.message}
                                    size="small"
                                    required
                                />
                            )}
                        />
                        <TextField
                            label="Email"
                            value={displayUser?.email || ""}
                            fullWidth
                            disabled
                            size="small"
                            helperText="Email cannot be changed"
                        />
                        <Controller
                            name="companyName"
                            control={control}
                            render={({ field, fieldState: { error } }) => (
                                <TextField
                                    {...field}
                                    label="Company Name"
                                    fullWidth
                                    error={!!error}
                                    helperText={error?.message}
                                    size="small"
                                    required
                                />
                            )}
                        />
                        <TextField
                            label="Subdomain"
                            value={company?.subdomain || ""}
                            fullWidth
                            disabled
                            size="small"
                            helperText="Subdomain cannot be changed"
                        />
                        <Controller
                            name="industry"
                            control={control}
                            render={({ field, fieldState: { error } }) => (
                                <TextField
                                    {...field}
                                    label="Industry"
                                    fullWidth
                                    error={!!error}
                                    helperText={error?.message}
                                    size="small"
                                    required
                                />
                            )}
                        />
                    </Stack>
                    <Stack className="modal-form-buttons">
                        {/* <Button
                            variant="outlined"
                            onClick={handleCloseModal}
                            fullWidth
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button> */}
                        <Button
                            variant="contained"
                            color="primary"
                            type="submit"
                            fullWidth
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </Stack>
                </Box>
            </RightSideModal>
        </Box>
    );
};

export default Settings;
