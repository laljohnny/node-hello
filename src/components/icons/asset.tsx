import { Icon, IconProps } from "@chakra-ui/react";
import React from "react";

const Asset = (props: IconProps & any) => (
  <Icon fill="currentColor" boxSize="24px" viewBox="0 0 24 24" {...props}>
    <path d="M12 3C7 3 3 5 3 7.5S7 12 12 12s9-2 9-4.5S17 3 12 3zM21 14.5v3c0 2.5-4 4.5-9 4.5s-9-2-9-4.5v-3C3 17 7 19 12 19s9-2 9-4.5z" />
    <path d="M21 9.5v3c0 2.5-4 4.5-9 4.5s-9-2-9-4.5v-3C3 12 7 14 12 14s9-2 9-4.5z" />
  </Icon>
);

export default Asset;
