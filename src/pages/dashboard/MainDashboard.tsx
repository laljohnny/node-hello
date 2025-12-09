import React from "react";
import { useQuery } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
} from "@mui/material";
import {
  Groups as TeamIcon,
  Business as PartnersIcon,
  BusinessCenter as CompanyIcon,
  SupportAgent as TicketingIcon,
} from "@mui/icons-material";
import {
  COMPANY_USERS_QUERY,
  COMPANIES_QUERY,
  GET_TICKETING_QUERY,
} from "../../graphql/queries";
import GreetingBar from "../../components/GreetingBar";
import { useAuth } from "../../context/AuthContext";

interface CompanyUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Company {
  id: string;
  name: string;
  role?: string;
}

interface Ticket {
  id: string;
}

interface CompanyUsersResponse {
  companyUsers: CompanyUser[];
}

interface CompaniesResponse {
  companies: Company[];
}

interface TicketsResponse {
  tickets: Ticket[];
}

interface DashboardCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  count,
  icon,
  onClick,
  loading = false,
}) => {
  return (
    <Card
      sx={{
        height: "100%",
        cursor: "pointer",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 4,
        },
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography
              variant="h6"
              color="text.secondary"
              gutterBottom
              sx={{ fontSize: "0.875rem", fontWeight: 500 }}
            >
              {title}
            </Typography>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "primary.main", mt: 1 }}
              >
                {count}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: "primary.light",
              borderRadius: "50%",
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const MainDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch team members count
  const { data: teamData, loading: teamLoading } = useQuery<CompanyUsersResponse>(COMPANY_USERS_QUERY);
  const teamCount = teamData?.companyUsers?.length || 0;

  // Fetch companies count (includes partners)
  const { data: companiesData, loading: companiesLoading } = useQuery<CompaniesResponse>(COMPANIES_QUERY);
  const allCompanies = companiesData?.companies || [];
  
  // Filter partners from companies (companies with role 'partner')
  const partnersCount = allCompanies.filter(
    (company: Company) => company.role?.toLowerCase() === 'partner'
  ).length;
  
  // Count all companies
  const companiesCount = allCompanies.length;

  // Fetch tickets count
  const { data: ticketsData, loading: ticketsLoading } = useQuery<TicketsResponse>(GET_TICKETING_QUERY);
  const ticketsCount = ticketsData?.tickets?.length || 0;

  // Get user's name for greeting
  const userName = user?.displayname || user?.firstName || user?.email || "User";
  
  // Get company info for buildingInfo
  const userCompany = allCompanies.find((c: Company) => c.id === user?.companyId);
  const buildingInfo = userCompany?.name || "Admin Dashboard";

  const cards = [
    {
      title: "Team",
      count: teamCount,
      icon: <TeamIcon sx={{ fontSize: 40, color: "#fff" }} />,
      path: "/team",
      loading: teamLoading,
    },
    {
      title: "Partners",
      count: partnersCount,
      icon: <PartnersIcon sx={{ fontSize: 40, color: "#fff" }} />,
      path: "/partners",
      loading: companiesLoading,
    },
    {
      title: "Company",
      count: companiesCount,
      icon: <CompanyIcon sx={{ fontSize: 40, color: "#fff" }} />,
      path: "/company",
      loading: companiesLoading,
    },
    {
      title: "Ticketing",
      count: ticketsCount,
      icon: <TicketingIcon sx={{ fontSize: 40, color: "#fff" }} />,
      path: "/ticketing",
      loading: ticketsLoading,
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Greeting Bar */}
      <Box sx={{ mb: 4 }}>
        <GreetingBar
          name={userName}
          buildingInfo={buildingInfo}
          weather="42°F, Clear"
        />
      </Box>

      {/* 4 Cards Section */}
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <DashboardCard
              title={card.title}
              count={card.count}
              icon={card.icon}
              onClick={() => navigate(card.path)}
              loading={card.loading}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MainDashboard;

