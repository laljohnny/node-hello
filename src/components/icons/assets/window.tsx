import React from "react";

interface WindowProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Window: React.FC<WindowProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M105.067 90.4h-2.934V22.933A2.934 2.934 0 0 0 99.2 20H28.8a2.933 2.933 0 0 0-2.933 2.933V90.4h-2.934A2.933 2.933 0 0 0 20 93.333v11.734A2.932 2.932 0 0 0 22.933 108h82.134a2.933 2.933 0 0 0 2.933-2.933V93.333a2.934 2.934 0 0 0-2.933-2.933Zm-8.8 0H66.933V61.067h29.334V90.4Zm0-35.2H66.933V25.867h29.334V55.2Zm-35.2-29.333V55.2H31.733V25.867h29.334Zm-29.334 35.2h29.334V90.4H31.733V61.067Zm70.4 41.066H25.867v-5.866h76.266v5.866Z"
      fill={color}
    />
  </svg>
);

export default Window;
