import { InfoOutlineIcon } from "@chakra-ui/icons";
import {
  Box,
  Text,
  SimpleGrid,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  Progress,
  Divider,
  CardHeader,
  Card,
  CardBody,
  Flex,
  Heading,
  Image,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList
} from "@chakra-ui/react";
import { useState } from "react";
 
type AssetSummary = {
  total_assets_monitored: number;
  healthy_assets: number;
  warning_assets: number;
  critical_assets: number;
  avg_portfolio_health: number;
  potential_cost_savings: number;
};
 
type Asset = {
  asset_id: string;
  asset_name: string;
  current_status: "CRITICAL" | "WARNING" | "HEALTHY" | string;
  health_score: number;
  efficiency_rating: number;
  performance_trend: "DECLINING" | "IMPROVING" | "STABLE" | string;
  failure_probability: number;
  predicted_failure_date: string;
  predicted_failure_type?: string; // ✅ optional now
  anomaly_detected?: boolean;
  anomaly_description?: string;
  recommended_action?: string;
 
  // Allow extra fields from backend without errors
  [key: string]: any;
};
 
type PortfolioIntelligence = {
  compliance_percentage: number;
  inspections_due_30_days: number;
  predictive_maintenance_opportunities: number;
};
 
type AIInsights = {
  top_recommendation: string;
  cost_optimization: string;
  efficiency_trend: string;
  risk_assessment: string;
};
 
type AssetPanel = {
  panel_id: string;
  title: string;
  priority: number;
  refresh_interval_seconds: number;
  data: {
    summary: AssetSummary;
    assets: Asset[];
    portfolio_intelligence: PortfolioIntelligence;
    ai_insights: AIInsights;
  };
};
 
type AssetPerformanceProps = {
  panel: AssetPanel;
};
 
