import { Icon, IconProps } from "@chakra-ui/react";
import { useState } from "react";

const Folder = (props: IconProps & any) => {
  const [id1] = useState(`folder_a${Math.random()}`);

  return (
    <Icon width="12" height="auto" viewBox="0 0 48 48" {...props}>
      <path
        d="M6.24 12.502a2 2 0 012-2h10.59a2 2 0 011.506.683l1.29 1.476a2 2 0 001.506.683H39.76a2 2 0 012 2v5.946a2 2 0 01-2 2H8.24a2 2 0 01-2-2v-8.788z"
        fill="#FFB804"
      />
      <path
        d="M39.76 27.552a2 2 0 012 2v5.946a2 2 0 01-2 2H8.24a2 2 0 01-2-2v-5.946a2 2 0 012-2H39.76z"
        fill="#C79040"
      />
      <path
        d="M6.24 18.896a2 2 0 012-2h10.812a2 2 0 001.638-.853l1.292-1.846a2 2 0 011.639-.853h16.14a2 2 0 012 2v18.733a2 2 0 01-2 2H8.24a2 2 0 01-2-2V18.896z"
        fill="#FDD768"
      />
      <mask
        id={id1}
        style={{
          maskType: "alpha",
        }}
        maskUnits="userSpaceOnUse"
        x={6}
        y={13}
        width={36}
        height={24}
      >
        <path
          d="M6.24 18.896a2 2 0 012-2h10.812a2 2 0 001.638-.853l1.292-1.846a2 2 0 011.639-.853h16.14a2 2 0 012 2v18.733a2 2 0 01-2 2H8.24a2 2 0 01-2-2V18.896z"
          fill="#FDD768"
        />
      </mask>
      <g mask={`url(#${id1})`}>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M23.334 12.9l-2.557 3.835a1.44 1.44 0 01-1.198.641H6.24v-.96h13.34c.16 0 .31-.08.399-.214l2.556-3.835.799.533z"
          fill="#FFEC82"
        />
      </g>
    </Icon>
  );
};

export default Folder;
