import { useEffect, useState } from "react";
import {
  Box,
  Spinner,
  Text,
  VStack,
  Heading,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
} from "@chakra-ui/react";
import { bffApi } from "../../components/api";
import SustainabilityESGAccordion from "./excutive-dashboard-components/SustainabilityESGAccordion";
import OperationalEfficiencyPanel from "./excutive-dashboard-components/OperationalEfficiencyPanel";
import AIDrivenStrategicInsightsPanel from "./excutive-dashboard-components/AIDrivenStrategicInsightsPanel";
import StrategicKPIPerformancePanel from "./excutive-dashboard-components/StrategicKPIPerformancePanel";
import FinancialHealth from "./excutive-dashboard-components/FinancialHealth";

type Executive = {
  id: number;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  [key: string]: any; // if there are extra fields
};

const ExecutiveDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await bffApi.get("executive_team_json_payloads.json");
        setDashboardData(res?.data?.executive_dashboard);
      } catch (error: any) {
        console.log(error.message);
      }
    })();
  }, []);


  return (
    <Box>
        {dashboardData.length !== 0 && (
        <>
            <FinancialHealth data={dashboardData.panel_1_financial_health}/>
        <SimpleGrid columns={[1, 2]} spacing={3} mt={2}>
            <StrategicKPIPerformancePanel data={dashboardData.panel_2_strategic_kpis}/>
            <AIDrivenStrategicInsightsPanel data={dashboardData.panel_3_ai_insights}/>
            <OperationalEfficiencyPanel data={dashboardData.panel_4_operational_efficiency}/>
            <SustainabilityESGAccordion data={dashboardData.panel_5_sustainability_esg} />
        </SimpleGrid>
        </>
    )}
      

    </Box>
  );
};

export default ExecutiveDashboard;
