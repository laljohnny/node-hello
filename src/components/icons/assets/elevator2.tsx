import React from "react";

interface Elevator2Props extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Elevator2: React.FC<Elevator2Props> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M112 5.333H16A2.666 2.666 0 0 0 13.333 8v112A2.666 2.666 0 0 0 16 122.667h96a2.666 2.666 0 0 0 2.667-2.667V8A2.666 2.666 0 0 0 112 5.333Zm-77.333 112v-88h26.666v88H34.667Zm32 0v-88h26.666v88H66.667Zm42.666 0H98.667V26.667A2.666 2.666 0 0 0 96 24H32a2.666 2.666 0 0 0-2.667 2.667v90.666H18.667V10.667h90.666v106.666Z"
      fill={color}
    />
    <path
      d="M104.053 72c3.488-.016 3.488-5.317 0-5.334-3.509-.007-3.501 5.323 0 5.334ZM104.053 80c3.488-.016 3.488-5.317 0-5.334-3.509-.007-3.501 5.323 0 5.334ZM58.667 21.333h10.666c3.486-.013 3.491-5.32 0-5.333H58.667c-3.486.013-3.491 5.32 0 5.333Z"
      fill={color}
    />
  
  </svg>
);

export default Elevator2;
