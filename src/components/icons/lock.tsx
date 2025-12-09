import { Icon, IconProps } from "@chakra-ui/react";
import React from "react";

const LockIcon = (props: IconProps & any) => (
  <Icon fill="currentColor" viewBox="0 0 24 24" boxSize="24px" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M18 10V8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8V10C4.89543 10 4 10.8954 4 12V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V12C20 10.8954 19.1046 10 18 10ZM8.00002 8.00001C8.00002 5.79087 9.79088 4.00001 12 4.00001C14.2092 4.00001 16 5.79087 16 8.00001V10H8.00002V8.00001ZM13 18C13.5523 18 14 17.5523 14 17V15C14 14.4477 13.5523 14 13 14H11C10.4477 14 10 14.4477 10 15V17C10 17.5523 10.4477 18 11 18H13Z"
    />
  </Icon>
);

export default LockIcon;
