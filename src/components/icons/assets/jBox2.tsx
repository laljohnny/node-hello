import React from "react";

interface JBox2Props extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const JBox2: React.FC<JBox2Props> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="m55.12 81.44.6-6c.907.32 2.187.48 3.84.48.853 0 1.48-.293 1.88-.88.427-.587.64-1.36.64-2.32V45.44h6.76v27.28c0 2.8-.76 5.08-2.28 6.84-1.493 1.76-3.827 2.64-7 2.64-1.467 0-2.947-.253-4.44-.76Z"
      fill={color}
    />
    <circle
      cx={64}
      cy={64}
      r={47}
      stroke={color}
      strokeWidth={6}
      fillOpacity={0}
    />
  
  </svg>
);

export default JBox2;
