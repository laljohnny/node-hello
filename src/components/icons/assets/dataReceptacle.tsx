import React from "react";

interface DataReceptacleProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const DataReceptacle: React.FC<DataReceptacleProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M33.35 90.8v11.73h3.15c1.38 0 2.45-.56 3.21-1.68.78-1.14 1.17-2.52 1.17-4.14 0-1.64-.39-3.03-1.17-4.17-.76-1.16-1.83-1.74-3.21-1.74h-3.15ZM28.31 107V86.33h8.19c2.9 0 5.19.98 6.87 2.94 1.68 1.94 2.52 4.42 2.52 7.44 0 3-.84 5.47-2.52 7.41-1.66 1.92-3.95 2.88-6.87 2.88h-8.19Zm33.58 0-1.74-4.74h-6.51L51.9 107h-5.37l7.62-20.67h5.46L67.2 107h-5.31Zm-5.04-15.87-1.86 6.81h3.87l-2.01-6.81Zm14.558-.42h-5.34v-4.38h15.69v4.38h-5.34V107h-5.01V90.71ZM96.02 107l-1.74-4.74h-6.51L86.03 107h-5.37l7.62-20.67h5.46l7.59 20.67h-5.31Zm-5.04-15.87-1.86 6.81h3.87l-2.01-6.81Z"
      fill={color}
    />
    <path
      d="M32.205 73 63.5 18.984 94.795 73h-62.59Z"
      stroke={color}
      strokeWidth={6}
      fillOpacity={0}
    />
  
  </svg>
);

export default DataReceptacle;
