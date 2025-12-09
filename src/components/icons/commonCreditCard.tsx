import { Icon, IconProps } from "@chakra-ui/react";
import React from "react";

const CommonCreditCard = (props: IconProps & any) => (
  <Icon
    fill="currentColor"
    viewBox="-5 0 28 16"
    width="14"
    height="8"
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M17.333 2c0-.92-.746-1.667-1.666-1.667H2.332C1.413.333.667 1.08.667 2v10c0 .92.746 1.667 1.666 1.667h13.334c.92 0 1.666-.747 1.666-1.667V2zm-10 8.75c0 .23-.186.417-.417.417h-2.5A.417.417 0 014 10.75v-.833c0-.23.186-.417.417-.417h2.5c.23 0 .416.186.416.417v.833zM15.25 7c.23 0 .416-.187.416-.417V4.917a.417.417 0 00-.416-.417H2.75a.417.417 0 00-.417.417v1.666c0 .23.187.417.417.417h12.5z"
    />
  </Icon>
);

export default CommonCreditCard;
