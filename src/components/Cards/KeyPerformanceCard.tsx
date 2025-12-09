import { Box, Flex, Text, Badge, VStack } from "@chakra-ui/react";

interface KPIItem {
  id: number;
  label: string;
  value: string;
  color: string; // Chakra color for value
}

interface KeyPerformanceCardProps {
  headerTitle?: string;
  headerBadge?: { label: string; colorScheme: string };
  kpis: KPIItem[];
}

const KeyPerformanceCard: React.FC<KeyPerformanceCardProps> = ({
  headerTitle = "📈 Key Performance",
  headerBadge = { label: "TRENDING UP", colorScheme: "green" },
  kpis,
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

      {/* KPIs */}
      <VStack align="stretch" spacing={3}>
        {kpis.map((kpi) => (
          <Flex key={kpi.id} justify="space-between">
            <Text>{kpi.label}</Text>
            <Text fontWeight="semibold" color={kpi.color}>
              {kpi.value}
            </Text>
          </Flex>
        ))}
      </VStack>
    </Box>
  );
};

export default KeyPerformanceCard;

