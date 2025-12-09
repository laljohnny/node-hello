import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Text,
  Stack,
  Badge,
  Divider,
  Heading,
  SimpleGrid,
  CardBody,
  Card,
  CardHeader,
  Flex,
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";

interface AIDrivenStrategicInsightsPanelProps {
  data: any;
}
const StatBlock = ({ label, value }: { label: string; value: string | number;}) => (

  <Box textAlign="left">
      <Text textStyle="xs" color="#6b7280">{label}</Text>
      <Text textStyle="sm" fontWeight="bold" color="#6b7280">{value}</Text>
  </Box>
);

const AIDrivenStrategicInsightsPanel: React.FC<AIDrivenStrategicInsightsPanelProps> = ({ data }) => {
  if (!data) return null;

  const {
    investment_optimization,
    market_intelligence,
    risk_analytics,
    ai_executive_summary,
  } = data.data;

  return (
    <>
      <Card className="shadow-md rounded-2xl p-4"
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
                smart_toy
              </Box>

              <Heading size="md" color="#1e3a8a">AI-Driven Strategic Insights & Predictive Analytics</Heading> 
            </Box>
          </Flex>
        </CardHeader>
        <CardBody>
          <Box style={{ height: "400px", overflowY: "auto" }}>
            <Accordion allowToggle w="100%" defaultIndex={[0]}>
              {/* Investment Optimization */}
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
                        <Text textStyle="sm" fontWeight="semibold">
                          Investment Optimization
                        </Text>
                        {/* <Box
                          as="span"
                          bg="green"
                          color="#fff"
                          fontSize={12}
                          borderRadius={"20px"}
                          px={2}
                        >
                          {
                            investment_optimization?.portfolio_optimization_score
                          }
                        </Box> */}
                          <Text fontWeight="bold">
                            <Badge
                            borderRadius='4px'
                            colorScheme="green"
                            display="flex"
                            alignItems="center"
                            gap={1}
                            padding="2px 6px"
                            >
                          <Box
                            as="span"
                            className="material-symbols-outlined"
                            fontSize="18px"
                            color="green.600"
                            display="inline-flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            readiness_score
                          </Box>
                        {investment_optimization?.portfolio_optimization_score}
                      </Badge></Text>
                      </Flex>
                    </Box>
                    <AccordionIcon />
                  </Flex>
                </AccordionButton>
                <AccordionPanel>
                  {/* <Text mb={2}>
              Portfolio Optimization Score:{" "}
              <Badge colorScheme="green">{investment_optimization?.portfolio_optimization_score}</Badge>
            </Text> */}
                  <Card
                  borderRadius="8"
                  border="1px solid"
                  borderColor="gray.100"
                  boxShadow="none"
                  >
                    <CardHeader pb={0} bg="blue.400" borderRadius="8">
                      <Text
                       fontWeight="semibold"
                       textStyle="sm"
                       color="#fff"
                      >
                        AI Recommendations
                      </Text>
                    </CardHeader>
                    <CardBody>
                      
                      {investment_optimization?.ai_recommendations.map(
                        (rec: any) => (
                          <Box p={3} bg="#f4fbff" borderRadius="md" mb={3}>
                            <Text textStyle="sm" fontWeight="bold" color='blue.400' mb={2}>{rec.title}</Text>
                          <Box key={rec.recommendation_id} >
                          <StatBlock
                          label="Description"
                          value={rec.description}
                        />
                         
                          <SimpleGrid columns={2} spacing={2} mt={2}>
                            {Object.entries(rec.financial_impact).map(
                              ([k, v]: any) => (
                                <StatBlock key={k} label={k.replace(/_/g, " ")?.toLowerCase()?.replace(/\b\w/g, (char:any) => char.toUpperCase())}  value={v} />
                              )
                            )}
                          </SimpleGrid>
                          <SimpleGrid columns={2} spacing={2} mt={2}>
                              <Box textAlign="left">
                                <Text textStyle="xs" color="#6b7280">Urgency</Text>
                                <Text><Badge fontSize="10px" p="2px 6px" borderRadius={'4px'}
                                  colorScheme={
                                    rec.urgency === "HIGH" ? "red" : "yellow"
                                  }
                                >
                                  {rec.urgency}
                                </Badge></Text>
                            </Box>
                            <Box textAlign="left">
                                <Text textStyle="xs" color="#6b7280">Confidence</Text>
                                <Text textStyle="sm" fontWeight="bold">{rec.implementation_timeline}</Text>
                            </Box>
                            <StatBlock
                              label="Timeline"
                              value={rec.implementation_timeline}
                            />
                          </SimpleGrid>
                    
                        </Box>
                      </Box>
                      )
                    )}
                    <Box p={3} bg="#f4fbff" borderRadius="md">
                      <Text textStyle="sm" fontWeight="bold" color='blue.400' mb={2}>Predictive Maintenance ROI</Text>
                      <SimpleGrid columns={2} spacing={2}>
                      <StatBlock label="Total Savings Potential" value={investment_optimization?.predictive_maintenance_roi.total_savings_potential} />
                      <StatBlock label="Cost Ratio" value={investment_optimization?.predictive_maintenance_roi.prevention_vs_reactive_cost_ratio} />
                      <StatBlock label="Assets Flagged" value={investment_optimization?.predictive_maintenance_roi.assets_flagged_for_intervention} />
                      <StatBlock label="Repairs Prevented YTD" value={investment_optimization?.predictive_maintenance_roi.emergency_repairs_prevented_ytd} />
                  </SimpleGrid>
                    </Box>
                    </CardBody>
                  </Card>

                 
                </AccordionPanel>
              </AccordionItem>

              {/* Market Intelligence */}
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
                        <Text textStyle="sm" fontWeight="semibold">
                        Market Intelligence
                        </Text>
                        {/* <Box
                          as="span"
                          bg="green"
                          color="#fff"
                          fontSize={12}
                          borderRadius={"20px"}
                          px={2}
                        >
                          {
                            investment_optimization?.portfolio_optimization_score
                          }
                        </Box> */}
                      </Flex>
                    </Box>
                    <AccordionIcon />
                  </Flex>
                  </AccordionButton>
                <AccordionPanel p="4">
                <Box p={3} bg="#f4fbff" borderRadius="md" mb={3}>
                      <Text textStyle="sm" fontWeight="bold" color='blue.400' mb={2}>Market Trend Analysis</Text>
                      <SimpleGrid columns={2} spacing={2}>
                      </SimpleGrid>
                      <SimpleGrid columns={2} spacing={2}>
                    {Object.entries(
                      market_intelligence?.market_trend_analysis ?? {}
                    ).map(([k, v]: any) => (
                      <StatBlock key={k}
                        label={k.replace(/_/g, " ")}
                        value= {Array.isArray(v) ? v.join(", ") : v?.toString()}
                      />
                      // <Text key={k} fontSize="sm">
                      //   <b>{k.replace(/_/g, " ")}:</b>{" "}
                      //   {Array.isArray(v) ? v.join(", ") : v?.toString()}
                      // </Text>
                    ))}
                  </SimpleGrid>
                </Box>
                <Box p={3} bg="#f4fbff" borderRadius="md" mb={3}>
                      <Text textStyle="sm" fontWeight="bold" color='blue.400' mb={2}> Competitive Intelligence</Text>
                      <SimpleGrid columns={2} spacing={2}>
                      <StatBlock 
                        label='New Competitors'
                        value= { market_intelligence?.competitive_intelligence.new_competitors}
                      />
                      <StatBlock 
                        label='Market Share at Risk'
                        value= {`${market_intelligence?.competitive_intelligence.market_share_at_risk_pct}%`}
                      />
                      {/* <StatBlock 
                        label='Advantages'
                        value= {market_intelligence?.competitive_intelligence.competitive_advantages.join(
                          ", "
                        )}
                      /> */}
                      </SimpleGrid>
                      <Text  textStyle="sm" fontWeight="bold" color='blue.400' my={2}> Advantages</Text>
                      <SimpleGrid columns={[1]} spacing={2}>
                      {market_intelligence?.competitive_intelligence.competitive_advantages.map((data: any, idx: number) => (
                          <Box style={{position:'relative'}}>
                              <CheckIcon color='green' style={{position:'absolute',top:'4px'}} /> <Text style={{marginLeft:'22px'}} key={idx} textStyle="xs" color="#6b7280"> {data}</Text>
                          </Box>
                            ))}
                     
                       <Text  textStyle="sm" fontWeight="bold" color='blue.400' mt={2}> Threats</Text>
                     {market_intelligence?.competitive_intelligence.threats.map((data: any, idx: number) => (
                          <Box style={{position:'relative'}}>
                              <CheckIcon color='green' style={{position:'absolute',top:'4px'}} /> <Text style={{marginLeft:'22px'}} key={idx} textStyle="xs" color="#6b7280"> {data}</Text>
                          </Box>
                      ))}
                        </SimpleGrid>

                </Box>
                <Box p={3} bg="#f4fbff" borderRadius="md">
                  <Text textStyle="sm" fontWeight="bold" color='#6b7280' mb={2}>Expansion Opportunities</Text>
                  <SimpleGrid spacing={2}>
                    {market_intelligence?.expansion_opportunities.map(
                      (op: any) => (
                        <Box
                          key={op.market}
                          p={3}
                          borderWidth="1px"
                          borderRadius="lg"
                        >
                          <Text textStyle="sm" fontWeight="bold" color='blue.400' mb={2}>{op.market}</Text>
                          <SimpleGrid columns={2} spacing={2}> 
                          <StatBlock label="Opportunity Score" value={op.opportunity_score}  />
                          <StatBlock label="Investment" value={`${op.investment_required}`}  />
                          <StatBlock label="ROI" value={`${op.projected_roi_pct}%`}  />
                          <Box textAlign="left">
                            <Text fontSize="xs" color="#6b7280">Risk Level</Text>
                            <Badge fontSize="10px" p="2px 6px"
                            colorScheme={
                              op.risk_level.includes("HIGH") ? "red" : "yellow"
                            }
                          >
                            {op.risk_level}
                          </Badge>
                        </Box>
                          </SimpleGrid>
                        </Box>
                      )
                    )}
                  </SimpleGrid>
                </Box>
                </AccordionPanel>
              </AccordionItem>

              {/* Risk Analytics */}
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
                  <AccordionButton _expanded={{ bg: "gray.50" }}
                  borderTopLeftRadius="8px"
                  borderTopRightRadius="8px"
                  borderBottomLeftRadius="0px"
                  borderBottomRightRadius="0px"
                  >
                    <Flex flex="1" justify="space-between" align="center">
                    <Box textAlign="left" width={"100%"}>
                      <Flex flex="1" justify="space-between" align="center">
                        <Text textStyle="sm" fontWeight="semibold">
                        Risk Analytics
                        </Text>
                      </Flex>
                    </Box>
                    <AccordionIcon />
                  </Flex>
                  </AccordionButton>
                <AccordionPanel>
                <StatBlock label="Value at Risk (95% Confidence)" value={`${risk_analytics?.portfolio_risk_modeling.value_at_risk_95_confidence}`}  />
                <Card
                borderRadius="8"
                mt={2} 
                mb={2}
                    boxShadow="none"
                    border="1px solid"
                    borderColor="gray.200"
                >
                      <CardHeader pb={0} bg="blue.400" borderRadius="8">
                        <Text
                          fontWeight="semibold"
                          textStyle="sm"
                          color="#fff"
                        >
                          Portfolio Risk Modeling
                        </Text>
                      </CardHeader>
                      <CardBody>
                      {risk_analytics?.portfolio_risk_modeling.stress_test_scenarios.map(
                    (s: any, i: number) => (
                      <Box key={i} p={2} bg="#f4fbff" borderRadius="md">
                        <Text textStyle="sm" fontWeight="bold" color='blue.400' mb={2}>{s.scenario}</Text>
                        <SimpleGrid columns={[1,3]} spacing={2}>
                        <StatBlock label="Probability" value={`${s.probability_pct}%`} />
                        <StatBlock label="NOI Impact" value={`${s.noi_impact_pct}%`} />
                        

                        {s.occupancy_impact_pct && (
                          <StatBlock label="Occupancy Impact" value={`${s.occupancy_impact_pct}%`} />
                        )}
                        {s.revenue_at_risk && (
                          <StatBlock label="Revenue at Risk" value={`${s.revenue_at_risk}`} />
                        )}

                        </SimpleGrid>
                        <Text textStyle="sm" fontWeight="bold" color='blue.400' my={2}>Key Highlights</Text>
                        <SimpleGrid columns={[1]} spacing={2}>
                        {s.mitigation_strategies.map((data: any, idx: number) => (
                                <Box style={{position:'relative'}}>
                                    <CheckIcon color='green' style={{position:'absolute',top:'4px'}} /> <Text style={{marginLeft:'22px'}} key={idx} textStyle="sm"> {data}</Text>
                                </Box>
                            ))}
                        </SimpleGrid>
                        
                       
                      </Box>
                    )
                  )}
                      </CardBody>
                  </Card>
                  <Card
                  borderRadius="8"
                    boxShadow="none"
                    border="1px solid"
                    borderColor="gray.200"
                  >
                      <CardHeader pb={0} bg="blue.400" borderRadius="8">
                        <Text
                          fontWeight="semibold"
                          textStyle="sm"
                          color="#fff"
                        >
                          Early Warning Indicators
                        </Text>
                      </CardHeader>
                      <CardBody>
                      {risk_analytics?.early_warning_indicators.map(
                    (ind: any, i: number) => (
                      <Box key={i} p={2} bg="#f4fbff" borderRadius="md" mb={2}>
                          <StatBlock label='Indicator' value={ind.indicator} />

                          <SimpleGrid columns={[1,4]} spacing={2} mt={2}>
                          <Box textAlign="left">
                            <Text textStyle="xs" color="#6b7280">status</Text>
                            <Text><Badge fontSize="10px" p="2px 6px" colorScheme={ind.status == 'NORMAL' ? 'blue' : ind.status == 'MONITOR' ? 'yellow' : 'red' } borderRadius={'4px'}>  {ind.status } </Badge></Text>
                          </Box>
                              {/* <StatBlock label='status' value={ind.status} /> */}
                              <StatBlock label="Current Value" value={ind.current_value} />
                              <StatBlock label="Threshold" value={ind.threshold} />
                              {/* <StatBlock label="Trend" value={ind.trend} /> */}
                              <Box textAlign="left">
                              <Text fontSize="xs" color="#6b7280">status</Text>
                              <Text><Badge fontSize="10px" p="2px 6px" verticalAlign="center" colorScheme={ind.status == 'STABLE' ? 'blue' : ind.status == 'IMPROVING' ? 'yellow' : 'green' } borderRadius={'4px'}>  {ind.status } </Badge></Text>
                            </Box>
                          </SimpleGrid>
                        
                      </Box>
                    )
                  )}
                      </CardBody>
                  </Card>

                  
                </AccordionPanel>
              </AccordionItem>

              {/* AI Executive Summary */}
              <AccordionItem
              border="1px solid"
              borderColor="gray.100"
              rounded="md"
              color="#6b7280"
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
                        <Text textStyle="sm" fontWeight="semibold">
                        AI Executive Summary
                        </Text>
                      </Flex>
                    </Box>
                    <AccordionIcon />
                  </Flex>
                  </AccordionButton>
                <AccordionPanel p="4">
                  {/* <Box p={3} bg='blue.50' borderRadius="md">
                      <Text fontWeight="medium" mb={2}>Key Satisfaction Drivers </Text>
                      <SimpleGrid columns={[1, 2, 2]} spacing={2}>
                      {tenant_satisfaction?.key_satisfaction_drivers.map((data: any, idx: number) => (
                              // <Text key={sk} fontSize="sm">{sk}: {sv}</Text>
                              <StatBlock key={idx} label={data.factor} value={data.score} />
                          ))}
                      </SimpleGrid>
                  </Box> */}
                  <Box p={3} bg="#f4fbff" borderRadius="md" mb={3}>
                      <Text textStyle="sm" fontWeight="bold" color='blue.400' mb={2}>Daily Executive Brief </Text>
                      <Text textStyle="xs">{ai_executive_summary?.daily_executive_brief}</Text>
                     
                  </Box>
                  <Text textStyle="sm" fontWeight="bold" color='#6b7280' mb={2}> Strategic Priorities</Text>

                  {ai_executive_summary?.strategic_priorities.map(
                    (p: any, i: number) => (
                      <Box
                        key={i}
                         p={3} bg='#f4fbff' borderRadius="md"
                        mb={2}
                      >
                        <Text textStyle="sm" fontWeight="bold" color='blue.400' mb={2}>{p.priority}</Text>
                        <SimpleGrid columns={[1, 2, 3]} spacing={2}> 
                            <StatBlock
                            label="Timeline"
                            value={p.timeline}
                            />
                            <StatBlock
                            label="Impact"
                            value={p.expected_impact}
                            />
                            <StatBlock
                            label="Confidence"
                            value={`${p.confidence}%`}
                            />
                        </SimpleGrid> 
                      </Box>
                    )
                  )}

                  <Text  textStyle="sm" fontWeight="bold" color='blue.400' mt={3} mb={2}> Board Talking Points</Text>
                  
                  <Stack spacing={2}>
                  <SimpleGrid columns={[1]} spacing={2}>
                  {ai_executive_summary?.board_talking_points.map(
                      (data: string, i: number) => (
                       <Box style={{position:'relative'}}>
                            <CheckIcon key={i} color='green' style={{position:'absolute',top:'4px'}} /> <Text style={{marginLeft:'22px'}} key={i} textStyle="xs"> {data}</Text>
                        </Box>
                      )
                    )}
                      </SimpleGrid>
                    
                  </Stack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Box>
        </CardBody>
      </Card>
    </>
  );
};

export default AIDrivenStrategicInsightsPanel;
