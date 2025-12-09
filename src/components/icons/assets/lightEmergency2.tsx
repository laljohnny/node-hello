import React from "react";

interface LightEmergency2Props extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const LightEmergency2: React.FC<LightEmergency2Props> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M73.32 78H55.08V50.44h17.88v5.84h-11.2v5.28h9.84v5.72h-9.84v4.88h11.56V78Z"
      fill={color}
    />
    <circle
      cx={64}
      cy={64}
      r={48}
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
  
  </svg>
);

export default LightEmergency2;
