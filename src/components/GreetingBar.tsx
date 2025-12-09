import React, { useEffect, useState } from "react";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";

interface HeaderGreetingProps {
  name: string;
  buildingInfo: string; // Example: "Metro Plaza Complex • 3 Buildings • 450,000 sq ft"
  weather: string; // Optional: for displaying current weather
}

const HeaderGreeting: React.FC<HeaderGreetingProps> = ({ name, buildingInfo,  weather}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useAuth();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Function to get greeting based on current hour
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Format time like "7:32 AM"
  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  // Format date like "Tuesday, Dec 17, 2024"
  const formatDate = (date: Date) =>
    date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric", year: "numeric" });

  return (
    <Flex
      justify="space-between"
      align="center"
      bg="white"
      p={4}
      borderRadius="8px"
      // boxShadow="sm"
      border='1px solid'
      borderColor='gray.200'
    >
      {/* Left side */}
      <Box>
        <Heading size="xxl" fontWeight='400' color='#1e3a8a' display='flex' alignItems={'center'}> {getGreeting()}, <Text fontWeight='700' pl={1}>{user?.displayname}</Text> </Heading>
        <Text fontSize="12px" fontWeight='semibold' padding="2px 6px" background="#eff4ff" color="#1e3a8a" borderRadius="4px" marginLeft="4px" width="fit-content">{user?.properties?.roles[0].displayname == 'propertymanager' ? 'Property Manager' : 'Excutive manager'}</Text>
        {/* <Text fontSize="sm">{formatDate(currentTime)}</Text> */}
      </Box>

      {/* Right side */}
      <Box textAlign="right">
        <Heading size="lg" color="#1e3a8a">
          {formatTime(currentTime)}
        </Heading>
        <Text fontSize="sm" my={1}>{formatDate(currentTime)}{","} {weather || formatDate(currentTime)}</Text>
        <Text fontSize="sm">{buildingInfo}</Text>
        {/* <Text fontSize="sm"> {weather || formatDate(currentTime)}</Text> */}

      </Box>
    </Flex>
  );
};

export default HeaderGreeting;

