import React from "react";

interface DisconnectSwitch2Props extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const DisconnectSwitch2: React.FC<DisconnectSwitch2Props> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M24 64.5V103h100V25H24v39.5Zm0 0H2.5V25"
      stroke={color}
      strokeWidth={6}
      fillOpacity={0}
    />
  
  </svg>
);

export default DisconnectSwitch2;
