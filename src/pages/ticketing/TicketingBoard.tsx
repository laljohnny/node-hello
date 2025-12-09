import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { CalendarDays, MessageCircleMore, Plus } from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import dayjs from "dayjs";
import RightSideModal from "../../components/RightSideModal";
import TicketForm from "./TicketForm";
import { GET_TICKETING_QUERY } from "../../graphql/queries";
import { UPDATE_TICKET_MUTATION, CREATE_TICKET_MUTATION } from "../../graphql/mutations";
import { useAuth } from "../../context/AuthContext";
import { showToast } from "../../components/toastService";

export type TicketStatus = "open" | "in_progress" | "waiting_on_customer" | "waiting_on_team" | "resolved" | "closed";

export type TicketPriority = "low" | "medium" | "high" | "critical";

export type TicketCategory = "technical" | "billing" | "feature_request" | "bug_report" | "general_inquiry";

export type Ticket = {
  id: string;
  originalId: string; // Store the original GraphQL ID for mutations
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  requester: string;
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  comments?: number;
  updatedAt?: number; // For sorting by most recent
 };

type TicketsByStatus = Record<TicketStatus, Ticket[]>;

type GraphQLTicket = {
  id: string;
  short_code?: string;
  parent_ticket?: string;
  company_id?: string;
  created_by?: string;
  title?: string;
  description?: string;
  priority?: string;
  category?: string;
  sub_category?: string;
  status?: string;
  estimated_time?: number;
  start_date?: string;
  end_date?: string;
  assigned_to?: string;
  assigned_by?: string;
  assigned_at?: string;
  resolved_at?: string;
  closed_at?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
};

type TicketsQueryResponse = {
  tickets: GraphQLTicket[];
};

export type TicketFormState = {
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  requester: string;
  assignee?: string;
  dueDate?: string;
  tags: string[];
  comments?: string;
 };

export type ColumnConfig = {
  id: TicketStatus;
  title: string;
  subtitle: string;
  accent: string;
 };

const columnConfig: ColumnConfig[] = [
  {
    id: "open",
    title: "Open",
    subtitle: "Freshly submitted tickets",
    accent: "gray",
  },
  {
    id: "in_progress",
    title: "In Progress",
    subtitle: "Active work underway",
    accent: "blue",
  },
  {
    id: "waiting_on_customer",
    title: "Waiting on Customer",
    subtitle: "Awaiting customer response",
    accent: "purple",
  },
  {
    id: "waiting_on_team",
    title: "Waiting on Team",
    subtitle: "Awaiting team response",
    accent: "purple",
  },
  {
    id: "resolved",
    title: "Resolved",
    subtitle: "Tickets that have been resolved",
    accent: "orange",
  },
  {
    id: "closed",
    title: "Closed",
    subtitle: "Tickets that have been closed",
    accent: "green",
  },
 ];

const accentColorMap: Record<
  ColumnConfig["accent"],
  "default" | "primary" | "secondary" | "success" | "warning"
> = {
  gray: "default",
  purple: "secondary",
  blue: "primary",
  orange: "warning",
  green: "success",
};

