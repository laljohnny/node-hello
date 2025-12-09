import React from "react";

interface ClockProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Clock: React.FC<ClockProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <circle
      cx={64}
      cy={64}
      r={47}
      stroke={color}
      strokeWidth={6}
      fillOpacity={0}
    />
    <path
      d="M62 36v30h26"
      stroke={color}
      strokeWidth={6}
      fillOpacity={0}
    />
  
  </svg>
);

export default Clock;