const AssetPerformance = ({ panel }: AssetPerformanceProps) => {
  const { summary, assets, portfolio_intelligence, ai_insights } = panel.data;
 const [filterAssetData, setFilterAssetData] = useState<any[]>(panel.data.assets || []);
 const filterAsset = (status?: string) => {
  if(status == 'ALL'){
    setFilterAssetData(assets)
  }else{
    const filters = assets?.filter((data:any) => data.current_status == status)
    setFilterAssetData(filters)
  }
}

  return (
    <>
      <Card
        boxShadow="none"
        border="1px solid"
        borderColor="gray.200"
      >
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
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                boxShadow="sm"
              >
                analytics
              </Box>

              <Heading size="md" color="#1e3a8a">{panel.title}</Heading>
              
            </Box>
            <Menu>
              <MenuButton
                as={IconButton}
                size='sm'
                aria-label='Options'
                color='#1e3a8a'
                borderColor='#1e3a8a'
                icon={<Box as="span" className="material-symbols-outlined" fontSize="22px">
                  filter_list
                </Box>}
                variant='outline'
              />
              <MenuList className="alerts-menu">
                <MenuItem fontSize="sm" onClick={()=>filterAsset('ALL')}>
                <Flex w="100%" justify="space-between" align="center">
                  <span>Total Assets Monitored</span>
                  <span className="badge">{summary?.total_assets_monitored}</span>
                </Flex>
                </MenuItem>
                <MenuItem fontSize="sm" onClick={()=>filterAsset('CRITICAL')}>
                <Flex className="emergency-alert " w="100%" justify="space-between" align="center"><span>Critical Assets</span><span style={{backgroundColor:'red'}} className="badge">{summary.critical_assets}</span></Flex></MenuItem>
                <MenuItem fontSize="sm" onClick={()=>filterAsset('WARNING')}>
                <Flex className="critical-alert" w="100%" justify="space-between" align="center"><span>Warning Assets</span> <span style={{backgroundColor:'#fb923c'}} className="badge">{summary.warning_assets}</span></Flex>
                </MenuItem>
                <MenuItem fontSize="sm" onClick={()=>filterAsset('HEALTHY')}>
                <Flex className="security-alert" w="100%" justify="space-between" align="center"><span>Healthy Assets</span> <span style={{backgroundColor:'green'}} className="badge">{summary.healthy_assets}</span></Flex></MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </CardHeader>
        <Flex justify="space-between" align="center" padding="16px 16px 0px" gap="16px">
          <Box
            textAlign="left"
            padding="8px 16px"
            color="#fff"
            backgroundColor="#3b82f6"
            borderRadius="8px"
            width="100%"
            >
            <Text textStyle="xs" color="#fff">AI Predictions Generated</Text>
            <Text textStyle="md" fontWeight="semibold">12</Text>
          </Box>
          <Box
            textAlign="left"
            padding="8px 16px"
            color="#fff"
            backgroundColor="#3b82f6"
            borderRadius="8px"
            width="100%"
            >
            <Text textStyle="xs" color="#fff">Avg Portfolio Health</Text>
            <Text textStyle="md" fontWeight="semibold">84.2</Text>
          </Box>
          <Box
            textAlign="left"
            padding="8px 16px"
            color="#fff"
            backgroundColor="#3b82f6"
            borderRadius="8px"
            width="100%"
            >
            <Text textStyle="xs" color="#fff">Energy Efficiency Avg</Text>
            <Text textStyle="md" fontWeight="semibold">87.5</Text>
          </Box>
          <Box
            textAlign="left"
            padding="8px 16px"
            color="#fff"
            backgroundColor="#3b82f6"
            borderRadius="8px"
            width="100%"
            >
            <Text textStyle="xs" color="#fff">Potential Cost Savings</Text>
            <Text textStyle="md" fontWeight="semibold">23400</Text>
          </Box>
          {/* <Box
            textAlign="left"
            padding="8px 16px"
            color="#fff"
            backgroundColor="#3b82f6"
            borderRadius="8px"
            width="100%"
            >
            <Text textStyle="xs" color="#fff">Total Assets Monitored</Text>
            <Text textStyle="md" fontWeight="semibold">47</Text>
          </Box> */}
        </Flex>
        <CardBody>
        <Accordion allowToggle defaultIndex={[0]}>
          {filterAssetData?.map((asset:any) => (
            <AccordionItem
              key={asset.asset_id}
              border="1px solid"
              borderColor="gray.100"
              rounded="md"
              color="#6b7280"
              mb={3}
              borderTopLeftRadius="8px"
              borderTopRightRadius="8px"
              borderBottomLeftRadius="8px"
              borderBottomRightRadius="8px"
            >
              <AccordionButton _expanded={{ bg: "gray.50" }}
                borderTopLeftRadius="8px"
                borderTopRightRadius="8px"
                borderBottomLeftRadius="0px"
                borderBottomRightRadius="0px"
              >
                <Flex flex="1" justify="space-between" align="center">
                                <Box textAlign="left" width={"100%"}>
                                  <Flex flex="1" justify="space-between" align="center">
                                    <Text textStyle="sm" fontWeight="semibold">{asset.asset_name}</Text>
                                    <Badge mx={2} borderRadius={'4px'} fontSize={'10px'} colorScheme={asset.current_status === "CRITICAL" ? "red" : asset.current_status === "WARNING" ? "orange" : asset.current_status === "HEALTHY" ? "green" : "gray" }>{asset.current_status}</Badge>
                                  </Flex>
                                </Box>
                                <AccordionIcon />
                              </Flex>
               
              </AccordionButton>

              <AccordionPanel pb={4}>
                <SimpleGrid
                  columns={{ base: 1, sm: 2, lg: 3, xl: 4 }}
                  spacing={6}
                  paddingBottom="10px"
                  borderBottom="1px solid"
                  borderColor="gray.100"
                >
                  <Box>
                    <Text textStyle="xs" color="gray.500">
                      Asset ID
                    </Text>
                    <Text textStyle="sm" fontWeight="semibold">{asset.asset_id}</Text>
                  </Box>
                  <Box>
                    <Text textStyle="xs" color="gray.500">
                      Health Score
                    </Text>
                    {/* <Progress
                      value={asset.health_score}
                      size="sm"
                      colorScheme={asset.health_score < 60 ? "red" : "green"}
                    /> */}
                    <Text textStyle="sm" fontWeight="semibold" color={asset.health_score < 60 ? "red.400" : "green.400"}>{asset.health_score}</Text>
                  </Box>
                  <Box>
                    <Text textStyle="xs" color="gray.500">
                      Efficiency Rating
                    </Text>
                    <Text textStyle="sm" fontWeight="semibold">{asset.efficiency_rating}%</Text>
                  </Box>
                  <Box>
                    <Text textStyle="xs" color="gray.500">
                      Performance Trend
                    </Text>
                    <Badge borderRadius={'4px'}
                      colorScheme={
                        asset.performance_trend === "DECLINING"
                          ? "red"
                          : asset.performance_trend === "IMPROVING"
                          ? "green"
                          : asset.performance_trend === "STABLE"
                          ? "yellow"
                          : "gray"
                      }
                    >
                      {asset.performance_trend}
                    </Badge>
                  </Box>
                  <Box>
                    <Text textStyle="xs" color="gray.500">
                      Failure Probability
                    </Text>
                    {/* <Progress
                      value={asset.failure_probability}
                      size="sm"
                      colorScheme="red"
                    /> */}
                    <Text textStyle="sm" fontWeight="semibold" color='red.400'>{asset.failure_probability}%</Text>
                  </Box>
                  <Box>
                    <Text textStyle="xs" color="gray.500">
                      Predicted Failure
                    </Text>
                   
                    <Text textStyle="sm" fontWeight="semibold">
                      {asset.predicted_failure_type}
                    </Text>
                  </Box>
                  <Box>
                    <Text textStyle="xs" color="gray.500">
                      Predicted Failure Date
                    </Text>
                    <Text textStyle="sm" fontWeight="semibold">
                      {asset.predicted_failure_date}
                    </Text>
                    
                  </Box>
                </SimpleGrid>

                {/* Anomaly */}
                {asset.anomaly_detected && (
                  <Box
                    mt={3}
                    p={3}
                    bg="red.50"
                    rounded="md"
                    border="1px solid"
                    borderColor="red.200"
                    width="fit-content"
                  >
                    <Text fontWeight="semibold" color="red.400" style={{marginBottom:'6px'}}>
                    <Box
                    display="flex"
                    alignItems="center"
                    gap="6px"
                    lineHeight="normal"
                    >
                      <Image display="block" width={5} src="/images/error.svg" alt="Logo" /><Text textStyle="md"> Anomaly Detected:</Text></Box>
                    </Text>
                    <Text textStyle="sm">{asset.anomaly_description}</Text>
                    <Text 
                      display="flex"
                      gap={1}
                      textStyle="sm"
                      fontWeight="700">
                      Recommended: <Text textStyle="sm" fontWeight="400">{asset.recommended_action}</Text>
                    </Text>
                  </Box>
                )}
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>

          {filterAssetData?.length == 0 && (
            <Box display="flex" alignItems="center" justifyContent="center" height="100%" ><Text>No alerts found.</Text> </Box>
          )}
        </CardBody>
      </Card>

    </>
  );
};
 
export default AssetPerformance;