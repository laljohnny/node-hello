import React from "react";

interface LightExitProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const LightExit: React.FC<LightExitProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
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
      strokeWidth={4}
      d="M0 24h128v80H0z"
      fillOpacity={0}
    />
    <path
      d="M17.664 79V48.684h19.184v5.676h-12.76v6.908h11.176v5.588H24.088v6.468h13.156V79h-19.58Zm51.84-30.316-9.548 14.168L70.472 79H62.86l-6.732-11-6.732 11h-7.568L52.3 62.852l-9.548-14.168h7.744l5.632 9.064 5.676-9.064h7.7Zm6.873 0H82.8V79h-6.424V48.684Zm13.403 5.808v-5.808h22.88v5.808h-8.184V79h-6.512V54.492H89.78Z"
      fill={color}
    />
  
  </svg>
);

export default LightExit;
