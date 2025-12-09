import React from "react";

interface GreaseTrapProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const GreaseTrap: React.FC<GreaseTrapProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M28.7 62.3 26.28 46H18V32h11.16l7.06-7.08C38.08 23.06 40.66 22 43.3 22h41.38c2.64 0 5.22 1.06 7.08 2.92L98.82 32H110v14h-8.28l-1.26 8.38-3.96-.6L98.28 42H106v-6h-8.82l-8.24-8.24A6.076 6.076 0 0 0 84.68 26H43.3c-1.58 0-3.14.64-4.24 1.76L30.84 36H22v6h7.72l2.92 19.7-3.94.6Z"
      fill={color}
    />
    <path
      d="M16 60h28v4H16v-4ZM78 78h-4v-8c0-5.52 4.48-10 10-10h28v4H84c-3.3 0-6 2.7-6 6v8Z"
      fill={color}
    />
    <path
      d="M88 78h-4v-8h28v4H88v4ZM36 42h56v4H36v-4ZM62 52h4v44h-4V52ZM16 70h28v4H16v-4Z"
      fill={color}
    />
    <path
      d="M85.92 106H42.06c-3.94 0-7.34-2.94-7.92-6.82L30.16 72.3l3.96-.58L38.1 98.6c.28 1.94 1.98 3.42 3.96 3.42h43.86c1.96 0 3.66-1.46 3.96-3.42l3.98-26.88 3.96.58-3.98 26.88c-.58 3.88-3.98 6.82-7.92 6.82Z"
      fill={color}
    />
  
  </svg>
);

export default GreaseTrap;
