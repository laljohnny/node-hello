import { Icon, IconProps } from "@chakra-ui/react";
import React from "react";

const Floor = (props: IconProps & any) => (
  <Icon fill="currentColor" viewBox="0 0 18 18" boxSize="18px" {...props}>
    <path d="m30.89 18.55c.25.49.05 1.09-.45 1.34l-14 7c-.13.07-.29.11-.44.11s-.31-.04-.45-.11l-14-7c-.49-.25-.69-.85-.45-1.34.25-.49.85-.69 1.34-.45l13.56 6.78 13.55-6.78c.5-.24 1.1-.04 1.34.45zm-29.34-4.66 14 7c.14.07.3.11.45.11s.31-.04.45-.11l14-7c.34-.17.55-.51.55-.89s-.21-.72-.55-.89l-14-7c-.28-.14-.61-.14-.89 0l-14 7c-.35.17-.56.51-.56.89s.21.72.55.89z"/>
  </Icon>
);

export default Floor;
