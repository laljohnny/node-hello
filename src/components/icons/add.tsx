import { Icon, IconProps } from "@chakra-ui/react";
import React from "react";

const Add = (props: IconProps & any) => (
  <Icon fill="currentColor" viewBox="0 0 18 18" boxSize="18px" {...props}>
    <path
      opacity=".8"
      d="M14.25 8.625v.75a.375.375 0 01-.375.375H9.75v4.125a.375.375 0 01-.375.375h-.75a.375.375 0 01-.375-.375V9.75H4.125a.375.375 0 01-.375-.375v-.75c0-.207.168-.375.375-.375H8.25V4.125c0-.207.168-.375.375-.375h.75c.207 0 .375.168.375.375V8.25h4.125c.207 0 .375.168.375.375z"
    />
  </Icon>
);

export default Add;
