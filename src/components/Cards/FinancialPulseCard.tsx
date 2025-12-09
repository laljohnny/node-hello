import { Box, Flex, Text, Badge, Button, VStack } from "@chakra-ui/react";

interface FinancialItem {
  id: number;
  label: string;
  value: string;
  color: string; // Chakra text color
}

interface FinancialPulseCardProps {
  headerTitle?: string;
  headerBadge?: { label: string; bg: string; color: string };
  financialData: FinancialItem[];
  footerButtons?: { label: string; variant?: string; colorScheme?: string }[];
}

const FinancialPulseCard: React.FC<FinancialPulseCardProps> = ({
  headerTitle = "💰 Financial Pulse",
  headerBadge = { label: "OVER BUDGET", bg: "yellow.400", color: "black" },
  financialData,
  footerButtons = [
    { label: "Review Overages", colorScheme: "blue" },
    { label: "Full Report", variant: "ghost" },
  ],
}) => {
  return (
    <Box bg="white" p={4} rounded="xl" shadow="md">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={3}>
        <Text fontWeight="bold">{headerTitle}</Text>
        <Badge
          bg={headerBadge.bg}
          color={headerBadge.color}
          px={2}
          py={1}
          rounded="md"
          fontSize="xs"
        >
          {headerBadge.label}
        </Badge>
      </Flex>

      {/* Financial Data */}
      <VStack align="stretch" spacing={3}>
        {financialData.map((item) => (
          <Flex key={item.id} justify="space-between">
            <Text>{item.label}</Text>
            <Text fontWeight="semibold" color={item.color}>
              {item.value}
            </Text>
          </Flex>
        ))}
      </VStack>

      {/* Footer */}
      <Flex mt={4} justify="space-between">
        {footerButtons.map((btn, i) => (
          <Button
            key={i}
            size="sm"
            variant={btn.variant || "solid"}
            colorScheme={btn.colorScheme}
          >
            {btn.label}
          </Button>
        ))}
      </Flex>
    </Box>
  );
};

export default FinancialPulseCard;
