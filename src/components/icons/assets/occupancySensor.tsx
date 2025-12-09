import React from "react";

interface OccupancySensorProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const OccupancySensor: React.FC<OccupancySensorProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M24 23C1.333 45.644 1.333 82.356 24 105"
      stroke={color}
      strokeWidth={6}
      fillOpacity={0}
    />
    <path
      d="M31 37c-14.667 15.188-14.667 39.812 0 55"
      stroke={color}
      strokeWidth={5}
      fillOpacity={0}
    />
    <path
      d="M104 23c22.667 22.644 22.667 59.356 0 82"
      stroke={color}
      strokeWidth={6}
      fillOpacity={0}
    />
    <path
      d="M97 37c14.667 15.188 14.667 39.812 0 55"
      stroke={color}
      strokeWidth={5}
      fillOpacity={0}
    />
    <path
      d="M69.505 37.211a6.578 6.578 0 0 0 6.605-6.605A6.578 6.578 0 0 0 69.505 24a6.578 6.578 0 0 0-6.606 6.605 6.578 6.578 0 0 0 6.606 6.606Zm.367 22.752h17.981v-6.605h-13.21l-7.34-12.11c-1.101-1.835-3.303-3.303-5.505-3.303-.734 0-1.1 0-1.835.367L40.147 44.55v19.082h6.605V50.055l7.707-2.569L40.147 104h6.605l10.642-29.725 8.44 11.376V104h6.606V80.514L63.266 64l2.569-10.642 4.037 6.605Z"
      fill={color}
    />
  
  </svg>
);

export default OccupancySensor;
