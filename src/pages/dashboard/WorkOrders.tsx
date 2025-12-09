
import React, { useState } from "react";
import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Text,
  Flex,
  SimpleGrid,
  Divider,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  CardBody,
  Card,
  CardHeader,
  Heading,
  IconButton,
  Badge,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  filter
} from "@chakra-ui/react";
import { InfoOutlineIcon } from "@chakra-ui/icons";
 
type Summary = {
  total_work_orders_today: number;
  overdue_count: number;
  in_progress_count: number;
  scheduled_count: number;
  technician_utilization_pct: number;
  budget_utilized_today: number;
  budget_planned_today: number;
};
 
type Part = {
  part: string;
  qty: number;
  status: string;
};
 
type Order = {
  current_status: "CRITICAL" | "WARNING" | "HEALTHY" | string;
  work_order_id: string;
  property_id: string;
  title: string;
  priority: string;
  category: string;
  status: string;
  scheduled_date: string;
  scheduled_time: string;
  estimated_duration: number;
  assigned_technician: string | null;
  technician_skills: string[];
  technician_status?: string;
  team_size: number;
  location_detail: string;
  parts_required: Part[];
  tools_required: string[];
  vendor_involved: string | null;
  vendor_eta?: string;
  tenant_impact: string;
  access_requirements: string;
  completion_percentage: number;
  notes: string;
  due_date: string;
  cost_estimate: number;
  actual_cost: number;
  sla_status?: string;
  overdue_hours?: number;
  eta_completion?: string;
  conflict_reason?: string;
  suggested_reschedule?: string;
};
 
type WorkOrdersPanel = {
  panel_id: string;
  title: string;
  priority: number;
  refresh_interval_seconds: number;
  data: {
    summary: Summary;
    work_orders: Order[];
  };
};
 
type Props = {
  panel: WorkOrdersPanel;
};
 
