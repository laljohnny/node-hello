import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    TextField,
    MenuItem,
    FormControlLabel,
    Switch,
    Typography,
    Grid,
    Radio,
    RadioGroup,
    FormControl,
    FormLabel,
    Select,
    InputLabel,
    OutlinedInput,
    Chip,
    SelectChangeEvent,
    Stack,
    Autocomplete,
} from "@mui/material";
import { useMutation, useQuery } from "@apollo/client/react";
import {
    CREATE_AI_ADDON_MUTATION,
    UPDATE_AI_ADDON_MUTATION,
} from "../../graphql/mutations";
import { PLANS_QUERY } from "../../graphql/queries";
import { showToast } from "../../components/toastService";
import { useLoader } from "../../context/LoaderContext";

type AiAddonModalProps = {
    data?: any;
    onSave: (data: any) => void;
    onClose: () => void;
    open?: boolean;
};

const defaultFormData = {
    name: "",
    description: "",
    pricingType: "subscription",
    amount: 0,
    currency: "usd",
    interval: "month",
    intervalCount: 1,
    creditPoolSize: 0,
    eligiblePlanIds: [] as string[],
    credits: 0,
};

const AiAddonModal: React.FC<AiAddonModalProps> = ({
    data,
    onSave,
    onClose,
    open = false,
}) => {
    const [formData, setFormData] = useState(defaultFormData);

    const { showLoader, hideLoader } = useLoader();

    const [createAiAddon] = useMutation(CREATE_AI_ADDON_MUTATION);
    const [updateAiAddon] = useMutation(UPDATE_AI_ADDON_MUTATION);
    const { data: plansData } = useQuery<any>(PLANS_QUERY);

    useEffect(() => {
        if (data) {
            setFormData({
                name: data.name || "",
                description: data.description || "",
                pricingType: data.pricingType || "subscription",
                amount: data.amount || 0,
                currency: data.currency || "usd",
                interval: data.interval || "month",
                intervalCount: data.intervalCount || 1,
                creditPoolSize: data.creditPoolSize || 0,  
                eligiblePlanIds: data.eligiblePlanIds || [],     
                credits: data.credits || 0,
            });
        } else {
            // Reset to default when data is null/undefined (create mode)
            setFormData(defaultFormData);
        }
    }, [data]);

    // Reset form when modal opens in create mode
    useEffect(() => {
        if (open && !data) {
            setFormData(defaultFormData);
        }
    }, [open, data]);

    const handleClose = () => {
        setFormData(defaultFormData);
        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handlePlanChange = (_event: any, newValue: any[]) => {
        setFormData((prev) => ({
            ...prev,
            eligiblePlanIds: newValue.map((plan) => plan.id),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        showLoader();

        try {
            const input = {
                ...formData,
                amount: Number(formData.amount),
                intervalCount: Number(formData.intervalCount),
                creditPoolSize: Number(formData.creditPoolSize),
                credits: Number(formData.credits),
            };

            if (data?.id) {
                await updateAiAddon({
                    variables: {
                        input: {
                            id: data.id,
                            ...input,
                        },
                    },
                });
                showToast({ status: "success", title: "AI Addon updated successfully" });
            } else {
                await createAiAddon({
                    variables: {
                        input,
                    },
                });
                showToast({ status: "success", title: "AI Addon created successfully" });
            }
            setFormData(defaultFormData);
            onSave(formData);
        } catch (error: any) {
            console.error("Error saving AI Addon:", error);
            const errorMessage =
                error?.graphQLErrors?.[0]?.message ||
                error?.message ||
                "Failed to save AI Addon";
            showToast({ status: "error", title: errorMessage });
        } finally {
            hideLoader();
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack className="form-modal">
                    <TextField
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        fullWidth
                        required
                        size="small"
                    />
                    <TextField
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        fullWidth
                        multiline
                        rows={3}
                        size="small"
                    />
                    <TextField
                        select
                        label="Pricing Type"
                        name="pricingType"
                        value={formData.pricingType}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                    >
                        <MenuItem value="subscription">Subscription</MenuItem>
                        <MenuItem value="pay_as_you_go">Pay As You Go</MenuItem>
                    </TextField>
                {/* <Grid item xs={6}>
                    <TextField
                        select
                        label="Type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                    >
                        <MenuItem value="credits">Credits</MenuItem>
                        <MenuItem value="feature">Feature</MenuItem>
                    </TextField>
                </Grid> */}
                    <TextField
                        label="Amount"
                        name="amount"
                        type="number"
                        value={formData.amount}
                        onChange={handleChange}
                        fullWidth
                        required
                        size="small"
                    />
                    <TextField
                        label="Currency"
                        name="currency"
                        value={formData.currency}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                    />

                {formData.pricingType === "subscription" && (
                    <>
                            <TextField
                                select
                                label="Interval"
                                name="interval"
                                value={formData.interval}
                                onChange={handleChange}
                                fullWidth
                                size="small"
                            >
                                <MenuItem value="day">Day</MenuItem>
                                <MenuItem value="week">Week</MenuItem>
                                <MenuItem value="month">Month</MenuItem>
                                <MenuItem value="year">Year</MenuItem>
                            </TextField>
                            <TextField
                                label="Interval Count"
                                name="intervalCount"
                                type="number"
                                value={formData.intervalCount}
                                onChange={handleChange}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="Credits (Limit)"
                                name="credits"
                                type="number"
                                value={formData.credits}
                                onChange={handleChange}
                                fullWidth
                                size="small"
                                helperText="Limit on number of credits user can use"
                            />
                    </>
                )}

                {formData.pricingType === "pay_as_you_go" && (
                        <TextField
                            label="Credit Pool Size"
                            name="creditPoolSize"
                            type="number"
                            value={formData.creditPoolSize}
                            onChange={handleChange}
                            fullWidth
                            size="small"
                            helperText="Min number of credits user can buy in multiples"
                        />
                )}

                    <Autocomplete
                        multiple
                        options={plansData?.plans || []}
                        getOptionLabel={(option: any) => option.name || ""}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        value={
                            plansData?.plans?.filter((plan: any) =>
                                formData.eligiblePlanIds.includes(plan.id)
                            ) || []
                        }
                        onChange={handlePlanChange}
                        size="small"
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Eligible Plans"
                                placeholder="Search and select plans"
                            />
                        )}
                        renderTags={(value, getTagProps) =>
                            value.map((option: any, index: number) => (
                                <Chip
                                    label={option.name}
                                    {...getTagProps({ index })}
                                />
                            ))
                        }
                    />
            </Stack>
            <Box className="form-modal-buttons">
                <Button  className="add-btn" variant="contained" color="primary" fullWidth type="submit">
                    Save
                </Button>
            </Box>
        </Box>
    );
};

export default AiAddonModal;
