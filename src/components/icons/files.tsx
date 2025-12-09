import { Icon, IconProps } from "@chakra-ui/react";
import React from "react";

const Files = (props: IconProps & any) => (
  <Icon viewBox="0 0 24 24" fill="currentColor" boxSize="24px" {...props}>
    <path d="M15 1H8.83a2 2 0 00-1.42.59L2.59 6.41A2 2 0 002 7.83V17a2 2 0 002 2h11a2 2 0 002-2V3a2 2 0 00-2-2z" />
    <path
      d="M3.82 8L9 2.82V7a1 1 0 01-1 1H3.82zM14 13.5a.5.5 0 01-.5.5h-8a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5h8a.5.5 0 01.5.5v1z"
      fill="#0B0B0B"
    />
    <path d="M19 5v14a2 2 0 01-2 2H6a2 2 0 002 2h9a4 4 0 004-4V7a2 2 0 00-2-2z" />
  </Icon>
);

export default Files;
