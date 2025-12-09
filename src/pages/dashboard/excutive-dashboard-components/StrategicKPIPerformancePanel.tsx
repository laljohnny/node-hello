import { CalendarIcon, CheckIcon } from "@chakra-ui/icons";
import {
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Box,
    Text,
    VStack,
    HStack,
    Badge,
    List,
    ListItem,
    Divider,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Card,
    CardBody,
    CardHeader,
    Heading,
    Flex,
    SimpleGrid,
    Image
  } from "@chakra-ui/react";
  
  type Panel2Props = {
    data: any;
  };
  
  const StatBlock = ({ label, value, help }: { label: string; value: string | number; help?: string }) => (
    // <Stat>
    //   <StatLabel>{label}</StatLabel>
    //   <StatNumber fontSize="lg">{value}</StatNumber>
    //   {help && <StatHelpText>{help}</StatHelpText>}
    // </Stat>
    <Box textAlign="left">
        <Text textStyle="xs" color="#6b7280">{label}</Text>
        <Text textStyle="sm" fontWeight="bold" color="#6b7280">{value}</Text>
        {/* {help && <StatHelpText>{help}</StatHelpText>} */}
    </Box>
  );
  
  export default function StrategicKPIPerformancePanel({ data }: Panel2Props) {
    if (!data) return null;
  
    const {
      operational_efficiency,
      tenant_satisfaction,
      market_positioning,
      growth_metrics,
      board_presentation_metrics,
    } = data.data;
  
    return (
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
                analytics
              </Box>

              <Heading size="md" color="#1e3a8a">Strategic KPI Performance & Market Position</Heading> 
            </Box>
        </Flex>
        </CardHeader>
        <CardBody>
          <Box style={{ height: "400px", overflowY: "auto" }}>
            <Accordion allowToggle w="100%" defaultIndex={[0]}>
              {/* Operational Efficiency */}
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
                          Operational Efficiency
                        </Text>
                      </Flex>
                    </Box>
                    <AccordionIcon />
                  </Flex>
                </AccordionButton>
                <AccordionPanel>
                  <SimpleGrid columns={[1, 1]} spacing={3} mt={2}>
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
                          Portfolio Wide Metrics
                        </Text>
                      </CardHeader>
                      <CardBody>
                      <SimpleGrid columns={[1, 2]} spacing={2}>
                      <StatBlock label="Operating Expense Ratio" value={`${operational_efficiency?.portfolio_wide_metrics.operating_expense_ratio}%`} />
                      <StatBlock label="Industry Benchmark" value={`${operational_efficiency?.portfolio_wide_metrics.industry_benchmark}%`} />
                      <StatBlock label="Performance VS Benchmark pct" value={`${operational_efficiency?.portfolio_wide_metrics.performance_vs_benchmark_pct}%`} />
                        <Box textAlign="left">
                            <Text textStyle="xs" color="#6b7280">Rank VS Peers</Text>
                            <Text textStyle="sm" fontWeight="bold"><Badge fontSize="10px" p="2px 6px" colorScheme="green" borderRadius={'4px'}>  {operational_efficiency?.portfolio_wide_metrics.rank_vs_peers } </Badge></Text>
                        </Box>
                      </SimpleGrid>
                      </CardBody>
                    </Card>
                  </SimpleGrid>

                  <SimpleGrid columns={[1, 1]} spacing={3} mt={2}>
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
                         Maintenance Efficiency
                        </Text>
                      </CardHeader>
                      <CardBody>
                      <SimpleGrid columns={[1, 2]} spacing={2}>
                      <StatBlock label="Cost Per Sqft" value={`$${operational_efficiency?.maintenance_efficiency.cost_per_sqft}`} />
                      <StatBlock label="Industry Average" value={`$${operational_efficiency?.maintenance_efficiency.industry_average}`} />
                      <StatBlock label="Efficiency Score" value={operational_efficiency?.maintenance_efficiency.efficiency_score} />
                      <StatBlock label="Preventive VS Reactive Ratio" value={operational_efficiency?.maintenance_efficiency.preventive_vs_reactive_ratio} />
                      </SimpleGrid>
                      </CardBody>
                    </Card>
                  </SimpleGrid>
                  
                  <SimpleGrid columns={[1, 1]} spacing={3} mt={2}>
                    <Card
                    borderRadius="8"
                    border="1px solid"
                    borderColor="gray.100"
                    boxShadow="none"
                    >
                      <CardHeader pb={0} bg="blue.400" borderRadius="8">
                        <Text fontWeight="semibold" textStyle="sm" color="#fff">
                         Energy Performance
                        </Text>
                      </CardHeader>
                      <CardBody>
                      <SimpleGrid columns={[1, 2]} spacing={2}>
                      <StatBlock label="Carbon Footprint Reduction" value={`$${operational_efficiency?.energy_performance.carbon_footprint_reduction_ytd_pct}`} />
                      <StatBlock label="Energy Cost Per Sqft" value={`$${operational_efficiency?.energy_performance.energy_cost_per_sqft}`} />
                      <StatBlock label="Energy Star Score Avg" value={operational_efficiency?.energy_performance.energy_star_score_avg} />
                      <StatBlock label="Portfolio Energy Efficiency" value={operational_efficiency?.energy_performance.portfolio_energy_efficiency} />
                      </SimpleGrid>
                      </CardBody>
                    </Card>
                  </SimpleGrid>

                 
                </AccordionPanel>
              </AccordionItem>

              {/* Tenant Satisfaction */}
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
                            <Text textStyle="sm" fontWeight="semibold">Tenant Satisfaction</Text>
                            </Flex>
                        </Box>
                        <AccordionIcon />
                    </Flex>
                </AccordionButton>
                <AccordionPanel p="4">
                    <SimpleGrid columns={[1, 3]} spacing={2} mb={2}>
                    <StatBlock label="Satisfaction Score" value={tenant_satisfaction?.overall_satisfaction_score}/>
                    <StatBlock label="Response Rate" value={`${tenant_satisfaction?.response_rate_pct}%`}/>
                    <StatBlock label="NPS" value={tenant_satisfaction?.net_promoter_score}/>
                    <StatBlock label="Retention Rate" value={`${tenant_satisfaction?.retention_rate_pct}%`}/>
                        <Box textAlign="left">
                            <Text textStyle="xs" color="#6b7280">Satisfaction Trend</Text>
                            <Text fontWeight="bold"><Badge fontSize="10px" p="2px 6px" borderRadius='4px' colorScheme="green">
                        {tenant_satisfaction?.satisfaction_trend}
                      </Badge></Text>
                        </Box>
                    </SimpleGrid>

                    <Box p={3} bg='#f4fbff' borderRadius="md">
                        <Text textStyle="sm" fontWeight="bold" color='blue.400' mb={2}>Key Satisfaction Drivers </Text>
                        <SimpleGrid columns={[1, 2, 2]} spacing={2}>
                        {tenant_satisfaction?.key_satisfaction_drivers.map((data: any, idx: number) => (
                                // <Text key={sk} fontSize="sm">{sk}: {sv}</Text>
                                <StatBlock key={idx} label={data.factor} value={data.score} />
                            ))}
                        </SimpleGrid>
                    </Box>
                </AccordionPanel>
              </AccordionItem>

              {/* Market Positioning */}
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
                            <Text textStyle="sm" fontWeight="semibold">Market Positioning</Text>
                            </Flex>
                        </Box>
                        <AccordionIcon />
                    </Flex>
                </AccordionButton>
                <AccordionPanel p="4">
                <SimpleGrid columns={[1, 3]} spacing={2}>
                    <StatBlock
                        label="Market Share Pcr"
                        value={`${market_positioning?.market_share_pct}%`}
                      />
                      <StatBlock
                        label="Competitive Ranking"
                        value={market_positioning?.competitive_ranking}
                      />
                      <StatBlock
                        label="Rent Premium VS Market Pct"
                        value={`${market_positioning?.rent_premium_vs_market_pct}%`}
                      />
                      <StatBlock
                        label="Portfolio Occupancy"
                        value={`${market_positioning?.occupancy_vs_market.portfolio_occupancy}%`}
                      />
                      <StatBlock
                        label="Market Avg"
                        value={`${market_positioning?.occupancy_vs_market.market_average}%`}
                      />
                      <StatBlock
                        label="Advantage Pct"
                        value={`${market_positioning?.occupancy_vs_market.advantage_pct}%`}
                      />
                      <StatBlock
                        label="Asset Quality"
                        value={market_positioning?.asset_quality_score}
                      />
                      <StatBlock
                        label="Brand Recognition"
                        value={market_positioning?.brand_recognition_score}
                      />
                </SimpleGrid>
                </AccordionPanel>
              </AccordionItem>

              {/* Growth Metrics */}
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
                            <Text textStyle="sm" fontWeight="semibold">Growth Metrics</Text>
                            </Flex>
                        </Box>
                        <AccordionIcon />
                    </Flex>
                </AccordionButton>
                <AccordionPanel p="4">
                  <SimpleGrid columns={[1, 3]} spacing={2}>
                    <StatBlock
                      label="Revenue Growth YTD"
                      value={`${growth_metrics?.revenue_growth_ytd_pct}%`}
                    />
                    <StatBlock
                      label="NOI Growth YTD"
                      value={`${growth_metrics?.noi_growth_ytd_pct}%`}
                    />
                    <StatBlock
                      label="Same Store Growth"
                      value={`${growth_metrics?.same_store_growth_pct}%`}
                    />
                    <StatBlock
                      label="New Lease Spreads"
                      value={`${growth_metrics?.new_lease_spreads_pct}%`}
                    />
                    <StatBlock
                      label="Renewal Spreads"
                      value={`${growth_metrics?.renewal_spreads_pct}%`}
                    />
                    <StatBlock
                      label="Development Pipeline Value"
                      value={`$${growth_metrics?.development_pipeline_value.toLocaleString()}`}
                    />
                  </SimpleGrid>
                </AccordionPanel>
              </AccordionItem>

              {/* Board Presentation */}
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
                            <Text textStyle="sm" fontWeight="semibold">Board Presentation</Text>
                            </Flex>
                        </Box>
                        <AccordionIcon />
                    </Flex>
                </AccordionButton>
                <AccordionPanel p="4">
                <Box p={3} bg='#f4fbff' borderRadius="md" mb={3}>
                        <Text textStyle="sm" fontWeight="bold" color='blue.400' mb={2}>Key Highlights</Text>
                        <SimpleGrid columns={[1]} spacing={2}>
                        {board_presentation_metrics?.key_highlights.map((data: any, idx: number) => (
                                <Box style={{position:'relative'}}>
                                    <CheckIcon color='green' style={{position:'absolute',top:'4px'}} /> <Text style={{marginLeft:'22px'}} key={idx} textStyle="xs"> {data}</Text>
                                </Box>
                            ))}
                        </SimpleGrid>
                </Box>
                <Box p={3} bg='#f4fbff' borderRadius="md" mb={3}>
                        <Text textStyle="sm" fontWeight="bold" color='blue.400' mb={2}>Areas of Focus</Text>
                        <SimpleGrid columns={[1]} spacing={2}>
                        {board_presentation_metrics?.areas_of_focus.map((data: any, idx: number) => (
                                <Box style={{position:'relative'}}>
                                    <CheckIcon color='green' style={{position:'absolute',top:'4px'}} /> <Text style={{marginLeft:'22px'}} key={idx} textStyle="xs"> {data}</Text>
                                </Box>
                            ))}
                        </SimpleGrid>
                </Box>
                <Box mt={3} borderRadius="md" >
                    <Text textStyle="sm" fontWeight="bold" color="#6b7280" mb={2}>Upcoming Milestones</Text>
                    <SimpleGrid columns={[1,3]} spacing={2}>
                    {board_presentation_metrics?.upcoming_milestones.map((data: any, idx: number) => (
                            <Box key={idx} textAlign='center' backgroundColor="#174899" borderRadius="8px" p={3} color='#fff'>
                                {/* <CalendarIcon />  */}
                        <Box
                          as="span"
                          className="material-symbols-outlined"
                          fontSize="20px"
                          color="#fff"
                        >
                          calendar_month
                        </Box>
                                <Text textStyle="xs" py={1}>{data.milestone} </Text>
                                <Text textStyle="sM" fontWeight="bold" > {data.date}</Text>
                            </Box>
                        ))}
                    </SimpleGrid>
                </Box>
                 
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Box>
        </CardBody>
      </Card>
    );
  }
  