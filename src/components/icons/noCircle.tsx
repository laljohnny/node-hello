import { Icon, IconProps } from "@chakra-ui/react";
import React from "react";

const NoCircle = (props: IconProps & any) => (
  <Icon
    fill="currentColor"
    viewBox="0 0 20 20"
    boxSize="20px"
    color="orange.500"
    {...props}
  >
    <path
      opacity=".15"
      d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10A10 10 0 0010 0z"
    />
    <path d="M12.86 11.72a.444.444 0 010 .648l-.49.491a.444.444 0 01-.648 0L10 11.147 8.28 12.859a.444.444 0 01-.648 0l-.49-.49a.444.444 0 010-.648l1.712-1.722L7.14 8.278a.444.444 0 010-.648l.491-.49a.444.444 0 01.648 0L10 8.851l1.722-1.713a.444.444 0 01.648 0l.49.491a.444.444 0 010 .648l-1.712 1.721 1.712 1.722z" />
  </Icon>
);

export default NoCircle;
