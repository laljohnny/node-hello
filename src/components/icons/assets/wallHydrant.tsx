import React from "react";

interface WallHydrantProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const WallHydrant: React.FC<WallHydrantProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M111 32v64a5 5 0 0 1-5 5H22a5 5 0 0 1-5-5V32a5 5 0 0 1 5-5h84a5 5 0 0 1 5 5Z"
      stroke={color}
      strokeWidth={6}
      fillOpacity={0}
    />
    <circle
      cx={44}
      cy={64}
      r={11}
      stroke={color}
      strokeWidth={5}
      fillOpacity={0}
    />
    <circle cx={44} cy={64} r={4} fill={color} />
    <circle cx={82} cy={64} r={5} fill={color} />
    <circle
      cx={82}
      cy={64}
      r={14}
      stroke={color}
      strokeWidth={5}
      fillOpacity={0}
    />
    <path
      d="m29 49 7.059 7.059M51.941 71.941 59 79M29 79l7.059-7.059M51.941 56.059 59 49"
      stroke={color}
      strokeWidth={5}
    />
  
  </svg>
);

export default WallHydrant;
