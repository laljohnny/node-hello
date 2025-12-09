import React from "react";

interface LightFluorescentProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const LightFluorescent: React.FC<LightFluorescentProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M124 62v-4h-4v-2a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v2H4v4h4v4H4v4h4v2a2 2 0 0 0 2 2h108a2 2 0 0 0 2-2v-2h4v-4h-4v-4h4ZM16 70h-4V58h4v12Zm92 0H20V58h88v12Zm8 0h-4V58h4v12ZM62 16h4v12h-4V16ZM28.639 31.47l2.829-2.828 8.485 8.485-2.829 2.828-8.485-8.485ZM28.63 96.52l8.486-8.485 2.828 2.828-8.485 8.486-2.828-2.829ZM62 100h4v12h-4v-12ZM88.023 90.862l2.828-2.828 8.486 8.485-2.829 2.828-8.485-8.485ZM88.028 37.137l8.485-8.485 2.829 2.828-8.486 8.485-2.828-2.828Z"
      fill={color}
      stroke={color}
    />
  
  </svg>
);

export default LightFluorescent;
