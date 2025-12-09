import { Icon, IconProps } from "@chakra-ui/react";

const AddCircle = (props: IconProps & any) => (
  <Icon fill="currentColor" viewBox="0 0 24 24" boxSize="18px" {...props}>
    <circle cx="12" cy="12" r="12" />
    <path fill="#fff" d="M11.25 8.25h1.5v7.5h-1.5z" />
    <path fill="#fff" d="M8.25 12.75v-1.5h7.5v1.5z" />
  </Icon>
);

export default AddCircle;
