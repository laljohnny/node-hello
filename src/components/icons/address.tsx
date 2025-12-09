import { Icon, IconProps } from "@chakra-ui/react";
import React from "react";

const address = (props: IconProps & any) => (
  <Icon fill="currentColor" viewBox="4 4 24 24" boxSize="20px" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15.9998 28L19.3332 21.3333H12.6665L15.9998 28Z"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15.9998 22.6667C21.1545 22.6667 25.3332 18.488 25.3332 13.3333C25.3332 8.17868 21.1545 4 15.9998 4C10.8452 4 6.6665 8.17868 6.6665 13.3333C6.6665 18.488 10.8452 22.6667 15.9998 22.6667Z"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.0002 16C17.4729 16 18.6668 14.8061 18.6668 13.3333C18.6668 11.8606 17.4729 10.6667 16.0002 10.6667C14.5274 10.6667 13.3335 11.8606 13.3335 13.3333C13.3335 14.8061 14.5274 16 16.0002 16Z"
      fill="white"
    />
  </Icon>
);

export default address;
