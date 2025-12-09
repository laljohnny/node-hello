import { Icon, IconProps } from "@chakra-ui/react";
import React from "react";

const BankAccount = (props: IconProps & any) => (
  <Icon
    fill="currentColor"
    viewBox="-9 0 37 21"
    width="5"
    height="4"
    {...props}
  >
    <path d="M6 0a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V2a2 2 0 00-2-2H6zm0 2h12v2H6V2zM2 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2H2V4zm4 2h12v4H6V6z" />
  </Icon>
);

export default BankAccount;
