import React from "react";

interface SubMeterProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const SubMeter: React.FC<SubMeterProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M96.57 18.333 101 28H27l4.894-9.789A4 4 0 0 1 35.472 16h57.461a4 4 0 0 1 3.636 2.333ZM26 94.128V88h76v7.149l-5.512 14.291a4 4 0 0 1-3.732 2.56H35.302a4 4 0 0 1-3.76-2.633L26 94.127Z"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <rect
      x={16}
      y={28}
      width={96}
      height={60}
      rx={2}
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <rect x={45} y={94} width={5} height={12} rx={2.5} fill={color} />
    <rect x={56} y={94} width={5} height={12} rx={2.5} fill={color} />
    <rect x={67} y={94} width={5} height={12} rx={2.5} fill={color} />
    <rect x={78} y={94} width={5} height={12} rx={2.5} fill={color} />
    <rect
      x={27}
      y={39}
      width={74}
      height={30}
      rx={2}
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <circle cx={73} cy={52} r={3} fill={color} />
    <circle cx={61} cy={52} r={3} fill={color} />
    <circle cx={85} cy={52} r={3} fill={color} />
    <path
      stroke={color}
      strokeWidth={4}
      strokeLinecap="round"
      d="M51 76h8M71 76h8M91 76h8"
    />
  
  </svg>
);

export default SubMeter;
