// OperationalEfficiencyPanel.tsx
import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  Text,
  VStack,
  Divider,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  position,
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";

const formatLabel = (label: string) => label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const StatCard = ({ label, value }: { label: string; value: any }) => (
//   <Box p={3} borderWidth="1px" borderRadius="md" shadow="sm">
//     <Stat>
//       <StatLabel>{label}</StatLabel>
//       <StatNumber>{value}</StatNumber>
//     </Stat>
//   </Box>
  <Box textAlign="left">
  <Text textStyle="xs" color="#6b7280">
    {formatLabel(label)}
  </Text>
  <Text textStyle="sm" fontWeight="bold" color="#6b7280">{value}</Text>
</Box>
);

const OperationalEfficiencyPanel = ({ data }: any) => {
  const panelData = data.data;

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
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
              >
                manufacturing
              </Box>

              <Heading size="md" color="#1e3a8a">{data?.title}</Heading> 
            </Box>
                  {/* <span onClick={() => setWorkSummaryModal(true)}><InfoOutlineIcon /></span> */}
                </Flex>
              </CardHeader>
              <CardBody>
                <Box style={{ height: "400px", overflowY: "auto" }}>
                <Accordion allowToggle w="100%" defaultIndex={[0]}>
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
              <AccordionButton  _expanded={{ bg: "gray.50" }}
              borderTopLeftRadius="8px"
              borderTopRightRadius="8px"
              borderBottomLeftRadius="0px"
              borderBottomRightRadius="0px"
              >
                  <Flex flex="1" justify="space-between" align="center">
                    <Box textAlign="left" width={"100%"}>
                      <Flex flex="1" justify="space-between" align="center">
                        <Text textStyle="sm" fontWeight="semibold">Portfolio Performance</Text>
                      </Flex>
                    </Box>
                    <AccordionIcon />
                  </Flex>
                </AccordionButton>


              
              <AccordionPanel p="4">
                <SimpleGrid columns={[1, 2, 3]} spacing={2}>
                  {Object.entries(panelData.portfolio_performance).map(([k, v]) => (
                    <StatCard key={k} label={k} value={v} />
                  ))}
                </SimpleGrid>
              </AccordionPanel>
            </AccordionItem>

            {/* Resource Utilization */}
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
              <AccordionButton  _expanded={{ bg: "gray.50" }}
              borderTopLeftRadius="8px"
              borderTopRightRadius="8px"
              borderBottomLeftRadius="0px"
              borderBottomRightRadius="0px"
              >
              <Flex flex="1" justify="space-between" align="center">
                    <Box textAlign="left" width={"100%"}>
                      <Flex flex="1" justify="space-between" align="center">
                        <Text textStyle="sm" fontWeight="semibold">Resource Utilization</Text>
                      </Flex>
                    </Box>
                    <AccordionIcon />
                  </Flex>
              </AccordionButton>
              <AccordionPanel p="4">
                {Object.entries(panelData.resource_utilization).map(([section, obj]) => (
                  <Box key={section} mb={2}>
                   
                    <Card
                    borderRadius='8'
                    boxShadow="none"
                    border="1px solid"
                    borderColor="gray.200"
                    >
                    <CardHeader pb={0} bg='blue.400' borderRadius='8'>
                        <Text textStyle="sm" fontWeight="semibold" color='#fff'>
                        {section.replace(/_/g, " ")}
                        </Text>
                    </CardHeader>
                    <CardBody><SimpleGrid columns={[1, 2, 3]} spacing={2}>
                      {Object.entries(obj as Record<string, any>).map(([k, v]) => (
                        <StatCard key={k} label={k} value={v} />
                      ))}
                    </SimpleGrid></CardBody>
                    </Card>
                    {/* <Text fontWeight="semibold" mb={2}>{section.replace(/_/g, " ")}</Text>
                    <SimpleGrid columns={[1, 2, 3]} spacing={2}>
                      {Object.entries(obj as Record<string, any>).map(([k, v]) => (
                        <StatCard key={k} label={k} value={v} />
                      ))}
                    </SimpleGrid> */}
                  </Box>
                ))}
              </AccordionPanel>
            </AccordionItem>

            {/* Cost Optimization */}
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
              <AccordionButton  _expanded={{ bg: "gray.50" }}
              borderTopLeftRadius="8px"
              borderTopRightRadius="8px"
              borderBottomLeftRadius="0px"
              borderBottomRightRadius="0px"
              >
                 <Flex flex="1" justify="space-between" align="center">
                    <Box textAlign="left" width={"100%"}>
                      <Flex flex="1" justify="space-between" align="center">
                        <Text textStyle="sm" fontWeight="semibold">Cost Optimization</Text>
                      </Flex>
                    </Box>
                    <AccordionIcon />
                  </Flex>
              </AccordionButton>
              <AccordionPanel p="4" textTransform="capitalize">
                {Object.entries(panelData.cost_optimization).map(([section, obj]) => (
                  <Card
                  mb='2'
                  borderRadius='8'
                  boxShadow="none"
                  border="1px solid"
                  borderColor="gray.200"
                  >
                  <CardHeader pb={0} bg='blue.400' borderRadius='8'>
                      <Text textStyle="sm" fontWeight="semibold" color='#fff'>
                      {section.replace(/_/g, " ")}
                      </Text>
                  </CardHeader>
                  <CardBody><SimpleGrid columns={[1, 2, 3]} spacing={2}>
                    {Object.entries(obj as Record<string, any>).map(([k, v]) => (
                      <StatCard key={k} label={k} value={v} />
                    ))}
                  </SimpleGrid></CardBody>
                  </Card>
                ))}
              </AccordionPanel>
            </AccordionItem>

            {/* Performance Benchmarking */}
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
              
              <AccordionButton  _expanded={{ bg: "gray.50" }}
              borderTopLeftRadius="8px"
              borderTopRightRadius="8px"
              borderBottomLeftRadius="0px"
              borderBottomRightRadius="0px"
              >
                 <Flex flex="1" justify="space-between" align="center">
                    <Box textAlign="left" width={"100%"}>
                      <Flex flex="1" justify="space-between" align="center">
                        <Text textStyle="sm" fontWeight="semibold">Performance Benchmarking</Text>
                      </Flex>
                    </Box>
                    <AccordionIcon />
                  </Flex>
              </AccordionButton>
              <AccordionPanel p="4">
                <Text color='#6b7280' textStyle="sm" fontWeight="semibold" mb={2}>Industry Comparisons</Text>
                <SimpleGrid columns={[1, 2, 2]} spacing={3} textTransform="capitalize">
                  {Object.entries(panelData.performance_benchmarking.industry_comparisons).map(([k, obj]) => (
                    <Box key={k} p={3} bg='#f4fbff' borderRadius="md">
                        <Text textStyle="sm" fontWeight="bold" color='blue.400' mb={2}>{k.replace(/_/g, " ")}</Text>
                        <SimpleGrid columns={[1, 2, 2]} spacing={2}>
                            {Object.entries(obj as Record<string, any>).map(([sk, sv]) => (
                                // <Text key={sk} fontSize="sm">{sk}: {sv}</Text>
                                <StatCard key={sk} label={sk} value={sv} />
                            ))}
                        </SimpleGrid>
                    </Box>
                  ))}
                </SimpleGrid>
                <Text color='#6b7280' textStyle="md" fontWeight="semibold" mt={3} mb={1}>Improvement Opportunities</Text>
                {panelData.performance_benchmarking.improvement_opportunities.map((op:any, i:any) => (
                  <Box key={i} p={3} bg='#f4fbff' borderRadius="md" mb={3}>
                    <Text textStyle="sm" fontWeight="bold" color='blue.400' mb={2}>{op.area}</Text>
                    <SimpleGrid columns={[1, 2, 4]} spacing={2} pt={1}>
                    <StatCard label='Current' value={op.current_score} />
                    <StatCard label='Target' value={op.target_score} />
                    <StatCard label='Investment' value={op.investment_required} />
                    <StatCard label='Savings' value={op.annual_savings_potential} />
                    </SimpleGrid>
                  </Box>
                ))}
              </AccordionPanel>
            </AccordionItem>

            {/* Operational Insights */}
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
              <AccordionButton  _expanded={{ bg: "gray.50" }}
              borderTopLeftRadius="8px"
              borderTopRightRadius="8px"
              borderBottomLeftRadius="0px"
              borderBottomRightRadius="0px"
              >
                 <Flex flex="1" justify="space-between" align="center">
                    <Box textAlign="left" width={"100%"}>
                      <Flex flex="1" justify="space-between" align="center">
                        <Text textStyle="sm" fontWeight="semibold">Operational Insights</Text>
                      </Flex>
                    </Box>
                    <AccordionIcon />
                  </Flex>
              </AccordionButton>
              <AccordionPanel p="4">
              <Box p={3} bg='#f4fbff' borderRadius="md" mb={3}> 
                <Text textStyle="sm" fontWeight="bold" color='blue.400' mb={2}>Efficiency Trends</Text>
                <VStack align="start" spacing={2}>
                  {panelData.operational_insights.efficiency_trends.map((t:any, i:any) => (
                    <Box style={{position:'relative'}}>
                       <CheckIcon color='green' style={{position:'absolute',top:'4px'}} /> <Text style={{marginLeft:'22px'}} key={i} textStyle="xs"> {t}</Text>
                    </Box>
                  ))}
                </VStack>
              </Box>
                
                <Divider my={4} />
                <Text textStyle="sm" fontWeight="bold" mb={2}>Optimization Recommendations</Text>
                {panelData.operational_insights.optimization_recommendations.map((r:any, i:any) => (
                  <Box key={i} p={3} bg='#f4fbff' borderRadius="md" mb={3}>
                    <Text textStyle="sm" fontWeight="bold" color='blue.400' mb={2}>{r.recommendation}</Text>
                    <SimpleGrid columns={[1, 2, 2]} spacing={2} pt={1}>
                    <StatCard label='Impact' value={r.impact} />
                    <StatCard label='Investment' value={r.investment} />
                    <StatCard label='Timeline' value={r.timeline} />
                    </SimpleGrid>
                  
                  </Box>
                ))}
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
                </Box>
                </CardBody>
            </Card>

   </>
  );
}
export default OperationalEfficiencyPanel;