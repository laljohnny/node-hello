import React from "react";

interface DimmingSwitchProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const DimmingSwitch: React.FC<DimmingSwitchProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <rect
      x={17}
      y={17}
      width={94}
      height={94}
      rx={5}
      stroke={color}
      strokeWidth={6}
      fillOpacity={0}
    />
    <path
      d="M85.797 61H69.625v6h16.172C84.334 77.731 75.133 86 64 86c-12.15 0-22-9.85-22-22s9.85-22 22-22c11.133 0 20.334 8.269 21.797 19Z"
      stroke={color}
      strokeWidth={6}
      fillOpacity={0}
    />
    <path
      stroke={color}
      strokeWidth={4}
      d="M29 92h12M84 91.5h15M91.5 99V84"
    />
  
  </svg>
);

export default DimmingSwitch;
