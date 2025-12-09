import React from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  VStack,
  HStack,
  Text,
  Progress,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { TooltipProps } from 'recharts';
import { WarningIcon } from '@chakra-ui/icons';
interface FinancialHealthProps {
  data: {
    title: string;
    data: {
      real_time_performance: any;
      budget_variance_analysis: any;
      risk_assessment: any;
      investment_performance: any;
      ai_financial_insights: any;
    };
  };
}
const StatBlock = ({ label, value, help }: { label: string; value: string | number; help?: string }) => (
  <Box textAlign="left">
      <Text textStyle="xs" color="#6b7280">{label}</Text>
      <Text textStyle="sm" fontWeight="bold" color="#6b7280">{value}</Text>
  </Box>
);

const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "white", padding: "10px", border: "1px solid #ccc", borderRadius: "6px" }}>
        <p style={{ fontWeight: "bold", marginBottom: "5px" }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color, margin: 0 }}>
            {entry.name}: <strong>${entry.value}M</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};
const formatCompactCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return formatCurrency(amount);
};
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
const FinancialHealth: React.FC<FinancialHealthProps> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OVER_BUDGET': return 'red';
      case 'UNDER_UTILIZED': return 'orange';
      case 'SLIGHTLY_OVER': return 'yellow';
      case 'FAVORABLE': return 'green';
      default: return 'gray';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'POSITIVE': return 'green';
      case 'FAVORABLE': return 'green';
      case 'NEGATIVE': return 'red';
      default: return 'gray';
    }
  };

  const getRiskColor = (category: string) => {
    switch (category) {
      case 'LOW': return 'green';
      case 'MEDIUM': return 'yellow';
      case 'HIGH': return 'red';
      default: return 'gray';
    }
  };

  // Chart data preparations
  const performanceData = [
    {
      name: 'Portfolio NOI',
      current: data.data.real_time_performance.portfolio_noi.current / 1000000,
      budget: data.data.real_time_performance.portfolio_noi.budget / 1000000,
    },
    {
      name: 'Total Revenue',
      current: data.data.real_time_performance.total_revenue.current / 1000000,
      budget: data.data.real_time_performance.total_revenue.budget / 1000000,
    },
    {
      name: 'Operating Expenses',
      current: data.data.real_time_performance.operating_expenses.current / 1000000,
      budget: data.data.real_time_performance.operating_expenses.budget / 1000000,
    },
  ];

  const riskData = [
    { name: 'Low Risk', value: 75, color: '#48BB78' },
    { name: 'Medium Risk', value: 20, color: '#ED8936' },
    { name: 'High Risk', value: 5, color: '#F56565' },
  ];

  const budgetVarianceData = Object.entries(data.data.budget_variance_analysis).map(([key, value]: [string, any]) => ({
    name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    variance: value.variance_pct || 0,
    status: value.status,
  }));

  return (
    <Card boxShadow="none" border="1px solid"  borderColor="gray.200">
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
              >
                planner_review
              </Box>

              <Heading size="md" color="#1e3a8a">{data?.title}</Heading> 
            </Box>
        </Flex>
        
      </CardHeader>
      
      <CardBody p={8}>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={3} mb={8}>
        {/* Portfolio Value Card */}
        <Card
        boxShadow="none"
        border="1px solid"
        borderColor="green.500"
        borderRadius="xl"
        overflow="hidden"
        bg="green.50"
        >
          <CardBody p={6}>
            <VStack spacing={2} textAlign="center">
              {/* <Flex 
              alignItems="center"
              gap="3"
              > */}
            <Box
                as="span"
                className="material-symbols-outlined"
                fontSize="34px"
                color="green.500"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                p={2}
                backgroundColor="green.100"
                borderRadius="4px"
                width="fit-content"
              >
                finance_mode
              </Box>
              <Box>
            <Text fontSize="xs" color="green.500" fontWeight="medium" mb="1">
                Portfolio Value
              </Text>
              <Flex align="center" gap={2}>
                {/* <Icon as={DollarSign} boxSize={6} color="green.500" /> */}
                <Text fontSize="md" fontWeight="bold" color="green.500">
                  {formatCompactCurrency(data.data.investment_performance.portfolio_value)}
                </Text>
              <Badge 
                colorScheme="green" 
                variant="subtle" 
                borderRadius="4px" 
                p="2px 6px"
                fontSize="10px"
              >
                +{data.data.investment_performance.value_appreciation_ytd_pct}% YTD
              </Badge>
              </Flex>
              </Box>
              {/* </Flex> */}
            </VStack>
          </CardBody>
        </Card>

        {/* Occupancy Rate Card */}
        <Card
        boxShadow="none"
        border="1px solid"
        borderColor="purple.500"
        borderRadius="xl"
        overflow="hidden"
        bg="purple.50"
        >
          <CardBody p={6}>
            <VStack spacing={2}  textAlign="center">
              {/* <Flex
              alignItems="center"
              gap="3"
              > */}
              <Box
                as="span"
                className="material-symbols-outlined"
                fontSize="34px"
                color="purple.500"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                p={2}
                backgroundColor="purple.100"
                borderRadius="4px"
                width="fit-content"
              >
                work
              </Box>
              <Box>
            <Text fontSize="xs" color="purple.500" fontWeight="medium" mb="1">
                Occupancy Rate
              </Text>
              <Flex align="center" gap={2}>
                {/* <Icon as={Users} boxSize={6} color="purple.500" /> */}
                <Text fontSize="md" fontWeight="bold" color="purple.500">
                  {data.data.real_time_performance.occupancy_rate_pct}%
                </Text>
              <Badge 
                colorScheme="purple" 
                variant="subtle" 
                borderRadius="4px" 
                p="2px 6px"
                fontSize="10px"
              >
                {data.data.real_time_performance.occupancy_change_pct}% vs Q3
              </Badge>
              </Flex>
              </Box>
              {/* </Flex> */}
            </VStack>
          </CardBody>
        </Card>

        {/* Monthly Maintenance Cost Card */}
        <Card
        boxShadow="none"
        border="1px solid"
        borderColor="blue.500"
        borderRadius="xl"
        overflow="hidden"
        bg="blue.50"
        >
          <CardBody p={6}>
            <VStack spacing={2} textAlign="center">
              {/* <Flex
              alignItems="center"
              gap="3"
              > */}
                <Box
                as="span"
                className="material-symbols-outlined"
                fontSize="34px"
                color="blue.500"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                p={2}
                backgroundColor="blue.100"
                borderRadius="4px"
                width="fit-content"
              >
                attach_money
              </Box>
              <Box>
            <Text fontSize="xs" color="blue.500" fontWeight="medium" mb="1">
                Monthly Maintenance Cost
              </Text>
              <Flex align="center" gap={2}>
                {/* <Icon as={Wrench} boxSize={6} color="green.500" /> */}
                <Text fontSize="md" fontWeight="bold" color="blue.500">
                  {formatCompactCurrency(data.data.budget_variance_analysis.maintenance_costs.actual)}
                </Text>
              <Badge 
                colorScheme="blue" 
                variant="subtle" 
                borderRadius="4px" 
                p="2px 6px"
                fontSize="10px"
              >
                {data.data.budget_variance_analysis.maintenance_costs.variance_pct}% vs Budget
              </Badge>
              </Flex>
              </Box>
              {/* </Flex> */}
            </VStack>
          </CardBody>
        </Card>

        {/* Risk Score Card */}
        <Card
        boxShadow="none"
        border="1px solid"
        borderColor="orange.500"
        borderRadius="xl"
        overflow="hidden"
        bg="orange.50"
        >
          <CardBody p={6}>
            <VStack spacing={2} textAlign="center">
              {/* <Flex
              alignItems="center"
              gap="3"
              > */}
              <Box
                as="span"
                className="material-symbols-outlined"
                fontSize="34px"
                color="orange.500"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                p={2}
                backgroundColor="orange.100"
                borderRadius="4px"
                width="fit-content"
              >
                readiness_score
              </Box>
              <Box>
            <Text fontSize="xs" color="orange.500" fontWeight="medium" mb="1">
                Risk Score
              </Text>
              <Flex align="center" gap={2}>
                {/* <Icon as={Shield} boxSize={6} color="orange.500" /> */}
                <Text fontSize="md" fontWeight="bold" color="orange.500">
                  {data.data.risk_assessment.portfolio_risk_score}
                </Text>
              <Badge 
                colorScheme="orange" 
                variant="subtle" 
                borderRadius="4px" 
                p="2px 6px"
                fontSize="10px"
              >
                Risk: {data.data.risk_assessment.risk_category}
              </Badge>
              </Flex>
              </Box>
              {/* </Flex> */}
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>
      <Box style={{ height: "400px",overflow:'auto'}}>
        <Accordion allowToggle defaultIndex={[0]}>
          {/* Real-Time Performance */}
          <AccordionItem
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
            <AccordionButton 
              _expanded={{ bg: "gray.50" }}
              borderTopLeftRadius="8px"
              borderTopRightRadius="8px"
              borderBottomLeftRadius="0px"
              borderBottomRightRadius="0px"
            >
             
              <Flex flex="1" justify="space-between" align="center">
                    <Box textAlign="left" width={"100%"}>
                      <Flex flex="1" justify="space-between" align="center">
                        <Text textStyle="sm" fontWeight="semibold">Real-Time Performance</Text>
                      </Flex>
                    </Box>
                    <AccordionIcon />
                  </Flex>
            </AccordionButton>
            <AccordionPanel pb={6} pt={6}>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={3} pb={8} textAlign="center" borderBottom="1px solid" borderColor="gray.100">
                
                <Stat
                borderRight="1px solid"
                borderColor="gray.100"
                >
                  <StatLabel  fontSize='12px' color="#6b7280">Portfolio NOI</StatLabel>
                  <StatNumber fontSize='20px' fontWeight="semibold">
                    {formatCurrency(data.data.real_time_performance.portfolio_noi.current)}
                  </StatNumber>
                  <StatHelpText fontSize='12px' color="#6b7280">
                    <StatArrow type="increase" />
                    {data.data.real_time_performance.portfolio_noi.variance_pct}% vs budget
                  </StatHelpText>
                </Stat>
                
                <Stat
                borderRight="1px solid"
                borderColor="gray.100"
                >
                  <StatLabel fontSize='12px' color="#6b7280">Total Revenue</StatLabel>
                  <StatNumber fontSize='20px' color="brand.700">
                    {formatCurrency(data.data.real_time_performance.total_revenue.current)}
                  </StatNumber>
                  <StatHelpText fontSize='12px' color="#6b7280">
                    <StatArrow type="increase" />
                    {data.data.real_time_performance.total_revenue.variance_pct}% vs budget
                  </StatHelpText>
                </Stat>

                <Stat
                borderRight="1px solid"
                borderColor="gray.100"
                >
                  <StatLabel fontSize="12px" color="#6b7280">ROI Percentage</StatLabel>
                  <StatNumber fontSize="20px" color="green.500">
                    {data.data.real_time_performance.roi_percentage}%
                  </StatNumber>
                  <Badge fontSize="10px" p="2px 6px" colorScheme="green" variant="subtle">Excellent</Badge>
                </Stat>

                <Stat>
                  <StatLabel fontSize="12px" color="#6b7280">Occupancy Rate</StatLabel>
                  <StatNumber fontSize="20px" color="brand.700">
                    {data.data.real_time_performance.occupancy_rate_pct}%
                  </StatNumber>
                  <StatHelpText fontSize='12px' color="#6b7280">
                    <StatArrow type="increase" />
                    {data.data.real_time_performance.occupancy_change_pct}% change
                  </StatHelpText>
                </Stat>
              </SimpleGrid>

              <Box h="300px" bg="white" p={4} borderRadius="lg">
                <Text fontSize="sm" fontWeight="semibold" mb={4} color="#6b7280">
                  Performance vs Budget (in Millions)
                </Text>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    {/* <Tooltip formatter={(value:any) => [`$${value}M`, '']} /> */}
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="current" fill="#1e3a8a" name="Current" />
                    <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </AccordionPanel>
          </AccordionItem>

          {/* Budget Variance Analysis */}
          <AccordionItem
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
            <AccordionButton 
              _expanded={{ bg: 'gray.50'}}
              borderTopLeftRadius="8px"
              borderTopRightRadius="8px"
              borderBottomLeftRadius="0px"
              borderBottomRightRadius="0px"
            >
              <Box flex="1" textAlign="left">
                <Heading size="sm" fontWeight="semibold" color="#6b7280">Budget Variance Analysis</Heading>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel  pb={8} pt={4}>
              <SimpleGrid columns={[1, 2]} spacing={3}>
                {Object.entries(data.data.budget_variance_analysis).map(([key, value]: [string, any]) => (
                <Card
                borderRadius="8"
                border="1px solid"
                borderColor="gray.100"
                boxShadow="none"
                >
                  <Box key={key} bg="#fff" borderRadius="lg">
                    <CardHeader pb={0} bg="blue.400" borderRadius="8">
                    <HStack justify="space-between">
                      <Text textStyle="sm" fontWeight="semibold" color="#fff" textTransform="capitalize">
                        {key.replace(/_/g, ' ')}
                      </Text>
                      <Badge fontSize="10px" p="2px 6px" colorScheme={getStatusColor(value.status)} variant="solid">
                        {value.status?.replace(/_/g, ' ')}
                      </Badge>
                    </HStack>
                    </CardHeader>
                    
                    <CardBody p={3}>
                      <SimpleGrid  columns={[1, 3]} spacing={2}>
                    {/* <VStack align="stretch" spacing={2}> */}
                    <StatBlock label="Actual" value={formatCurrency(value.actual || value.utilized || 0)} />
                    <StatBlock label="Budget" value={formatCurrency(value.budget || value.allocated || 0)} />
                    <Box textAlign="left">
                      <Text textStyle="xs" color="#6b7280">Variance</Text>
                      <Text 
                          textStyle="sm" fontWeight="semibold" 
                          color={value.variance_pct > 0 ? 'red.500' : 'green.500'}
                        >
                          {value.variance_pct > 0 ? '+' : ''}{value.variance_pct}%
                        </Text>
                    </Box>


                      {/* <HStack>
                        <Text textStyle="sm" color="#6b7280">Actual:</Text>
                        <Text textStyle="sm" color="#6b7280" fontWeight="semibold">{formatCurrency(value.actual || value.utilized || 0)}</Text>
                      </HStack>
                      <HStack>
                        <Text textStyle="sm" color="#6b7280">Budget:</Text>
                        <Text textStyle="sm" color="#6b7280" fontWeight="semibold">{formatCurrency(value.budget || value.allocated || 0)}</Text>
                      </HStack>
                      <HStack>
                        <Text textStyle="sm" color="#6b7280">Variance:</Text>
                        <Text 
                          textStyle="sm" fontWeight="semibold" 
                          color={value.variance_pct > 0 ? 'red.500' : 'green.500'}
                        >
                          {value.variance_pct > 0 ? '+' : ''}{value.variance_pct}%
                        </Text>
                      </HStack> */}
                      </SimpleGrid>
                      {value.explanation && (
                        <Flex justify="space-between" align="center" mt={3}>
                          <Box
                            display="flex"
                            alignItems="center"
                            gap="1"
                            padding="6px 10px"
                            backgroundColor="blue.50"
                            borderRadius="50px"
                          >
                           
                              <>
                              <Box
                              as="span"
                              className="material-symbols-outlined"
                              fontSize="16px"
                              color="#1e3a8a"
                              display="inline-flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              info
                            </Box>
                              <Text textStyle="xs" fontWeight="semibold" color="#1e3a8a">
                                {value.explanation}
                              </Text>
                              </>
                          </Box>
                        </Flex>
                            )}
                      
                    {/* </VStack> */}
                    </CardBody>
                  </Box>
                </Card>
                ))}
              </SimpleGrid>

              <Box h="300px" bg="white" p={4} borderRadius="lg">
                <Text fontSize="sm" fontWeight="semibold" mb={4} color="#6b7280">
                  Budget Variance by Category
                </Text>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetVarianceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value:any) => [`${value}%`, 'Variance']} />
                    {/* <Bar dataKey="variance" fill={(entry: any) => entry.variance > 0 ? '#F56565' : '#48BB78'} /> */}
                    <Bar dataKey="variance">
                      {budgetVarianceData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.variance > 0 ? '#1e3a8a' : '#48BB78'} 
                        />
                      ))}
                    </Bar>

                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </AccordionPanel>
          </AccordionItem>

          {/* Risk Assessment */}
          <AccordionItem
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
            <AccordionButton 
              _expanded={{ bg: 'gray.50' }}
              borderTopLeftRadius="8px"
                borderTopRightRadius="8px"
                borderBottomLeftRadius="0px"
                borderBottomRightRadius="0px"
            >
              <Box flex="1" textAlign="left">
                <Heading size="sm" fontWeight="semibold" color="#6b7280">Risk Assessment</Heading>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel p={4}>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={3}>
                <Box textAlign="left">
                  <Text fontSize='11px' fontWeight="semibold" color="#6b7280">Portfolio Risk Score</Text>
                  <Flex
                  alignItems="center"
                  gap="4px"
                  >
                  <Text fontSize='12px' fontWeight="semibold" color="green.500" textAlign="left">
                    {data.data.risk_assessment.portfolio_risk_score}
                  </Text>
                  </Flex>
                  <Badge  fontSize='10px' colorScheme={getRiskColor(data.data.risk_assessment.risk_category)} p="2px 6px" borderRadius="4px">
                    {data.data.risk_assessment.risk_category} RISK
                  </Badge>
                </Box>

                <Box>
                  <Text fontSize='11px' fontWeight="semibold" color="#6b7280">Compliance Status</Text>
                  <Flex
                    alignItems="center"
                    gap="4px"
                  >
                  <Text fontSize="12px" fontWeight="bold" color="brand.600">
                    {data.data.risk_assessment.compliance_percentage}%
                  </Text>
                  </Flex>
                  <Badge
                    colorScheme="blue"
                    variant="subtle"
                    borderRadius="4px"
                    p="2px 6px"
                    fontSize="10px"
                    textTransform="capitalize"
                  >
                    {data.data.risk_assessment.active_violations} active violations
                  </Badge>
                  {/* <Progress 
                    value={data.data.risk_assessment.compliance_percentage} 
                    colorScheme="brand" 
                    size="lg" 
                    borderRadius="full"
                  /> */}
                  {/* <Text fontSize='11px' color="#6b7280" mt={2}>
                    {data.data.risk_assessment.active_violations} active violations
                  </Text> */}
                </Box>

                <Box>
                  <Text fontSize='11px' fontWeight="semibold" color="#6b7280">Debt Coverage Ratio</Text>
                  {/* <Badge colorScheme="green" variant="outline">
                        {data.data.risk_assessment.debt_service_coverage_ratio}x
                      </Badge> */}
                  <Badge fontSize='10px' colorScheme="green" padding="2px 6px" borderRadius="4px">
                    {data.data.risk_assessment.debt_service_coverage_ratio}x
                  </Badge>
                </Box>

                <Box>
                  <Text fontSize='11px' fontWeight="semibold" color="#6b7280">Loan To Value Ratio</Text>
                  {/* <Badge colorScheme="green" variant="outline">
                        {data.data.risk_assessment.debt_service_coverage_ratio}x
                      </Badge> */}
                  <Badge fontSize='10px' colorScheme="green" padding="2px 6px" borderRadius="4px">
                    {data.data.risk_assessment.loan_to_value_ratio}x
                  </Badge>
                </Box>

                <Box>
                  <Text fontSize='11px' fontWeight="semibold" color="#6b7280">Audit Findings</Text>
                  {/* <Badge colorScheme="green" variant="outline">
                        {data.data.risk_assessment.debt_service_coverage_ratio}x
                      </Badge> */}
                  <Text fontSize="12px" fontWeight="bold" color="brand.600">
                    {data.data.risk_assessment.audit_findings}
                  </Text>
                </Box>

                <Box>
                  <Text fontSize='11px' fontWeight="semibold" color="#6b7280">Lease Expiry Risk</Text>
                  {/* <Badge colorScheme="green" variant="outline">
                        {data.data.risk_assessment.debt_service_coverage_ratio}x
                      </Badge> */}
                  <Text fontSize="12px" fontWeight="bold" color="brand.600">
                    {data.data.risk_assessment.lease_expiry_risk_12m_pct}
                  </Text>
                </Box>

                <Box>
                  <Text fontSize='11px' fontWeight="semibold" color="#6b7280">insurance claims Ytd</Text>
                  {/* <Badge colorScheme="green" variant="outline">
                        {data.data.risk_assessment.debt_service_coverage_ratio}x
                      </Badge> */}
                  <Text fontSize="12px" fontWeight="bold" color="brand.600">
                    {data.data.risk_assessment.insurance_claims_ytd}
                  </Text>
                </Box>

                <Box>
                  <Text fontSize='11px' fontWeight="semibold" color="#6b7280">LTV Ratio</Text>
                  {/* <Badge colorScheme="blue" variant="outline">
                        {data.data.risk_assessment.loan_to_value_ratio}%
                      </Badge> */}
                  <Badge fontSize='10px' colorScheme="blue" padding="2px 6px" borderRadius="4px">
                    {data.data.risk_assessment.loan_to_value_ratio}%
                  </Badge>
                </Box>

                <Box>
                  <Text fontSize='11px' fontWeight="semibold" color="#6b7280">Tenant Risk Score</Text>
                  {/* <Badge colorScheme="green" variant="outline">
                        {data.data.risk_assessment.tenant_payment_risk_score}
                      </Badge> */}
                  <Badge fontSize='10px' colorScheme="green" padding="2px 6px" borderRadius="4px">
                    {data.data.risk_assessment.tenant_payment_risk_score}
                  </Badge>
                </Box>

                <Box>
                  <Text fontSize='11px' fontWeight="semibold" color="#6b7280">Market Risk Score</Text>
                  {/* <Badge colorScheme="green" variant="outline">
                        {data.data.risk_assessment.tenant_payment_risk_score}
                      </Badge> */}
                  <Badge fontSize='10px' colorScheme="green" padding="2px 6px" borderRadius="4px">
                    {data.data.risk_assessment.market_risk_score}
                  </Badge>
                </Box>
              </SimpleGrid>

              {/* <Box h="300px" bg="white" p={4} borderRadius="lg" shadow="md">
                <Text fontSize="md" fontWeight="semibold" mb={4} color="gray.700">
                  Risk Distribution
                </Text>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }:any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box> */}
            </AccordionPanel>
          </AccordionItem>

          {/* Investment Performance */}
          <AccordionItem
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
            <AccordionButton 
              _expanded={{ bg: 'gray.50'}}
              borderTopLeftRadius="8px"
                borderTopRightRadius="8px"
                borderBottomLeftRadius="0px"
                borderBottomRightRadius="0px"
            >
              <Box flex="1" textAlign="left">
                <Heading size="sm" fontWeight="semibold">Investment Performance</Heading>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel p={4} textAlign="center">
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                <Stat p={4} bg="#f4fbff" borderRadius="lg">
                  <StatLabel fontSize='12px' color="#6b7280">Portfolio Value</StatLabel>
                  <StatNumber fontSize='20px' fontWeight="semibold" color="purple.600">
                    {formatCurrency(data.data.investment_performance.portfolio_value)}
                  </StatNumber>
                  <StatHelpText fontSize='12px' color="#6b7280">
                    <StatArrow type="increase" />
                    {data.data.investment_performance.value_appreciation_ytd_pct}% YTD
                  </StatHelpText>
                </Stat>

                <Stat p={4} bg="#f4fbff" borderRadius="lg">
                  <StatLabel fontSize='12px' color="#6b7280">Monthly Cash Flow</StatLabel>
                  <StatNumber fontSize='20px' fontWeight="semibold" color="green.500">
                    {formatCurrency(data.data.investment_performance.cash_flow_monthly)}
                  </StatNumber>
                  <Badge fontSize="10px" p="2px 6px" colorScheme="green" variant="subtle">Stable</Badge>
                </Stat>

                <Stat p={4} bg="#f4fbff" borderRadius="lg">
                  <StatLabel fontSize='12px' color="#6b7280">Cash Reserves</StatLabel>
                  <StatNumber fontSize='20px' fontWeight="semibold" color="blue.500">
                    {formatCurrency(data.data.investment_performance.cash_reserves)}
                  </StatNumber>
                  <StatHelpText fontSize='12px' color="#6b7280" opacity={100}>
                    {data.data.investment_performance.days_cash_on_hand} days on hand
                  </StatHelpText>
                </Stat>

                <Box textAlign="center" p={4} bg="#f4fbff" borderRadius="lg">
                  <Text fontSize='12px' color="#6b7280" mb={1}>Market Position</Text>
                  <Badge colorScheme="purple" fontSize="10px" p="2px 6px" verticalAlign="center" variant="solid">
                    {data.data.investment_performance.market_position.replace(/_/g, ' ')}
                  </Badge>
                  <Text fontSize='12px' color="#6b7280" mt={1}>ESG Score: {data.data.investment_performance.esg_score}</Text>
                </Box>
              </SimpleGrid>
            </AccordionPanel>
          </AccordionItem>

          {/* AI Financial Insights */}
          <AccordionItem
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
            <AccordionButton 
              _expanded={{ bg: 'gray.50'}}
              borderTopLeftRadius="8px"
                borderTopRightRadius="8px"
                borderBottomLeftRadius="0px"
                borderBottomRightRadius="0px"
            >
              <Box flex="1" textAlign="left">
                <Heading fontSize='12px' fontWeight="semibold">AI Financial Insights</Heading>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={6} pt={6}>
              <VStack spacing={6} align="stretch">
                {/* Cost Optimization Opportunities */}
                <Box>
                  <Heading fontSize='14px' fontWeight="semibold" mb={4}>Cost Optimization Opportunities</Heading>
                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                    {data.data.ai_financial_insights.cost_optimization_opportunities.map((opp: any, index: number) => (
                      <Box key={index} p={4} bg="#f4fbff" borderRadius="lg">
                        <Text fontSize='14px' fontWeight="semibold"color="#6b7280" mb={2}>{opp.opportunity}</Text>
                        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={2}>
                        <StatBlock label="Annual Savings" value={formatCurrency(opp.estimated_savings_annual)} />
                        <StatBlock label="Implementation Cost" value={formatCurrency(opp.implementation_cost)} />
                          <Box textAlign="left">
                            <Text textStyle="xs" color="#6b7280">ROI Timeline</Text>
                            <Text textStyle="sm" fontWeight="bold">{opp.roi_years} years</Text>
                          </Box>
                          <Box textAlign="left">
                            <Text textStyle="xs" color="#6b7280">Confidence</Text>
                            {/* <Text textStyle="sm" fontWeight="bold">{opp.confidence}%</Text> */}
                            <Badge fontSize="10px" p="2px 6px" colorScheme="green" variant="solid">{opp.confidence}%</Badge>
                          </Box>
                        </SimpleGrid>
                        <VStack align="stretch" spacing={2}>

                          {/* <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.600">Annual Savings:</Text>
                            <Text fontWeight="bold" color="green.600">{formatCurrency(opp.estimated_savings_annual)}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.600">Implementation Cost:</Text>
                            <Text fontWeight="medium">{formatCurrency(opp.implementation_cost)}</Text>
                          </HStack> */}
                          {/* <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.600">ROI Timeline:</Text>
                            <Badge colorScheme="green" variant="outline">{opp.roi_years} years</Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.600">Confidence:</Text>
                            <Badge colorScheme="blue" variant="solid">{opp.confidence}%</Badge>
                          </HStack> */}
                        </VStack>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>

                <Divider />

                {/* Risk Predictions */}
                <Box>
                  <Heading fontSize='14px' fontWeight="semibold" mb={4}>Risk Predictions</Heading>
                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
        {data.data.ai_financial_insights.risk_predictions.map((risk: any, index: number) => (
          <Flex
            key={index}
            align="center"
            gap={3}
            p={3}
            border="1px solid"
            borderColor='red.400'
            bg='red.50'
            borderRadius={8}
            cursor="pointer"
            
          >
            <Box><WarningIcon color="red.400" boxSize={5} /></Box>
            <Box flex="1">
              <Heading size="md" fontWeight="semibold">
              {risk.risk_type}
              </Heading>
              <Flex gap="6px" m="6px 0px">
              <Badge fontSize="10px" p="2px 6px" borderRadius="4px" textTransform="capitalize" colorScheme="orange" variant="outline">
                {risk.probability_pct}% probability
              </Badge>
              <Badge fontSize="10px" p="2px 6px" borderRadius="4px" textTransform="capitalize" colorScheme="red" variant="outline">
                {formatCurrency(risk.impact_estimate)} impact
              </Badge>
              </Flex>
              <Text textStyle="xs" color="#6b7280">{risk.mitigation}</Text>
            </Box>
            {/* <Text fontSize="sm">{alert.time}</Text> */}
          </Flex>
        ))}
      </SimpleGrid>
                  {/* <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                    {data.data.ai_financial_insights.risk_predictions.map((risk: any, index: number) => (
                      <Alert key={index} status="warning" borderRadius="lg" p={4}>
                        <AlertIcon />
                        <Box flex="1">
                          <AlertTitle fontSize="sm">{risk.risk_type}</AlertTitle>
                          <AlertDescription fontSize="sm">
                            <HStack spacing={4} mt={2}>
                              <Badge colorScheme="orange" variant="outline">
                                {risk.probability_pct}% probability
                              </Badge>
                              <Badge colorScheme="red" variant="outline">
                                {formatCurrency(risk.impact_estimate)} impact
                              </Badge>
                            </HStack>
                            <Text mt={2} fontSize="xs" color="#6b7280">{risk.mitigation}</Text>
                          </AlertDescription>
                        </Box>
                      </Alert>
                    ))}
                  </SimpleGrid> */}
                </Box>

                <Divider />

                {/* Market Opportunities */}
                <Box>
                  <Heading fontSize='14px' fontWeight="semibold" mb={4}>Market Opportunities</Heading>
                  {data.data.ai_financial_insights.market_opportunities.map((opp: any, index: number) => (
                    <Box key={index} p={5} bg="#f4fbff" borderRadius="lg">
                      <Text fontSize='14px' fontWeight="semibold"color="#6b7280" mb={2}>{opp.opportunity}</Text>
                      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                        <Box>
                          <Text fontSize="xs" color="#6b7280">Revenue Potential</Text>
                          <Text fontWeight="bold" color="blue.600">{formatCurrency(opp.revenue_potential_annual)}</Text>
                          <Text fontSize="xs" color="#6b7280 ">annually</Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="#6b7280">Market Gap</Text>
                          <Badge fontSize="10px" p="2px 6px" colorScheme="blue" variant="solid">{opp.market_rent_gap_pct}%</Badge>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="#6b7280">Timeline</Text>
                          <Badge fontSize="10px" p="2px 6px" colorScheme="purple" variant="solid">{opp.implementation_timeline}</Badge>
                        </Box>
                      </SimpleGrid>
                    </Box>
                  ))}
                </Box>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Box>
      </CardBody>
    </Card>
  );
};

export default FinancialHealth;