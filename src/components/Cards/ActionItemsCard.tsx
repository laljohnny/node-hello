import { Box, Flex, Text, Badge, VStack, HStack, Button, Circle } from "@chakra-ui/react";

interface ActionItem {
  id: number;
  title: string;
  description: string;
  color?: string; // optional, default color if not provided
}

interface ActionItemsCardProps {
  headerTitle?: string;
  urgentCount?: number;
  items: ActionItem[];
}

const ActionItemsCard: React.FC<ActionItemsCardProps> = ({
  headerTitle = "⚠️ Action Items",
  urgentCount = 0,
  items,
}) => {
  return (
    <Box bg="white" p={4} rounded="xl" shadow="md">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={3}>
        <Text fontWeight="bold">{headerTitle}</Text>
        {urgentCount > 0 && (
          <Badge bg="orange.400" color="black" px={2} py={1} rounded="md" fontSize="xs">
            {urgentCount} URGENT
          </Badge>
        )}
      </Flex>

      {/* Items */}
      <VStack align="stretch">
        {items.map((item, index) => (
          <Flex key={item.id} align="flex-start" gap={3}>
            <Circle
              size="6"
              bg={item.color || "orange.200"}
              fontSize="xs"
              fontWeight="bold"
            >
              {index + 1}
            </Circle>
            <Box>
              <Text fontWeight="semibold">{item.title}</Text>
              <Text fontSize="sm" color="gray.600">
                {item.description}
              </Text>
            </Box>
          </Flex>
        ))}
      </VStack>

      {/* Footer */}
      <HStack mt={4}>
        <Button size="sm" colorScheme="blue" flex="1">
          Complete Actions
        </Button>
        <Button size="sm" variant="ghost" flex="1">
          View All Tasks
        </Button>
      </HStack>
    </Box>
  );
};

export default ActionItemsCard;