const WorkOrders = ({ panel }: Props) => {
  const { summary, work_orders } = panel.data;
  const [filterWorkOrdersData, setFilterWorkOrdersData] = useState<any>(work_orders || []);
  const [workSummarymodal, setWorkSummaryModal] = useState(false);
  const handleWorkSummaryModalClose = () => setWorkSummaryModal(false);
  const filterWorkOrders =(status:string)=>{
    if(status == 'ALL'){
      setFilterWorkOrdersData(work_orders)
    }else{
      const filters = work_orders?.filter((data:any) => data.status == status)
      setFilterWorkOrdersData(filters)
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
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="sm"
              >
                assignment
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
                <MenuItem fontSize="sm" onClick={()=>filterWorkOrders('ALL')}>
                <Flex w="100%" justify="space-between" align="center">
                  <span>Total Work Orders Today</span>
                  <span className="badge">{summary?.total_work_orders_today}</span>
                </Flex>
                </MenuItem>
                <MenuItem fontSize="sm" onClick={()=>filterWorkOrders('OVERDUE')}>
                <Flex className="emergency-alert " w="100%" justify="space-between" align="center"><span>Overdue</span><span className="badge">{summary.overdue_count}</span></Flex></MenuItem>
                <MenuItem fontSize="sm" onClick={()=>filterWorkOrders('IN_PROGRESS')}>
                <Flex className="critical-alert" w="100%" justify="space-between" align="center"><span>In Progress</span> <span className="badge">{summary.in_progress_count}</span></Flex>
                </MenuItem>
                <MenuItem fontSize="sm" onClick={()=>filterWorkOrders('SCHEDULED')}>
                <Flex className="security-alert" w="100%" justify="space-between" align="center"><span>Scheduled</span> <span className="badge">{summary.scheduled_count}</span></Flex></MenuItem>
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
            <Text textStyle="xs" color="#fff">Technician Utilization</Text>
            <Text textStyle="md" fontWeight="semibold">75%</Text>
          </Box>
          <Box
            textAlign="left"
            padding="8px 16px"
            color="#fff"
            backgroundColor="#3b82f6"
            borderRadius="8px"
            width="100%"
            >
            <Text textStyle="xs" color="fff">Budget Utilized Today</Text>
            <Text textStyle="md" fontWeight="semibold">$3,200</Text>
          </Box>
          <Box
            textAlign="left"
            padding="8px 16px"
            color="#fff"
            backgroundColor="#3b82f6"
            borderRadius="8px"
            width="100%"
            >
            <Text textStyle="xs" color="fff">Budget Planned Today</Text>
            <Text textStyle="md" fontWeight="semibold">$3,850</Text>
          </Box>
        </Flex>
      <CardBody>
       <Box style={{height:'244px',overflowY:'auto'}}>
       <Accordion allowToggle w="100%" h='100%' defaultIndex={[0]}>
        {filterWorkOrdersData?.map((order:any) => (
          <AccordionItem
            key={order.work_order_id}
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
                    <Text textStyle="sm" fontWeight="semibold">{order.title}</Text>
                    {/* <Text fontSize="sm" color="gray.500">
                      {order.status} • Priority: {order.priority}
                    </Text> */}
                    <Badge mx={2} borderRadius={'4px'} fontSize={'10px'} colorScheme={order?.status === "OVERDUE" ? "red" : order?.status === "IN_PROGRESS" ? "blue" : order?.status === "PENDING_PARTS" ? "orange" : "gray" }>{order?.status}</Badge>
                  </Flex>
                </Box>
                <AccordionIcon />
              </Flex>
            </AccordionButton>
 
            <AccordionPanel pb={4}>
              {/* Responsive Grid like Summary */}
              <SimpleGrid
                columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 3 }}
                gap={3}
              >
                <Box textAlign="left">
                  <Text textStyle="xs" color="gray.500">
                    Work Order ID
                  </Text>
                  <Text textStyle="sm" fontWeight="semibold">{order.work_order_id}</Text>
                </Box>
 
                <Box textAlign="left">
                  <Text textStyle="xs" color="gray.500">
                    Property ID
                  </Text>
                  <Text textStyle="sm" fontWeight="semibold">{order.property_id}</Text>
                </Box>
 
                <Box textAlign="left">
                  <Text textStyle="xs" color="gray.500">
                    Category
                  </Text>
                  <Text textStyle="sm" fontWeight="semibold">{order.category}</Text>
                </Box>
 
                <Box textAlign="left">
                  <Text textStyle="xs" color="gray.500">
                    Priority
                  </Text>
                  <Text textStyle="sm" fontWeight="semibold">{order.priority}</Text>
                </Box>
 
                <Box textAlign="left">
                  <Text textStyle="xs" color="gray.500">
                    Status
                  </Text>
                  <Text textStyle="sm" fontWeight="semibold">{order.status}</Text>
                </Box>
 
                <Box textAlign="left">
                  <Text textStyle="xs" color="gray.500">
                    Location
                  </Text>
                  <Text textStyle="sm" fontWeight="semibold">{order.location_detail}</Text>
                </Box>
 
                <Box textAlign="left">
                  <Text textStyle="xs" color="gray.500">
                    Scheduled
                  </Text>
                  <Text textStyle="sm" fontWeight="semibold">
                    {order.scheduled_date} {order.scheduled_time}
                  </Text>
                </Box>
 
                <Box textAlign="left">
                  <Text textStyle="xs" color="gray.500">
                    Technician
                  </Text>
                  <Text textStyle="sm" fontWeight="bold">
                    {order.assigned_technician ?? "Not Assigned"}
                  </Text>
                </Box>
 
                <Box textAlign="left">
                  <Text textStyle="xs" color="gray.500">
                    Estimated Duration
                  </Text>
                  <Text textStyle="sm" fontWeight="bold">{order.estimated_duration} mins</Text>
                </Box>
 
                <Box textAlign="left">
                  <Text textStyle="xs" color="gray.500">
                    Completion
                  </Text>
                  <Text textStyle="sm" fontWeight="bold">{order.completion_percentage}%</Text>
                </Box>
 
                <Box textAlign="left">
                  <Text textStyle="xs" color="gray.500">
                    Cost Estimate
                  </Text>
                  <Text textStyle="sm" fontWeight="bold">${order.cost_estimate}</Text>
                </Box>
              </SimpleGrid>
 
              {/* Parts Required */}
              {order.parts_required.length > 0 && (
                <Box mt={4}>
                  <Text fontWeight="semibold" mb={2}>
                    Parts Required
                  </Text>
                  {order.parts_required.map((p:any, i:any) => (
                    <Text key={i} textStyle="sm">
                      - {p.part} (x{p.qty}) [{p.status}]
                    </Text>
                  ))}
                </Box>
              )}
 
              {/* Notes */}
              {order.notes && (
                <Text mt={2} textStyle="sm" fontStyle="italic" color="gray.600">
                  Notes: {order.notes}
                </Text>
              )}
            </AccordionPanel>
          </AccordionItem>
        ))}
        {filterWorkOrdersData?.length == 0 && (<Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100%"
              >
                <Text>No alerts found.</Text>
              </Box>)}
      </Accordion>
       </Box>
      </CardBody>
    </Card>


 
    <Modal isOpen={workSummarymodal} onClose={handleWorkSummaryModalClose} isCentered size='xl'>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Summary</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                <SimpleGrid columns={[2, 3, 3]} spacing={2}>
          <Box>
            <Text fontSize="xs" color="gray.500">
              Total Work Orders Today
            </Text>
            <Text fontWeight="bold">{summary.total_work_orders_today}</Text>
          </Box>
 
          <Box>
            <Text fontSize="xs" color="gray.500">
              Overdue
            </Text>
            <Text fontWeight="bold" color="red.500">
              {summary.overdue_count}
            </Text>
          </Box>
 
          <Box>
            <Text fontSize="xs" color="gray.500">
              In Progress
            </Text>
            <Text fontWeight="bold" color="orange.500">
              {summary.in_progress_count}
            </Text>
          </Box>
 
          <Box>
            <Text fontSize="xs" color="gray.500">
              Scheduled
            </Text>
            <Text fontWeight="bold" color="blue.500">
              {summary.scheduled_count}
            </Text>
          </Box>
 
          <Box>
            <Text fontSize="xs" color="gray.500">
              Technician Utilization
            </Text>
            <Text fontWeight="bold" color="green.500">
              {summary.technician_utilization_pct}%
            </Text>
          </Box>
 
          <Box>
            <Text fontSize="xs" color="gray.500">
              Budget Utilized Today
            </Text>
            <Text fontWeight="bold" color="purple.500">
              ${summary.budget_utilized_today.toLocaleString()}
            </Text>
          </Box>
 
          <Box>
            <Text fontSize="xs" color="gray.500">
              Budget Planned Today
            </Text>
            <Text fontWeight="bold" color="teal.500">
              ${summary.budget_planned_today.toLocaleString()}
            </Text>
          </Box>
        </SimpleGrid>
                </ModalBody>
      
              </ModalContent>
            </Modal>
   </>
  );
};
 
export default WorkOrders;
 
 