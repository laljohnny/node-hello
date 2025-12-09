import { Box, Flex, Text, Badge, Button, VStack, HStack } from "@chakra-ui/react";

interface TenantImpact {
  id: number;
  name: string;
  description: string;
  impactLevel: string;
  impactColor: string; // Chakra Badge colorScheme
}

interface TenantImpactCardProps {
  headerTitle?: string;
  headerBadge?: { label: string; colorScheme: string };
  tenants: TenantImpact[];
  footerButtons?: { label: string; variant?: string; colorScheme?: string }[];
}

const TenantImpactCard: React.FC<TenantImpactCardProps> = ({
  headerTitle = "Tenant Impact Today",
  headerBadge = { label: "5 AFFECTED", colorScheme: "orange" },
  tenants,
  footerButtons = [
    { label: "Send Notifications", colorScheme: "blue" },
    { label: "View All", variant: "ghost" },
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

      {/* Tenant List */}
      <VStack align="stretch" spacing={3}>
        {tenants.map((tenant) => (
          <Flex key={tenant.id} justify="space-between" align="center">
            <Box>
              <Text fontWeight="semibold">{tenant.name}</Text>
              <Text fontSize="sm" color="gray.600">
                {tenant.description}
              </Text>
            </Box>
            <Badge colorScheme={tenant.impactColor}>{tenant.impactLevel}</Badge>
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

export default TenantImpactCard;
