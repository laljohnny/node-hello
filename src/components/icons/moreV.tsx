import { Icon, IconProps } from "@chakra-ui/react";

const MoreVIcon = (props: IconProps & any) => {
  return (
    <Icon fill="currentColor" viewBox="0 0 24 24" boxSize="24px" {...props}>
      <path
        d="M12 15.984q.797 0 1.406.609t.609 1.406-.609 1.406-1.406.609-1.406-.609-.609-1.406.609-1.406T12 15.984zm0-6q.797 0 1.406.609t.609 1.406-.609 1.406-1.406.609-1.406-.609-.609-1.406.609-1.406T12 9.984zm0-1.968q-.797 0-1.406-.609t-.609-1.406.609-1.406T12 3.986t1.406.609.609 1.406-.609 1.406T12 8.016z"
        fill="currentColor"
      />
    </Icon>
  );
};

export default MoreVIcon;
