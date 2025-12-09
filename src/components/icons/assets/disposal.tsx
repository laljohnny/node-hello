import React from "react";

interface DisposalProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Disposal: React.FC<DisposalProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <rect
      x={51}
      y={39}
      width={45}
      height={38}
      rx={2}
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <rect
      x={57.741}
      y={78.014}
      width={31.59}
      height={32.986}
      rx={2}
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <path
      d="M33 75V41a2 2 0 0 1 2-2h15v38H34.994C33.894 77 33 76.11 33 75ZM57 78v33H40c-1.11 0-2-.892-2-1.991V78h19Z"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <path
      d="M50 32.5h28a2.5 2.5 0 0 1 2.5 2.5v3.5h-33V35a2.5 2.5 0 0 1 2.5-2.5ZM49.971 22.176h27.59a2.5 2.5 0 0 0 2.5-2.5V17.5h-32.59v2.176a2.5 2.5 0 0 0 2.5 2.5ZM51.658 22.978v9.072M56.543 22.978v9.072M61.428 22.978v9.072M66.313 22.978v9.072M71.198 22.978v9.072M76.083 22.978v9.072"
      stroke={color}
      strokeWidth={3}
      fillOpacity={0}
    />
    <path
      stroke={color}
      strokeWidth={4}
      d="M52 52h43M34 52h15M52 62h43M34 62h15M65.417 78.014H80.26v14.238a2 2 0 0 1-2 2H67.417a2 2 0 0 1-2-2V78.014Z"
      fillOpacity={0}
    />
    <circle cx={72.838} cy={86.133} r={3.14} fill={color} />
  
  </svg>
);

export default Disposal;
