import { Icon, IconProps } from "@chakra-ui/react";

const Search = (props: IconProps & any) => (
  <Icon fill="currentColor" viewBox="0 0 24 24" boxSize="24px" {...props}>
    <g>
      <path d="M14.58 16.296a1.125 1.125 0 011.59-1.591l4.5 4.5a1.125 1.125 0 01-1.59 1.59l-4.5-4.5z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 9.875a7.875 7.875 0 1015.75 0 7.875 7.875 0 00-15.75 0zm13.5 0a5.625 5.625 0 11-11.25 0 5.625 5.625 0 0111.25 0z"
      />
    </g>{" "}
  </Icon>
);

export default Search;
