import React from "react";

interface PlugProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Plug: React.FC<PlugProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M103.929 107H24.071A3.072 3.072 0 0 1 21 103.929V24.071A3.071 3.071 0 0 1 24.071 21h79.858A3.07 3.07 0 0 1 107 24.071v79.858a3.07 3.07 0 0 1-3.071 3.071Zm-76.786-6.143h73.714V27.143H27.143v73.714Z"
      fill={color}
    />
    <path
      d="M64 64a3.071 3.071 0 0 1-3.071-3.071v-6.143a3.071 3.071 0 0 1 6.142 0v6.143A3.071 3.071 0 0 1 64 64ZM57.857 76.286h-3.071a3.071 3.071 0 0 1 0-6.143h3.071a3.072 3.072 0 0 1 0 6.143ZM73.214 76.286h-3.071a3.071 3.071 0 0 1 0-6.143h3.071a3.071 3.071 0 0 1 0 6.143Z"
      fill={color}
    />
    <path
      d="M64 94.714A30.714 30.714 0 1 1 94.714 64 30.75 30.75 0 0 1 64 94.714Zm0-55.285a24.572 24.572 0 1 0 24.571 24.57A24.6 24.6 0 0 0 64 39.43ZM36.357 39.428a3.071 3.071 0 1 0 0-6.142 3.071 3.071 0 0 0 0 6.142ZM36.357 94.714a3.071 3.071 0 1 0 0-6.143 3.071 3.071 0 0 0 0 6.143ZM91.643 94.714a3.071 3.071 0 1 0 0-6.143 3.071 3.071 0 0 0 0 6.143ZM91.643 39.428a3.071 3.071 0 1 0 0-6.142 3.071 3.071 0 0 0 0 6.142Z"
      fill={color}
    />
  
  </svg>
);

export default Plug;
