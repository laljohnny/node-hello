import { Icon, IconProps } from "@chakra-ui/react";
import React from "react";

const Help = (props: IconProps & any) => (
  <Icon fill="currentColor" viewBox="0 0 24 24" boxSize="24px" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 3a9 9 0 100 18 9 9 0 000-18zm.9 13.95a.45.45 0 01-.45.45h-.9a.45.45 0 01-.45-.45v-.9a.45.45 0 01.45-.45h.9a.45.45 0 01.45.45v.9zm.792-4.689a2.601 2.601 0 001.8-2.457V9.3A2.592 2.592 0 0012.9 6.708h-1.8A2.592 2.592 0 008.508 9.3v.45c0 .249.202.45.45.45h.684a.45.45 0 00.45-.45V9.3c0-.557.451-1.008 1.008-1.008h1.8A1.008 1.008 0 0113.944 9.3v.504c.001.434-.274.82-.684.963l-.855.279a1.692 1.692 0 00-1.16 1.602v.702c0 .248.2.45.45.45h.683a.45.45 0 00.45-.45v-.702c0-.047.029-.09.072-.108l.792-.279z"
    />
  </Icon>
);

export default Help;