// Transform GraphQL ticket data to Ticket type
const transformGraphQLTicket = (ticket: GraphQLTicket): Ticket => {
  // Map status from GraphQL to TicketStatus
  const mapStatus = (status: string | undefined): TicketStatus => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower === "open" || statusLower === "new") return "open";
    if (statusLower === "in_progress" || statusLower === "inprogress") return "in_progress";
    if (statusLower === "waiting_on_customer") return "waiting_on_customer";
    if (statusLower === "waiting_on_team") return "waiting_on_team";
    if (statusLower === "resolved") return "resolved";
    if (statusLower === "closed") return "closed";
    return "open"; // default
  };

  // Map priority from GraphQL to TicketPriority
  const mapPriority = (priority: string | undefined): TicketPriority => {
    const priorityLower = priority?.toLowerCase() || "";
    if (priorityLower === "critical") return "critical";
    if (priorityLower === "high") return "high";
    if (priorityLower === "medium") return "medium";
    if (priorityLower === "low") return "low";
    return "medium"; // default
  };

  // Build tags from category and sub_category
  const tags: string[] = [];
  if (ticket.category) tags.push(ticket.category);
  if (ticket.sub_category) tags.push(ticket.sub_category);

  // Get requester name (from created_by)
  const requesterName = ticket.created_by 
    ? `User ${ticket.created_by}` 
    : "Unknown";

  // Get assignee name (assigned_to is just an ID, not an object)
  // We'll display the ID for now, or could fetch user details separately
  const assigneeName = ticket.assigned_to || undefined;

  // Store the original ID for mutations
  const originalId = ticket.id;
  
  // Format ticket ID for display (use short_code if available, otherwise format from id)
  const ticketId = ticket.short_code 
    ? ticket.short_code
    : ticket.id?.startsWith("TCK-") 
    ? ticket.id 
    : `TCK-${ticket.id?.slice(-3) || "000"}`;

  // Parse dates for sorting (convert to timestamp)
  const parseDate = (dateStr: string | undefined): number => {
    if (!dateStr) return 0;
    // Handle both timestamp strings and ISO date strings
    const timestamp = /^\d+$/.test(dateStr) ? parseInt(dateStr, 10) : dateStr;
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  };

  // Use end_date as dueDate if available - format as YYYY-MM-DD for DatePicker
  // Handle timestamp strings (e.g., "1765218600000") and ISO date strings
  const dueDate = ticket.end_date 
    ? (() => {
        // Check if it's a timestamp string (all digits)
        const timestamp = /^\d+$/.test(ticket.end_date) 
          ? parseInt(ticket.end_date, 10) 
          : ticket.end_date;
        return dayjs(timestamp).format("YYYY-MM-DD");
      })()
    : undefined;

  return {
    id: ticketId,
    originalId: originalId, // Keep original ID for GraphQL mutations
    title: ticket.title || "Untitled Ticket",
    description: ticket.description || "",
    status: mapStatus(ticket.status),
    priority: mapPriority(ticket.priority),
    requester: requesterName,
    assignee: assigneeName,
    dueDate: dueDate,
    tags: tags.length > 0 ? tags : undefined,
    comments: 0, // GraphQL doesn't have comments count
    updatedAt: parseDate(ticket.updated_at) || parseDate(ticket.created_at) || 0, // For sorting by most recent
  };
};

const priorityOptions: TicketPriority[] = ["low", "medium", "high", "critical"];

const categoryOptions: TicketCategory[] = ["technical", "billing", "feature_request", "bug_report", "general_inquiry"];

const priorityRanking: Record<TicketPriority, number> = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
 };

const sortTickets = (tickets: Ticket[]) =>
  [...tickets].sort((a, b) => {
    // Sort by most recently updated/created first
    const updatedAtA = a.updatedAt || 0;
    const updatedAtB = b.updatedAt || 0;
    if (updatedAtA !== updatedAtB) {
      return updatedAtB - updatedAtA; // Newest first
    }
    // Then by priority
    const priorityDelta =
      priorityRanking[a.priority] - priorityRanking[b.priority];
    if (priorityDelta !== 0) {
      return priorityDelta;
    }
    return a.title.localeCompare(b.title);
  });

const getNextTicketId = (tickets: TicketsByStatus) => {
  const allTickets = Object.values(tickets).flat();
  const highestNumber = allTickets.reduce((acc, ticket) => {
    const match = ticket.id.match(/(\d+)$/);
    if (!match) return acc;
    const num = parseInt(match[1], 10);
    return Number.isNaN(num) ? acc : Math.max(acc, num);
  }, 100);
  const nextNumber = String(highestNumber + 1).padStart(3, "0");
  return `TCK-${nextNumber}`;
 };

