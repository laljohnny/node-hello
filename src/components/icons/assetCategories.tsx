import { Icon, IconProps } from "@chakra-ui/react";
import React from "react";

const AssetCategories = (props: IconProps & any) => (
  <Icon fill="currentColor" viewBox="0 0 24 24" boxSize="24px" {...props}>
    <rect x="3" y="5" width="3.176" height="3.231" rx=".5" />
    <rect x="8.294" y="5.538" width="12.706" height="2.154" rx=".4" />
    <rect x="8.294" y="10.923" width="12.706" height="2.154" rx=".4" />
    <rect x="8.294" y="16.308" width="12.706" height="2.154" rx=".4" />
    <rect x="3" y="10.385" width="3.176" height="3.231" rx=".5" />
    <rect x="3" y="15.77" width="3.176" height="3.231" rx=".5" />
  </Icon>
);

export default AssetCategories;
