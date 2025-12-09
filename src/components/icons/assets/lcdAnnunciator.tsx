import React from "react";

interface LcdAnnunciatorProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const LcdAnnunciator: React.FC<LcdAnnunciatorProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="m27.157 64.752 2.206-47.798a1 1 0 0 1 1-.954h65.892a1 1 0 0 1 .999.954l2.206 47.798a1 1 0 0 1-1 1.046H28.157a1 1 0 0 1-.999-1.046Z"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <path
      d="m38.38 41.964.613-15.92h49.78l.612 15.92H38.381Z"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <circle
      cx={44.73}
      cy={53.923}
      r={5.661}
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <circle
      cx={83.036}
      cy={53.923}
      r={5.661}
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <path
      d="M47.879 87.165V80.44h5.577v6.726h-5.577Zm-4-6.726v6.726h-7.99l1.922-6.726h6.068ZM80.44 87.165V80.44h11.047l1.922 6.726h-12.97Zm-4-6.726v6.726H65.882V80.44H76.44Z"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <path
      d="M16 97.593 26.478 70.65a1 1 0 0 1 .932-.638h72.173a1 1 0 0 1 .936.646L111 98.36m-95-.766V110a1 1 0 0 0 1 1h93a1 1 0 0 0 1-1V98.359m-95-.766 95 .766"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
  
  </svg>
);

export default LcdAnnunciator;