export const emptyFormState: TicketFormState = {
  title: "",
  description: "",
  status: "open",
  priority: "medium",
  category: "general_inquiry",
  requester: "",
  assignee: "",
  dueDate: "",
  tags: [],
  comments: "",
 };

const buildTicketMap = (tickets: Ticket[]): TicketsByStatus => {
  return columnConfig.reduce((acc, column) => {
    acc[column.id] = sortTickets(
      tickets.filter((ticket) => ticket.status === column.id)
    );
    return acc;
  }, {} as TicketsByStatus);
 };

const TicketPriorityTag = ({ priority }: { priority: TicketPriority }) => {
  const normalizedPriority = priority.toLowerCase();
  const displayPriority = priority.charAt(0).toUpperCase() + priority.slice(1);

  return (
    <span
      className={`ticket-priority ticket-priority--${normalizedPriority}`}
      data-priority={priority}
    >
      {displayPriority}
    </span>
  );
};

const TicketCard = ({
  ticket,
  index,
  onEdit,
 }: {
  ticket: Ticket;
  index: number;
  onEdit: (ticket: Ticket) => void;
 }) => {
  const theme = useTheme();
  const isUnassigned = !ticket.assignee;
  const displayName = ticket.assignee || "Not Assigned";
  const avatarLetter = ticket.assignee ? ticket.assignee.charAt(0).toUpperCase() : "?";

  return (
    <Draggable draggableId={ticket.id} index={index}>
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          elevation={0}
          className={`ticket-card${
            snapshot.isDragging ? " ticket-card--dragging" : ""
          }`}
          sx={{
            backgroundColor:
              theme.palette.mode === "light"
                ? theme.palette.background.paper
                : theme.palette.background.default,
          }}
          role="button"
          tabIndex={0}
          onClick={() => {
            if (!snapshot.isDragging) {
              onEdit(ticket);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onEdit(ticket);
            }
          }}
        >
          <Stack className="ticket-card__content">
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              className="ticket-card__header"
            >
              <Typography variant="body2" className="ticket-card__id">
                {ticket.id}
              </Typography>
              <TicketPriorityTag priority={ticket.priority} />
            </Stack>
            <Typography
              fontWeight={700}
              variant="subtitle2"
              className="ticket-card__title"
            >
              {ticket.title}
            </Typography>
            <Typography  variant="body2" className="ticket-card__description mb-2">
              {ticket.description}
            </Typography>
            {ticket.tags && ticket.tags.length > 0 ? (
              <Stack direction="row" flexWrap="wrap">
                {ticket.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    className="me-1"
                    sx={{fontSize: '12px', backgroundColor: '#eff5ff', color: '#6b7280'}}
                  />
                ))}
              </Stack>
            ) : null}
            <Stack  className="ticket-card__details d-flex justify-content-between align-items-center" sx={{borderTop: '1px solid #EFEFEF', paddingTop: '8px', marginTop: '8px'}}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                className="ticket-card__assignee"
              >
                <Tooltip
                  title={displayName}
                >
                  <Box
                    className={`ticket-card__avatar${
                      isUnassigned ? " ticket-card__avatar--unassigned" : ""
                    }`}
                    aria-label={
                      ticket.assignee
                        ? `Assigned to ${ticket.assignee}`
                        : "Not Assigned"
                    }
                  >
                    {avatarLetter}
                  </Box>
                </Tooltip>
               
              </Stack>
              
              <div className="d-flex align-items-center">
              {ticket.dueDate && (
                <Stack
                  direction="row"
                  alignItems="center"
                  className="ticket-card__stat  me-2"
                  sx={{borderRight: '2px solid #EFEFEF', paddingRight: '8px'}}
                >
                  <CalendarDays  size={14} color="var(--text-color)" />
                  <Typography className="ms-1" variant="body2" color="var(--text-color)" sx={{fontSize: '12px'}}>
                    Due {dayjs(ticket.dueDate).format("MMM DD, YYYY")}
                  </Typography>
                </Stack>
              )}
            
                <Stack
                  direction="row"
                  alignItems="center"
                  className="ticket-card__stat"
                >
                  <MessageCircleMore size={14} color="var(--text-color)" />
                  <Typography className="ms-1" variant="body2" color="var(--text-color)" sx={{fontSize: '12px'}}>
                    {ticket?.comments ?? 0}
                    {/* {ticket.comments > 1 ? "s" : ""} */}
                  </Typography>
                </Stack>
              </div>
            
            </Stack>
            
          </Stack>
        </Paper>
      )}
    </Draggable>
  );
 };

