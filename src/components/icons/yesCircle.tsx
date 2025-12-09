import { Icon, IconProps } from "@chakra-ui/react";
import React from "react";

const YesCircle = (props: IconProps & any) => (
  <Icon
    fill="currentColor"
    viewBox="0 0 20 20"
    boxSize="20px"
    color="secondary.500"
    {...props}
  >
    <path
      opacity=".15"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10 20c5.523 0 10-4.477 10-10S15.523 0 10 0 0 4.477 0 10s4.477 10 10 10z"
    />
    <path d="M8.665 13.187l-2.718-2.702a.396.396 0 01-.114-.293c0-.12.038-.217.114-.293l.603-.586a.363.363 0 01.284-.13c.114 0 .215.043.301.13l1.823 1.823 3.907-3.906a.413.413 0 01.3-.13c.115 0 .21.043.286.13l.602.586a.397.397 0 01.114.293c0 .12-.038.217-.114.293L9.25 13.187a.372.372 0 01-.293.13.372.372 0 01-.293-.13z" />
  </Icon>
);

export default YesCircle;
