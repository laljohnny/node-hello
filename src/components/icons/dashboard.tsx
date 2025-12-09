import { Icon, IconProps } from "@chakra-ui/react";
import React from "react";

const Dashboard = (props: IconProps & any) => (
  <Icon fill="currentColor" viewBox="0 0 24 24" boxSize="24px" {...props}>
    <rect width="1.5" height="13.222" x="3" y="5" rx=".4" />
    <path d="M20.6 17.444c.22 0 .4.18.4.4v.756a.4.4 0 01-.4.4H3.4a.4.4 0 01-.4-.4v-.756c0-.22.18-.4.4-.4h17.2z" />
    <path
      fillRule="evenodd"
      strokeWidth=".5"
      d="M9.538 9.177a.287.287 0 01.424 0l2.95 3.148a.287.287 0 00.425 0l2.553-2.723a.287.287 0 01.424 0l.372.396a.335.335 0 010 .452l-3.349 3.572a.287.287 0 01-.424 0l-2.95-3.148a.287.287 0 00-.425 0L7.36 13.198a.287.287 0 01-.424 0l-.372-.396a.335.335 0 010-.453l2.974-3.172z"
      clipRule="evenodd"
    />
    <path
      strokeWidth=".2"
      d="M17.968 10.185L16.24 8.341l1.863-.142-.134 1.986zm1.513-2.74c.026-.393-.282-.734-.669-.704l-4.186.32a.624.624 0 00-.541.43.68.68 0 00.142.693l3.886 4.145a.595.595 0 00.664.153.649.649 0 00.403-.57l.301-4.466z"
    />
  </Icon>
);

export default Dashboard;
