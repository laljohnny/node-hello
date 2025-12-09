import React from "react";

interface Transformer3Props extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Transformer3: React.FC<Transformer3Props> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      stroke={color}
      strokeWidth={5}
      d="M26.5 15.5h75v75h-75z"
      fillOpacity={0}
    />
    <path
      d="M52 37a6 6 0 0 1-12 0M76 69a6 6 0 0 1 12 0M64 37a6 6 0 0 1-12 0M64 69a6 6 0 0 1 12 0M76 37a6 6 0 0 1-12 0M52 69a6 6 0 0 1 12 0M88 37a6 6 0 0 1-12 0M40 69a6 6 0 0 1 12 0M40 49.5h48M64 38V22M64 84V68M40 56.5h48"
      stroke={color}
      strokeWidth={5}
      fillOpacity={0}
    />
    <path
      d="M89.5 115h10M86 109h16M84 103h20"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <circle cx={64} cy={23} r={5} fill={color} />
    <circle cx={64} cy={83} r={5} fill={color} />
    <path
      d="m64 67 30.5 29v17"
      stroke={color}
      strokeWidth={5}
      fillOpacity={0}
    />
  
  </svg>
);

export default Transformer3;
