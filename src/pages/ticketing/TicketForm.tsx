import React, { useEffect, useMemo } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";
import { useQuery } from "@apollo/client/react";
import { COMPANY_USERS_QUERY } from "../../graphql/queries";
import { useAuth } from "../../context/AuthContext";
import type {
  ColumnConfig,
  TicketFormState,
  TicketPriority,
  TicketCategory,
} from "./TicketingBoard";

type TicketFormProps = {
  mode: "create" | "edit";
  initialValues: TicketFormState;
  statusOptions: ColumnConfig[];
  priorityOptions: TicketPriority[];
  categoryOptions: TicketCategory[];
  tagOptions: string[];
  onSubmit: (values: TicketFormState) => void;
  onCancel: () => void;
};

type User = {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  role?: string;
};

type CompanyUsersResponse = {
  companyUsers: User[];
};

const TicketForm: React.FC<TicketFormProps> = ({
  mode,
  initialValues,
  statusOptions,
  priorityOptions,
  categoryOptions,
  tagOptions,
  onSubmit,
  onCancel,
}) => {
  const { user: loggedInUser } = useAuth();
  
  // Fetch company users for assignee dropdown
  const { data: usersData, loading: usersLoading } = useQuery<CompanyUsersResponse>(COMPANY_USERS_QUERY);

  // Transform users to options for dropdown
  const assigneeOptions = useMemo(() => {
    if (!usersData?.companyUsers) return [];
    
    // Filter users based on logged-in user's role (client-side filtering)
    const loggedInUserRole = loggedInUser?.role || null;
    let filteredUsers = usersData.companyUsers;
    
    if (loggedInUserRole && !loggedInUserRole.toUpperCase().includes("SUPER")) {
      // Partner admin users see only partner admin related roles
      filteredUsers = usersData.companyUsers.filter((user) => {
        const userRole = user.role?.toUpperCase() || "";
        return userRole.includes("PARTNER");
      });
    }
    // Super admin users see all users (no filtering needed)
    
    return filteredUsers.map((user) => ({
      id: user.id,
      label: user.displayName || 
             `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
             user.email ||
             "Unknown User",
    }));
  }, [usersData, loggedInUser]);

  const validationSchema = useMemo(
    () =>
      yup.object({
        title: yup.string().trim().required("Title is required"),
        description: yup.string().trim(),
        status: mode === "edit" 
          ? yup
              .mixed<ColumnConfig["id"]>()
              .oneOf(statusOptions.map((option) => option.id))
              .required("Status is required")
          : yup
              .mixed<ColumnConfig["id"]>()
              .oneOf(statusOptions.map((option) => option.id))
              .optional(),
        priority: yup
          .mixed<TicketPriority>()
          .oneOf(priorityOptions)
          .required("Priority is required"),
        category: yup
          .mixed<TicketCategory>()
          .oneOf(categoryOptions)
          .required("Category is required"),
        // requester: yup.string().trim().required("Requester is required"),
        assignee: yup.string().trim().required("Assignee is required"),
        dueDate: yup.string().trim(),
        // tags: yup.array().of(yup.string().trim()),
        comments: yup.string().trim(),
      }),
    [priorityOptions, statusOptions, categoryOptions, mode]
  );

  const resolver = useMemo(
    () => yupResolver(validationSchema) as unknown as Resolver<TicketFormState>,
    [validationSchema]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TicketFormState>({
    defaultValues: initialValues,
    resolver,
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const actionLabel = useMemo(
    () => (mode === "edit" ? "Save Changes" : "Create Ticket"),
    [mode]
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        component="form"
        onSubmit={handleSubmit((data) => onSubmit(data))}
       className="modal-form-sec"
        noValidate
      >
        <Stack className="modal-form gap">
          {/* Title */}
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                required
                label="Title"
                placeholder="Give the ticket a clear title"
                fullWidth
                size="small"
                error={Boolean(errors.title)}
                helperText={errors.title?.message}
              />
            )}
          />

          {/* Description */}
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Description"
                placeholder="Add context for the team"
                multiline
                rows={4}
                fullWidth
                error={Boolean(errors.description)}
                helperText={errors.description?.message}
              />
            )}
          />

          {/* Status + Priority */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            {/* Status field - only show in edit mode */}
            {mode === "edit" && (
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    required
                    label="Status"
                    fullWidth
                    error={Boolean(errors.status)}
                    helperText={errors.status?.message}
                  >
                    {statusOptions.map((column) => (
                      <MenuItem key={column.id} value={column.id}>
                        {column.title}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            )}

            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  required
                  label="Priority"
                  fullWidth
                  error={Boolean(errors.priority)}
                  helperText={errors.priority?.message}
                >
                  {priorityOptions.map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Stack>

          {/* Category */}
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                required
                label="Category"
                fullWidth
                error={Boolean(errors.category)}
                helperText={errors.category?.message}
              >
                {categoryOptions.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          {/* Requester + Assignee */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            {/* Requester field commented out */}
            {/* <Controller
              name="requester"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  required
                  label="Requester"
                  placeholder="Who raised this ticket?"
                  fullWidth
                  size="small"
                  error={Boolean(errors.requester)}
                  helperText={errors.requester?.message}
                />
              )}
            /> */}

            <Controller
              name="assignee"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  required
                  label="Assignee"
                  placeholder="Who owns the work?"
                  fullWidth
                  size="small"
                  error={Boolean(errors.assignee)}
                  helperText={errors.assignee?.message}
                  disabled={usersLoading}
                >
                  {assigneeOptions.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Stack>

          {/* Due Date */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Controller
              name="dueDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Due Date"
                  value={field.value ? dayjs(field.value) : null}
                  minDate={dayjs()}
                  onChange={(newValue: Dayjs | null) =>
                    field.onChange(
                      newValue && dayjs(newValue).isValid()
                        ? dayjs(newValue).format("YYYY-MM-DD")
                        : ""
                    )
                  }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    size="small"
                    error={Boolean(errors.dueDate)}
                    helperText={errors.dueDate?.message}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <Box sx={{ "& svg": { fontSize: 16 } }}>
                          {params.InputProps?.endAdornment}
                        </Box>
                      ),
                    }}
                  />
                )}
                />
              )}
            />
          </Stack>

          {/* Tags - commented out */}
          {/* <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <Autocomplete
              className="tag-autocomplete"
                multiple
                freeSolo
                options={tagOptions}
                value={field.value || []}
                onChange={(_event, newValue) => field.onChange(newValue)}
                renderTags={(value: string[], getTagProps) =>
                  value.map((option: string, index: number) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                      size="small"
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tags"
                    placeholder="Add tags"
                    size="small"
                    error={Boolean(errors.tags)}
                    helperText={
                      errors.tags ? "Please provide valid tags." : undefined
                    }
                  />
                )}
              />
            )}
          /> */}
        </Stack>

        {/* Submit */}
        <Stack className="modal-form-buttons" >
          <Button
            className="add-btn"
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            size="small"
            disabled={isSubmitting}
          >
            {actionLabel}
          </Button>
        </Stack>
      </Box>
    </LocalizationProvider>
  );
};

export default TicketForm;