const TicketColumn = ({
  column,
  tickets,
  onEditTicket,
 }: {
  column: ColumnConfig;
  tickets: Ticket[];
  onEditTicket: (ticket: Ticket) => void;
 }) => {
  const theme = useTheme();
  const borderColor = theme.palette.divider;
  const accentColor = accentColorMap[column.accent] ?? "default";

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor:
          theme.palette.mode === "light"
            ? theme.palette.background.default
            : theme.palette.background.paper,
        borderRadius: '16px',
        border: "1px solid #EFEFEF",
        minWidth: 280,
        // maxWidth: 320,
        width: '100%',
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Box
        sx={{
          padding: '12px 12px 4px',
          // borderBottom: "1px solid",
          // borderColor,
        }}
      >
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {column.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{fontSize: '10px'}}>
              {column.subtitle}
            </Typography>
          </Box>
          {/* <Chip color={accentColor} label={tickets.length} size="small" /> */}
          <Chip color='primary' sx={{fontSize: '10px',fontWeight: 700,minWidth: '24px'}} label={tickets.length} size="small" />
        </Stack>
      </Box>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <Stack
            ref={provided.innerRef}
            {...provided.droppableProps}
            spacing={1.5}
            sx={{
              padding: '12px',
              flex: 1,
              overflowY: "auto",
              minHeight: 160,
              bgcolor: snapshot.isDraggingOver
                ? theme.palette.action.hover
                : "transparent",
              transition: "background-color 0.2s ease",
            }}
          >
            {tickets.map((ticket, index) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                index={index}
                onEdit={onEditTicket}
              />
            ))}
            {provided.placeholder}
          </Stack>
        )}
      </Droppable>
    </Paper>
  );
 };

