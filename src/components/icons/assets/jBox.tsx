import React from "react";

interface JBoxProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const JBox: React.FC<JBoxProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      clipRule="evenodd"
      d="M104 109.5a.5.5 0 0 1-.5.5h-79a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 0-.5-.5h-15a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5h15a.5.5 0 0 0 .5-.5v-31a.5.5 0 0 0-.5-.5h-15a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5h15a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 1 .5-.5h11a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5v11a.5.5 0 0 0 .5.5h55a.5.5 0 0 1 .5.5v31a.5.5 0 0 0 .5.5h15a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-15a.5.5 0 0 0-.5.5v35Zm-12-67a.5.5 0 0 0-.5-.5h-55a.5.5 0 0 0-.5.5v15a.5.5 0 0 0 .5.5h55a.5.5 0 0 0 .5-.5v-15Z"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
  
  </svg>
);

export default JBox;
