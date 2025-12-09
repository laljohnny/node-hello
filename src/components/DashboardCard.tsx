import React from "react";
import { Box, Text, Button, Stack } from "@chakra-ui/react";

interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  status?: string; // optional: for things like HIGH, MEDIUM, LOW
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, children, footer, status }) => {
  return (
    <Box
      p={4}
      borderRadius="md"
      bg="white"
      shadow="sm"
      borderWidth={1}
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      height="100%"
    >
      {/* Header */}
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <Text fontSize="md" fontWeight="bold">{title}</Text>
        {status && (
          <Box
            px={2}
            py={0.5}
            bg={status === "HIGH" ? "red.100" : status === "MEDIUM" ? "yellow.100" : "green.100"}
            color={status === "HIGH" ? "red.600" : status === "MEDIUM" ? "yellow.800" : "green.600"}
            fontSize="xs"
            fontWeight="bold"
            borderRadius="md"
          >
            {status}
          </Box>
        )}
      </Box>

      {/* Content */}
      <Box flex="1">
        {children}
      </Box>

      {/* Footer */}
      {footer && <Box mt={2}>{footer}</Box>}
    </Box>
  );
};

export default DashboardCard;
