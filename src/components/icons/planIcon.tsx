import { IconProps, Text } from "@chakra-ui/react";
import React from "react";

import Briefcase from "./briefcase";
import Crown from "./crown";
import StarShip from "./starShip";
import Unlimited from "./unlimited";

interface PlanIconProps extends IconProps {
  planName: string;
}

const PlanIcon: React.FC<PlanIconProps> = ({ planName, ...props }) => {
  let icon = <StarShip {...props} />;

  switch (planName) {
    case "Premium":
      icon = <Unlimited {...props} />;
      break;
    case "Ultimate":
      icon = <Crown {...props} />;
      break;
    case "Professional":
      icon = <Briefcase {...props} />;
      break;
  }

  return <Text>{icon}</Text>;
};

export default PlanIcon;