const TicketingBoard = () => {
  const { user } = useAuth();
  
  // Fetch tickets from GraphQL
  const { data: ticketsData, loading: ticketsLoading, refetch: refetchTickets } = useQuery<TicketsQueryResponse>(GET_TICKETING_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  // Store original GraphQL tickets for mutation mapping
  const originalTickets = useMemo(() => {
    if (!ticketsData?.tickets) return new Map<string, GraphQLTicket>();
    const map = new Map<string, GraphQLTicket>();
    ticketsData.tickets.forEach((ticket) => {
      map.set(ticket.id, ticket);
    });
    return map;
  }, [ticketsData]);

  // Transform GraphQL tickets to Ticket type
  const tickets = useMemo(() => {
    if (!ticketsData?.tickets) return [];
    return ticketsData.tickets.map(transformGraphQLTicket);
  }, [ticketsData]);

  // Local state for optimistic updates (for instant drag-and-drop feedback)
  const [localTicketsByStatus, setLocalTicketsByStatus] = useState<TicketsByStatus | null>(null);

  // Server-based tickets map
  const serverTicketsByStatus = useMemo(() => {
    return buildTicketMap(tickets);
  }, [tickets]);

  // Build tickets map by status (use local state if available for optimistic updates)
  const ticketsByStatus = localTicketsByStatus || serverTicketsByStatus;

  // Mutations
  const [updateTicketMutation] = useMutation(UPDATE_TICKET_MUTATION);

  const [createTicketMutation] = useMutation(CREATE_TICKET_MUTATION, {
    refetchQueries: [{ query: GET_TICKETING_QUERY }],
    awaitRefetchQueries: true,
  });

  const [ticketBeingEdited, setTicketBeingEdited] = useState<Ticket | null>(
    null
  );
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleModalClose = useCallback(() => {
    setTicketBeingEdited(null);
    setIsFormOpen(false);
  }, []);

  const handleAddTicketClick = useCallback(() => {
    setTicketBeingEdited(null);
    setIsFormOpen(true);
  }, []);

  const handleEditTicket = useCallback((ticket: Ticket) => {
    setTicketBeingEdited(ticket);
    setIsFormOpen(true);
  }, []);

  const totals = useMemo(() => {
    return columnConfig.map((column) => ({
      id: column.id,
      count: ticketsByStatus[column.id]?.length ?? 0,
      title: column.title,
      accent: column.accent,
    }));
  }, [ticketsByStatus]);

  const tagOptions = useMemo(() => {
    const tagsSet = new Set<string>();
    Object.values(ticketsByStatus).forEach((ticketList) => {
      ticketList.forEach((ticket) => {
        ticket.tags?.forEach((tag) => tagsSet.add(tag));
      });
    });
    return Array.from(tagsSet).sort((a, b) => a.localeCompare(b));
  }, [ticketsByStatus]);

const formInitialValues = useMemo<TicketFormState>(() => {
  if (!ticketBeingEdited) {
    return { ...emptyFormState };
  }

  // Use originalId directly to find the original ticket
  const originalTicket = originalTickets.get(ticketBeingEdited.originalId);
  // Map assigned_to (snake_case from query) to assigneeId (camelCase for mutation)
  const assigneeId = originalTicket?.assigned_to || "";
  
  // Map category from GraphQL ticket
  const mapCategory = (): TicketCategory => {
    const category = originalTicket?.category?.toLowerCase() || "";
    if (category === "technical") return "technical";
    if (category === "billing") return "billing";
    if (category === "feature_request") return "feature_request";
    if (category === "bug_report") return "bug_report";
    if (category === "general_inquiry") return "general_inquiry";
    return "general_inquiry"; // default value
  };

  return {
    title: ticketBeingEdited.title,
    description: ticketBeingEdited.description,
    status: ticketBeingEdited.status,
    priority: ticketBeingEdited.priority,
    category: mapCategory(),
    requester: ticketBeingEdited.requester,
    assignee: assigneeId,
    dueDate: ticketBeingEdited.dueDate ?? "",
    tags: ticketBeingEdited.tags ? [...ticketBeingEdited.tags] : [],
    comments: ticketBeingEdited.comments?.toString() ?? "",
  };
}, [ticketBeingEdited, originalTickets]);

  // Helper function to find original ticket by UI ticket ID
  const findOriginalTicket = (uiTicketId: string): GraphQLTicket | undefined => {
    // Try direct lookup first
    let originalTicket = originalTickets.get(uiTicketId);
    if (originalTicket) return originalTicket;

    // Try without TCK- prefix
    const idWithoutPrefix = uiTicketId.replace(/^TCK-/, "");
    originalTicket = originalTickets.get(idWithoutPrefix);
    if (originalTicket) return originalTicket;

    // Try with TCK- prefix
    const idWithPrefix = uiTicketId.startsWith("TCK-") ? uiTicketId : `TCK-${uiTicketId}`;
    originalTicket = originalTickets.get(idWithPrefix);
    if (originalTicket) return originalTicket;

    // Try to find by matching the last part of the ID
    let foundTicket: GraphQLTicket | undefined;
    originalTickets.forEach((ticket, key) => {
      if (key.endsWith(idWithoutPrefix) || key === idWithoutPrefix) {
        foundTicket = ticket;
      }
    });

    return foundTicket;
  };

  // Map UI status to GraphQL status format
  const mapStatusToGraphQL = (status: TicketStatus): string => {
    // GraphQL expects lowercase enum values
    return status.toLowerCase();
  };

  // Map UI priority to GraphQL priority format
  const mapPriorityToGraphQL = (priority: TicketPriority): string => {
    // GraphQL expects lowercase enum values
    return priority.toLowerCase();
  };

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStatus = source.droppableId as TicketStatus;
    const destinationStatus = destination.droppableId as TicketStatus;

    const sourceTickets = Array.from(ticketsByStatus[sourceStatus]);
    const movedTicket = sourceTickets[source.index];

    if (!movedTicket) {
      return;
    }

    // Use the originalId stored in the ticket for direct lookup
    const originalTicket = originalTickets.get(movedTicket.originalId);
    
    if (!originalTicket) {
      console.error("Original ticket data not found for:", movedTicket.originalId);
      showToast({ status: "error", title: "Failed to find ticket data." });
      return;
    }

    // OPTIMISTIC UPDATE: Update local state immediately for instant feedback
    const updatedTicket = { ...movedTicket, status: destinationStatus };
    
    // Create new state based on current state (local or server)
    const currentState = localTicketsByStatus || serverTicketsByStatus;
    const newTicketsByStatus: TicketsByStatus = {
      open: [...currentState.open],
      in_progress: [...currentState.in_progress],
      waiting_on_customer: [...currentState.waiting_on_customer],
      waiting_on_team: [...currentState.waiting_on_team],
      resolved: [...currentState.resolved],
      closed: [...currentState.closed],
    };
    
    // Remove from source column
    newTicketsByStatus[sourceStatus] = newTicketsByStatus[sourceStatus].filter(
      (t) => t.id !== movedTicket.id
    );
    
    // Add to destination column at the correct position
    newTicketsByStatus[destinationStatus].splice(destination.index, 0, updatedTicket);
    
    // Apply optimistic update immediately
    setLocalTicketsByStatus(newTicketsByStatus);

    // Make API call in background (don't await)
    updateTicketMutation({
      variables: {
        input: {
          id: movedTicket.originalId,
          status: mapStatusToGraphQL(destinationStatus),
          assigned_to: originalTicket.assigned_to || null, // Map snake_case to camelCase for mutation
        },
      },
    })
      .then(async () => {
        // Refetch first, then clear local state to prevent data vanishing
        await refetchTickets();
        setLocalTicketsByStatus(null);
        showToast({ status: "success", title: "Ticket status updated." });
      })
      .catch((error) => {
        console.error("Failed to update ticket status:", error);
        // Revert optimistic update on error - go back to server state
        setLocalTicketsByStatus(null);
        showToast({ status: "error", title: "Failed to update ticket status. Please try again." });
      });
  }, [localTicketsByStatus, serverTicketsByStatus, originalTickets, updateTicketMutation, refetchTickets]);

  const handleFormSubmit = useCallback(
    async (values: TicketFormState) => {
      const title = values.title.trim();
      // const requester = (values.requester ?? "").trim(); // Commented out
      const description = (values.description ?? "").trim();
      const assigneeValue = (values.assignee ?? "").trim(); // This is now a user ID
      const dueDateValue = (values.dueDate ?? "").trim();
      const categoryValue = values.category; // Use category from form

      // Tags are commented out - set subCategory to null
      // const trimmedTags = values.tags
      //   .map((tag) => tag.trim())
      //   .filter((tag) => Boolean(tag));
      // const subCategory = trimmedTags.length > 1 ? trimmedTags[1] : null;
      const subCategory = null;

      if (!title) {
        showToast({ status: "error", title: "Title is required." });
        return;
      }

      try {
        if (ticketBeingEdited) {
          // Update existing ticket using originalId directly
          const assignedToId = assigneeValue || null;
          const endDateISO = dueDateValue ? dayjs(dueDateValue).toISOString() : null;
          await updateTicketMutation({
            variables: {
              input: {
                id: ticketBeingEdited.originalId, // Use originalId directly
                title,
                description: description || null,
                status: mapStatusToGraphQL(values.status),
                priority: mapPriorityToGraphQL(values.priority),
                category: categoryValue || null,
                sub_category: subCategory || null,
                assigned_to: assignedToId,
                end_date: endDateISO,
              },
            },
          });

          // Refetch to get updated assignee details
          await refetchTickets();

          showToast({ status: "success", title: "Ticket updated." });
        } else {
          // Create new ticket
          // Convert dueDate to ISO format for end_date, use same for start_date if provided
          const endDateISO = dueDateValue ? new Date(dueDateValue).toISOString() : null;
          const startDateISO = dueDateValue ? new Date().toISOString() : null;
          
          await createTicketMutation({
            variables: {
              input: {
                title,
                description: description || null,
                priority: mapPriorityToGraphQL(values.priority),
                category: categoryValue || null,
                sub_category: subCategory || null,
                assigned_to: assigneeValue || null,
                estimated_time: null,
                start_date: startDateISO,
                end_date: endDateISO,
              },
            },
          });

          showToast({ status: "success", title: "Ticket created." });
        }
        
        handleModalClose();
      } catch (error: any) {
        console.error("Failed to save ticket:", error);
        const errorMessage = error?.graphQLErrors?.[0]?.message || error?.message || "Failed to save ticket. Please try again.";
        showToast({ status: "error", title: errorMessage });
      }
    },
    [handleModalClose, ticketBeingEdited, originalTickets, updateTicketMutation, createTicketMutation, user]
  );

  return (
    <>
      <Stack >
        <Stack
          direction={{ xs: "column", md: "row" }}
         className="mb-2"
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h2" fontWeight={700}>
              Ticket Flow Overview
            </Typography>
            {/* <Typography variant="body2" color="text.secondary" mt={0.5}>
              Drag, drop, and update tickets to keep facilities work coordinated.
            </Typography> */}
          </Box>
          {/* <Button
            variant="contained"
            color="primary"
            sx={{
              alignSelf: { xs: "flex-start", md: "auto" },
            }}
            onClick={handleAddTicketClick}
          >
            Add Ticket
          </Button> */}

          <Button
              className="add-btn"
              variant="contained"
              color="secondary"
              size="small"
              startIcon={<Plus size={16}/>}
              onClick={handleAddTicketClick}
            >
               Add Ticket
            </Button>
        </Stack>

        {/* <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
          {totals.map((column) => (
            <Chip
              key={column.id}
              color={accentColorMap[column.accent] ?? "default"}
              label={
                <Typography variant="body2" fontWeight={500}>
                  {column.title}: {column.count}
                </Typography>
              }
              sx={{ mr: 1, mb: 1 }}
            />
          ))}
        </Stack> */}

        <DragDropContext onDragEnd={handleDragEnd}>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ overflowX: "auto", pb: 1 }}
          >
            {columnConfig.map((column) => (
              <TicketColumn
                key={column.id}
                column={column}
                tickets={ticketsByStatus[column.id] || []}
                onEditTicket={handleEditTicket}
              />
            ))}
          </Stack>
        </DragDropContext>
      </Stack>

      <RightSideModal
        isOpen={isFormOpen}
        onClose={handleModalClose}
        title={ticketBeingEdited ? "Edit Ticket" : "Create Ticket"}
      >
        <TicketForm
          key={`ticket-form-${isFormOpen ? (ticketBeingEdited?.id || 'new') : 'closed'}`}
          mode={ticketBeingEdited ? "edit" : "create"}
          initialValues={formInitialValues}
          statusOptions={columnConfig}
          priorityOptions={priorityOptions}
          categoryOptions={categoryOptions}
          tagOptions={tagOptions}
          onSubmit={handleFormSubmit}
          onCancel={handleModalClose}
        />
      </RightSideModal>

    </>
  );
 };

 export default TicketingBoard;
