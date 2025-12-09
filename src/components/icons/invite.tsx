import { Icon, IconProps } from "@chakra-ui/react";
import React from "react";

const InviteIcon = (props: IconProps & any) => (
  <Icon fill="currentColor" viewBox="0 0 24 24" boxSize="24px" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 4H20C21.1046 4 22 4.89543 22 6V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V6C2 4.89543 2.89543 4 4 4ZM13.65 15.45L20 11V8.9L12.65 14.05C12.2591 14.3213 11.7409 14.3213 11.35 14.05L4 8.9V11L10.35 15.45C11.341 16.1427 12.659 16.1427 13.65 15.45Z"
    />
  </Icon>
);

export default InviteIcon;
