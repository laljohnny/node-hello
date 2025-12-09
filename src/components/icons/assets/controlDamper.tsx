import React from "react";

interface ControlDamperProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const ControlDamper: React.FC<ControlDamperProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <rect
      x={31}
      y={29}
      width={69}
      height={69}
      rx={2}
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <path
      d="M110 29v34.5m0 34.5V63.5m15 0h-15M21 29v34.5M21 98V63.5m-15 0h15"
      stroke={color}
      strokeWidth={4}
      strokeLinecap="round"
    />
    <circle
      cx={65}
      cy={64}
      r={7}
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <path
      stroke={color}
      strokeWidth={4}
      d="m68.184 56.573 18.18-18.18 4.242 4.243-18.18 18.18zM41 83.97 57.79 67.183l4.243 4.243-16.79 16.789z"
      fillOpacity={0}
    />
  
  </svg>
);

export default ControlDamper;
