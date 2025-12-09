import { Box, Flex, Text, Badge, VStack, Button, HStack } from "@chakra-ui/react";

interface Contractor {
  id: number;
  title: string;
  description: string;
  status: string;
  statusColor: string; // Chakra colorScheme
}

interface ContractorActivityCardProps {
  headerTitle?: string;
  headerBadge?: { label: string; colorScheme: string };
  contractors: Contractor[];
  footerButtons?: { label: string; variant?: string; colorScheme?: string }[];
}

const ContractorActivityCard: React.FC<ContractorActivityCardProps> = ({
  headerTitle = "🔧 Today’s Contractor Activity",
  headerBadge = { label: "ON SCHEDULE", colorScheme: "green" },
  contractors,
  footerButtons = [
    { label: "Track Progress", colorScheme: "blue" },
    { label: "All Contractors", variant: "ghost" },
  ],
}) => {
  return (
    <Box bg="white" p={4} rounded="xl" shadow="md">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={3}>
        <Text fontWeight="bold">{headerTitle}</Text>
        <Badge colorScheme={headerBadge.colorScheme} px={2} py={1} rounded="md" fontSize="xs">
          {headerBadge.label}
        </Badge>
      </Flex>

      {/* Contractor List */}
      <VStack align="stretch" spacing={3}>
        {contractors.map((contractor) => (
          <Flex key={contractor.id} justify="space-between">
            <Box>
              <Text fontWeight="semibold">{contractor.title}</Text>
              <Text fontSize="sm" color="gray.600">
                {contractor.description}
              </Text>
            </Box>
            <Badge colorScheme={contractor.statusColor}>{contractor.status}</Badge>
          </Flex>
        ))}
      </VStack>

      {/* Footer */}
      <HStack mt={4} spacing={2}>
        {footerButtons.map((btn, i) => (
          <Button
            key={i}
            size="sm"
            flex="1"
            variant={btn.variant || "solid"}
            colorScheme={btn.colorScheme}
          >
            {btn.label}
          </Button>
        ))}
      </HStack>
    </Box>
  );
};

export default ContractorActivityCard;
