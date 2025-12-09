import { Icon, IconProps } from "@chakra-ui/react";
import React from "react";

const Crown = (props: IconProps & any) => (
  <Icon
    fill="currentColor"
    viewBox="0 0 24 24"
    boxSize="40px"
    color="primary.500"
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M21.5 5h-.38a1.49994 1.49994 0 00-1.06.44L17 8.5l-4.28-4.28a.75008.75008 0 00-.53-.22h-.38a.75008.75008 0 00-.53.22L7 8.5 3.94 5.44A1.50001 1.50001 0 002.88 5H2.5c-.27614 0-.5.22386-.5.5v10c0 .2761.22386.5.5.5h19c.2761 0 .5-.2239.5-.5v-10c0-.27614-.2239-.5-.5-.5zM12 13c-1.1045 0-2-.8955-2-2 0-1.10459.8955-2.00002 2-2.00002 1.1046 0 2 .89543 2 2.00002 0 1.1045-.8954 2-2 2zm-9.5 5h19c.2761 0 .5.2238.5.5v1c0 .2761-.2239.5-.5.5h-19c-.27614 0-.5-.2239-.5-.5v-1c0-.2762.22386-.5.5-.5z"
    />
  </Icon>
);

export default Crown;
