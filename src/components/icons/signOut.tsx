import { Icon, IconProps } from "@chakra-ui/react";
import React from "react";

const SignOut = (props: IconProps & any) => (
  <Icon fill="currentColor" viewBox="0 0 16 16" boxSize="16px" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.333 12.667H7c.184 0 .333.149.333.333v.667c0 .184-.149.333-.333.333H3.333A1.333 1.333 0 012 12.667V3.333C2 2.597 2.597 2 3.333 2H7c.184 0 .333.15.333.333V3c0 .184-.149.333-.333.333H3.333v9.334zM10.427 4.1l3.426 3.42a.513.513 0 01.147.353v.254a.5.5 0 01-.147.353l-3.426 3.42a.333.333 0 01-.474 0l-.473-.467a.333.333 0 010-.473l2.3-2.293H5a.333.333 0 01-.333-.334v-.666c0-.184.149-.334.333-.334h6.78L9.48 5.04a.327.327 0 010-.467l.473-.473a.333.333 0 01.474 0z"
    />
  </Icon>
);

export default SignOut;
