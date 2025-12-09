import React from "react";

interface WaterBoilerProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const WaterBoiler: React.FC<WaterBoilerProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      clipRule="evenodd"
      d="M30 14a2 2 0 0 0-2 2v83.541a2 2 0 0 0 2 2h12.342a2 2 0 0 1 1.897 1.368l3.24 9.723A2 2 0 0 0 49.378 114h29.246a2 2 0 0 0 1.898-1.368l3.24-9.723a2 2 0 0 1 1.897-1.368H98a2 2 0 0 0 2-2V16a2 2 0 0 0-2-2H30Zm18.614 9.444a.1.1 0 0 1 .1-.1h5.658a.1.1 0 0 1 .1.1v11.554a.1.1 0 0 1-.1.1h-5.658a.1.1 0 0 1-.1-.1V23.444Zm24.914 0a.1.1 0 0 1 .1-.1h5.658a.1.1 0 0 1 .1.1v11.554a.1.1 0 0 1-.1.1h-5.658a.1.1 0 0 1-.1-.1V23.444Zm-3.3 59.41a6.228 6.228 0 1 0-12.456-.001 6.229 6.229 0 1 0 12.457 0Zm-3.3-59.41a.1.1 0 0 0-.1-.1h-5.657a.1.1 0 0 0-.1.1v11.554a.1.1 0 0 0 .1.1h5.657a.1.1 0 0 0 .1-.1V23.444Z"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
  
  </svg>
);

export default WaterBoiler;
