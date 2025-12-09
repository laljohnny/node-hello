import { CheckIcon, CloseIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  SimpleGrid,
  Text,
  VStack,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
} from "@chakra-ui/react";

type SustainabilityESGData = {
  environmental_performance: Record<string, any>;
  social_responsibility: Record<string, any>;
  governance_compliance: Record<string, any>;
  esg_ratings_benchmarks: Record<string, any>;
};

const SustainabilityESGAccordion = ({ data }: any) => {
  
  const sections = [
    { key: "environmental_performance", title: "Environmental Performance" },
    { key: "social_responsibility", title: "Social Responsibility" },
    { key: "governance_compliance", title: "Governance & Compliance" },
    { key: "esg_ratings_benchmarks", title: "ESG Ratings & Benchmarks" },
  ];

  // format metric labels
  const formatLabel = (label: string) => label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // format metric values
  const formatValue = (value: any) => {
    if (typeof value === "boolean") {
      return value ? (
        <Badge fontSize="10px" p="2px 6px" verticalAlign="center" colorScheme="green" borderRadius={'4px'}>Yes</Badge>
      ) : (
        <Badge fontSize="10px" p="2px 6px" verticalAlign="center" colorScheme="red" borderRadius={'4px'}>No</Badge>
      );
    }
    if (typeof value === "number") {
      return new Intl.NumberFormat("en-US").format(value);
    }
    if (Array.isArray(value)) {
      return (
        <VStack align="start">
          {value.map((v, i) => (
            <Text key={i} fontSize="sm">
              • {JSON.stringify(v)}
            </Text>
          ))}
        </VStack>
      );
    }
    if (typeof value === "object" && value !== null) {
      return (
        <SimpleGrid columns={[1, 3]} spacing={2}>
          {Object.entries(value).map(([k, v]) => (
            // <Card key={k} borderWidth="1px" shadow="sm">
            //   <CardBody>
            //     <Text fontSize="sm" fontWeight="bold">
            //       {formatLabel(k)}
            //     </Text>
            //     <Text fontSize="sm" color="gray.600">
            //       {formatValue(v)}
            //     </Text>
            //   </CardBody>
            // </Card>
            <Box textAlign="left" key={k}>
              <Text textStyle="xs" color="#6b7280">
                {formatLabel(k)}
              </Text>
              <Text  textStyle="sm" fontWeight="bold" color="#6b7280">{formatValue(v)}</Text>
            </Box>
          ))}
        </SimpleGrid>
      );
    }
    return value.toString();
  };

  // render section recursively
  const renderSection = (obj: Record<string, any>) => (
    <SimpleGrid columns={[1, 1]} spacing={3} mt={2}>
      {Object.entries(obj).map(([key, value]) => (
        <Card key={key}
        borderRadius='8'
        boxShadow="none"
        border="1px solid"
        borderColor="gray.200"
        >
          <CardHeader  pb={0} bg='blue.400' borderRadius='8'>
            <Text textStyle="sm" fontWeight="semibold" color='#fff'>
              {formatLabel(key)}
            </Text>
          </CardHeader>
          <CardBody>{formatValue(value)}</CardBody>
        </Card>
      ))}
    </SimpleGrid>
  );

  return (
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
                nest_eco_leaf
              </Box>

              <Heading size="md" color="#1e3a8a">{data.title}</Heading> 
            </Box>
          {/* <span onClick={() => setWorkSummaryModal(true)}><InfoOutlineIcon /></span> */}
        </Flex>
      </CardHeader>
      <CardBody>
        <Box style={{ height: "400px", overflowY: "auto" }}>
          <Accordion allowToggle w="100%" defaultIndex={[0]}>
            {sections.map((section) => (
              <AccordionItem
                key={section.key}
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
                        <Text textStyle="sm" fontWeight="semibold">{section?.title}</Text>
                      </Flex>
                    </Box>
                    <AccordionIcon />
                  </Flex>
                </AccordionButton>

                <AccordionPanel>
                  {renderSection(
                    data.data[section.key as keyof SustainabilityESGData]
                  )}
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </Box>
      </CardBody>
    </Card>
  );
};

export default SustainabilityESGAccordion;
