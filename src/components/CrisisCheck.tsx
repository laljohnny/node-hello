import React, { useState } from "react";
import {
  Box,
  Flex,
  Text,
  SimpleGrid,
  Tabs,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Card,
  CardBody,
  CardHeader,
  Heading,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Image
} from "@chakra-ui/react";
import { AddIcon, EditIcon, ExternalLinkIcon, HamburgerIcon, InfoIcon, RepeatIcon, WarningIcon, WarningTwoIcon } from "@chakra-ui/icons";
import CenterModal from "./CenterModal";


type CrisisSummary = {
  total_active_alerts: number;
  emergency_count: number;
  critical_count: number;
  security_count: number;
  system_failure_count: number;
};

type CrisisPanel = {
  panel_id: string;
  title: string;
  priority: number;
  refresh_interval_seconds: number;
  data: {
    summary: CrisisSummary;
    alerts: any[];
    emergency_readiness: any;
  };
};

type CrisisCheckProps = {
  panel: CrisisPanel;
};

const CrisisCheck: React.FC<CrisisCheckProps> = ({ panel }) => {
  const { summary, alerts } = panel.data;
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [filterAlertsData, setFilterAlertsData] = useState<any[]>(panel.data.alerts || []);
  
  const getIcon = (type: string) => {
    switch (type) {
      case "EMERGENCY":
        return <WarningIcon color="red.400" boxSize={5} />;
      case "SECURITY":
        return <WarningTwoIcon color="orange.400" boxSize={5} />;
      case "CRITICAL":
        return <InfoIcon color="blue.400" boxSize={5} />;
      default:
        return null;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case "EMERGENCY":
        return "red.50";
      case "CRITICAL":
        return "blue.50";
      case "SECURITY":
        return "orange.50";
      case "SYSTEM_FAILURE":
        return "yellow.50";
      default:
        return "white";
    }
  };

  const getBorders = (type: string) => {
    switch (type) {
      case "EMERGENCY":
        return "red.400";
      case "CRITICAL":
        return "blue.400";
      case "SECURITY":
        return "orange.400";
        case "SYSTEM_FAILURE":
          return "yellow.400";
      default:
        return "gray.200";
    }
  };
  console.log(alerts)
  // const filterAlerts = (type?: string) =>
   
  //   type ? alerts.filter((a: any) => a.alert_type === type) : alerts;

  const filterAlerts = (type?: string) => {
    const filterAlerts = (type?: string) =>type ? alerts.filter((a: any) => a.alert_type === type) : alerts;
    setFilterAlertsData(filterAlerts(type));
  }

  const renderAlerts = (data: any) => {
    
    // const mapped = data;

    return data?.length ? (
      <SimpleGrid columns={1} spacing={4}>
        {data?.map((alert: any, index: number) => (
          <Flex
            key={index}
            align="center"
            gap={3}
            p={3}
            border="1px solid"
            borderColor={getBorders(alert.alert_type)}
            bg={getBg(alert.alert_type)}
            borderRadius={8}
            cursor="pointer"
            onClick={() => {
              setIsOpen(true);
              setSelectedItem(data[index]);
            }}
          >
            <Box>{getIcon(alert.alert_type)}</Box>
            <Box flex="1">
              <Heading size="md" fontWeight={700}>
                {alert.title}
              </Heading>
              <Heading size="sm" mt={1}>
                {alert.description}
              </Heading>
            </Box>
            <Text fontSize="sm">{alert.time}</Text>
          </Flex>
        ))}
      </SimpleGrid>
    ) : (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100%"
      >
        <Text>No alerts found.</Text>
      </Box>
    );
  };

  return (
    <>
      <Card
        boxShadow="none"
        border="1px solid"
        borderColor="gray.200"
        height={"100%"}>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Box
              display="flex"
              alignItems="center"
              gap="2"
              >
           <Box
                as="span"
                className="material-symbols-outlined"
                fontSize="20px"
                color="#1e3a8a"
                bg="#e7ecff"
                p={2}
                borderRadius="full"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="sm"
              >
                notifications_active
              </Box>
            <Heading size="md" color="#1e3a8a">{panel.title}</Heading>
            </Box>
          <Menu>
            <MenuButton
              as={IconButton}
              size='sm'
              borderColor='#1e3a8a'
              color='#1e3a8a'
              aria-label='Options'
              icon={<Box as="span" className="material-symbols-outlined" fontSize="22px">
                filter_list
              </Box>}
              variant='outline'
            />
            <MenuList className="alerts-menu">
              <MenuItem fontSize="sm" onClick={()=>filterAlerts('')}>
              <Flex w="100%" justify="space-between" align="center">
                <span>Total Active Alerts</span>
                <span className="badge">{summary.total_active_alerts}</span>
              </Flex>
              </MenuItem>
              <MenuItem fontSize="sm" onClick={()=>filterAlerts('EMERGENCY')}>
              <Flex className="emergency-alert " w="100%" justify="space-between" align="center"><span>Emergency Alerts</span><span className="badge">{summary.emergency_count}</span></Flex></MenuItem>
              <MenuItem fontSize="sm" onClick={()=>filterAlerts('CRITICAL')}>
              <Flex className="critical-alert" w="100%" justify="space-between" align="center"><span>Critical Alerts</span> <span className="badge">{summary.critical_count}</span></Flex>
              </MenuItem>
              <MenuItem fontSize="sm" onClick={()=>filterAlerts('SECURITY')}>
              <Flex className="security-alert" w="100%" justify="space-between" align="center"><span>Security Alerts</span> <span className="badge">{summary.security_count}</span></Flex></MenuItem>
              <MenuItem fontSize="sm" onClick={()=>filterAlerts('SYSTEM_FAILURE')}>
              <Flex className="system-alert" w="100%" justify="space-between" align="center"><span>System Failure Alerts</span> <span className="badge">{summary.system_failure_count}</span></Flex></MenuItem>
            </MenuList>
          </Menu>
          </Flex>
        </CardHeader>
        <CardBody>
          {renderAlerts(filterAlertsData)}

        </CardBody>
      </Card>

      {/* Modal for Alert Details */}
      <CenterModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={selectedItem?.title || "Alert Details"}
      >

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Box>
          <Text size='sm' mb={1}>Description</Text>
          <Text size="md" fontWeight={'700'}>{selectedItem?.description}</Text>
        </Box>
        <Box>
          <Text size='sm' mb={1}>Time</Text>
          <Text size="md" fontWeight={'700'}>{selectedItem?.time || 'N/A'}</Text>
        </Box>
        <Box>
          <Text size='sm' mb={1}>Property</Text>
          <Text size="md" fontWeight={'700'}>{selectedItem?.property_name || selectedItem?.property_id}</Text>
        </Box>
        <Box>
          <Text size='sm' mb={1}> Affected Areas</Text>
          <Text size="md" fontWeight={'700'}>{selectedItem?.affected_areas?.join(", ")}</Text>
        </Box>

        <Box>
          <Text size='sm' mb={1}>  Estimated Impact</Text>
          <Text size="md" fontWeight={'700'}>{selectedItem?.estimated_impact}</Text>
        </Box>
        <Box>
          <Text size='sm' mb={1}>  Assigned To</Text>
          <Text size="md" fontWeight={'700'}>{selectedItem?.assigned_to}</Text>
        </Box>
        <Box>
          <Text size='sm' mb={1}>  ETA Resolution</Text>
          <Text size="md" fontWeight={'700'}>{selectedItem?.eta_resolution}</Text>
        </Box>
        <Box>
          <Text size='sm' mb={1}>  Action Required</Text>
          <Text size="md" fontWeight={'700'}>{selectedItem?.action_required}</Text>
        </Box>
        {selectedItem?.contact_info &&(
          <Box>
          <Text size='sm' mb={1}> Vendor Contact</Text>
          <Text size="md" fontWeight={'700'}>{selectedItem.contact_info.vendor} -{" "}
                  {selectedItem.contact_info.phone}{" "}
                  {selectedItem.contact_info.technician
                    ? `(Technician: ${selectedItem.contact_info.technician})`
                    : ""}</Text>
        </Box>
        )}
        <Box>
          <Text size='sm' mb={1}>  Urgency Indicator</Text>
          <Text size="md" fontWeight={'700'}>{selectedItem?.urgency_indicator}</Text>
        </Box>
      </SimpleGrid>

      
      </CenterModal>
    </>
  );
};

export default CrisisCheck;
