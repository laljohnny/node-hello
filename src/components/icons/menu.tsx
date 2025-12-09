import { Icon, IconProps } from "@chakra-ui/react";
import React from "react";

const Menu = (props: IconProps & any) => (
  <Icon
    fill="currentColor"
    color="#fff"
    width="20px"
    height="14px"
    viewBox="0 0 20 14"
    {...props}
  >
    <rect width="20" height="2" rx="1" />
    <rect y="6" width="20" height="2" rx="1" />
    <rect y="12" width="20" height="2" rx="1" />
  </Icon>
);

export default Menu;
