import React from "react";

interface CabinetProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Cabinet: React.FC<CabinetProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M93.167 14H34.833c-4.593 0-8.333 3.737-8.333 8.333v75c0 4.596 3.74 8.334 8.333 8.334v6.25c0 1.151.932 2.083 2.084 2.083h8.333a2.082 2.082 0 0 0 2.083-2.083v-6.25h33.334v6.25c0 1.151.932 2.083 2.083 2.083h8.334a2.082 2.082 0 0 0 2.083-2.083v-6.25c4.594 0 8.333-3.737 8.333-8.334v-75c0-4.596-3.74-8.333-8.333-8.333Zm-50 95.833H39v-4.166h4.167v4.166Zm18.75-8.333H34.833a4.17 4.17 0 0 1-4.166-4.167v-75a4.17 4.17 0 0 1 4.166-4.166h27.084V101.5ZM89 109.833h-4.166v-4.166H89v4.166Zm8.334-12.5a4.17 4.17 0 0 1-4.167 4.167H66.083V18.167h27.084a4.17 4.17 0 0 1 4.166 4.166v75Z"
      fill={color}
    />
    <path
      d="M70.25 59.834a2.082 2.082 0 0 0-2.083 2.083v4.166a2.082 2.082 0 1 0 4.167 0v-4.166a2.082 2.082 0 0 0-2.084-2.084ZM57.75 68.166a2.082 2.082 0 0 0 2.084-2.083v-4.167a2.082 2.082 0 0 0-2.084-2.083 2.082 2.082 0 0 0-2.083 2.083v4.167c0 1.152.931 2.083 2.083 2.083Z"
      fill={color}
    />
  
  </svg>
);

export default Cabinet;
