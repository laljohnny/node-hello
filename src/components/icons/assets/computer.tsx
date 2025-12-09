import React from "react";

interface ComputerProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Computer: React.FC<ComputerProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

      <path
        d="M92.667 92.667h-73.26a3.185 3.185 0 0 1-3.185-3.186v-43a3.185 3.185 0 0 1 3.185-3.185h73.26a3.185 3.185 0 0 1 3.185 3.185v43a3.185 3.185 0 0 1-3.185 3.186Zm-70.074-6.37H89.48v-36.63H22.593v36.63Z"
        fill={color}
      />
      <path
        d="M56.037 107a3.187 3.187 0 0 1-3.185-3.185V89.481a3.185 3.185 0 1 1 6.37 0v14.334A3.183 3.183 0 0 1 56.037 107Z"
        fill={color}
      />
      <path
        d="M70.37 107H41.704a3.187 3.187 0 0 1-2.252-5.437 3.182 3.182 0 0 1 2.252-.933H70.37a3.183 3.183 0 0 1 3.186 3.185A3.184 3.184 0 0 1 70.37 107ZM108.593 107H79.926a3.187 3.187 0 0 1-3.185-3.185v-4.778a3.185 3.185 0 0 1 6.37 0v1.593h22.296V27.37H83.111v9.556a3.185 3.185 0 1 1-6.37 0v-12.74A3.185 3.185 0 0 1 79.926 21h28.667a3.185 3.185 0 0 1 3.185 3.185v79.63a3.185 3.185 0 0 1-3.185 3.185Z"
        fill={color}
      />
      <path
        d="M99.037 38.519h-9.556a3.185 3.185 0 0 1 0-6.37h9.556a3.184 3.184 0 1 1 0 6.37Z"
        fill={color}
      />
    
  </svg>
);

export default Computer;
