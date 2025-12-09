import { Icon, IconProps } from "@chakra-ui/react";
import React from "react";

const Asset = (props: IconProps & any) => (
  <Icon fill="currentColor" viewBox="0 0 18 18" boxSize="18px" {...props}>
    <path d="m440.9 136.3a4 4 0 0 0 0-6.91l-152.74-88.74a64.14 64.14 0 0 0 -64.33 0l-152.71 88.74a4 4 0 0 0 0 6.91l182.88 107.58a4 4 0 0 0 4.06 0z"/><path d="m54 163.51a4 4 0 0 0 -6 3.49v173.89a48 48 0 0 0 23.84 41.39l162.16 97.23a4 4 0 0 0 6-3.46v-201.75a4 4 0 0 0 -2-3.46z"/><path d="m272 275v201a4 4 0 0 0 6 3.46l162.15-97.23a48 48 0 0 0 23.85-41.34v-173.89a4 4 0 0 0 -6-3.45l-184 108a4 4 0 0 0 -2 3.45z"/>
  </Icon>
);

export default Asset;
