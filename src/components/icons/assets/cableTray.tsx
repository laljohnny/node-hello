import React from "react";

interface CableTrayProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const CableTray: React.FC<CableTrayProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="m6 39.534 87.784 34.094M6 39.534v20.77L93.784 94.79M6 39.534l27.432-5.095L122 67.358m-28.216 6.27V94.79m0-21.162L122 67.358M93.784 94.79 122 87.736V67.358"
      stroke={color}
      strokeWidth={6}
      fillOpacity={0}
    />
    <path
      d="m13.054 49.33 10.19 4.144v6.046l-10.19-4.143v-6.046ZM28.73 55.6l10.189 4.144v6.046l-10.19-4.143v-6.046ZM44.406 61.872l10.189 4.142v6.047l-10.19-4.143v-6.046ZM60.081 68.142l10.19 4.142v6.047l-10.19-4.143v-6.046ZM75.757 74.412l10.189 4.143V84.6l-10.19-4.143v-6.046Z"
      fill={color}
    />
  
  </svg>
);

export default CableTray;
