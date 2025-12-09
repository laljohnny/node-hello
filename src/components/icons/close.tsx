import { Icon, IconProps } from "@chakra-ui/react";
import React from "react";

const Close = (props: IconProps & any) => (
  <Icon
    fill="currentColor"
    viewBox="0 0 16 17"
    width="16px"
    height="17px"
    {...props}
  >
    <rect
      x="1.636"
      y="1"
      width="20"
      height="2"
      rx="1"
      transform="rotate(45 1.636 1)"
    />
    <rect
      x=".222"
      y="15"
      width="20"
      height="2"
      rx="1"
      transform="rotate(-45 .222 15)"
    />
  </Icon>
);

export default Close;
