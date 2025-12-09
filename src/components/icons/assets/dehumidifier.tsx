import React from "react";

interface DehumidifierProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Dehumidifier: React.FC<DehumidifierProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M36.5 17v33a9 9 0 0 0 9 9H82a9 9 0 0 0 9-9V17h15a5 5 0 0 1 5 5v84a5 5 0 0 1-5 5H22a5 5 0 0 1-5-5V22a5 5 0 0 1 5-5h14.5Zm6 0H85v33a3 3 0 0 1-3 3H45.5a3 3 0 0 1-3-3V17Z"
      stroke={color}
      strokeWidth={6}
      fillOpacity={0}
    />
    <circle
      cx={64}
      cy={36}
      r={6}
      stroke={color}
      strokeWidth={5}
      fillOpacity={0}
    />
    <path
      d="M70.686 79c-2.517-4.956-6.186-9-6.186-9S56 79.368 56 87.063c0 2.08.513 3.837 1.395 5.228M70.686 79C72 81.587 73 84.423 73 87.063 73 91.912 69.194 96 64.5 96c-2.97 0-5.585-1.311-7.105-3.709M70.686 79l11.5-11.5M70.686 79 57.395 92.291m0 0-8.209 8.209"
      stroke={color}
      strokeWidth={5}
      fillOpacity={0}
    />
  
  </svg>
);

export default Dehumidifier;
