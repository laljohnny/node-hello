import React from "react";

interface DesktopComputerProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const DesktopComputer: React.FC<DesktopComputerProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M112.3 29.5c0-3.05-1.21-5.975-3.367-8.133A11.501 11.501 0 0 0 100.8 18H27.2a11.5 11.5 0 0 0-11.5 11.5v46A11.5 11.5 0 0 0 27.2 87h73.6c3.05 0 5.975-1.21 8.133-3.367A11.501 11.501 0 0 0 112.3 75.5v-46Zm-4.6 0v46c0 1.83-.727 3.584-2.019 4.88a6.914 6.914 0 0 1-4.881 2.02H27.2a6.912 6.912 0 0 1-4.88-2.02 6.912 6.912 0 0 1-2.02-4.88v-46c0-1.83.727-3.583 2.02-4.88a6.912 6.912 0 0 1 4.88-2.02h73.6c1.831 0 3.583.727 4.881 2.02a6.914 6.914 0 0 1 2.019 4.88Z"
      fill={color}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M77.754 84.25A2.296 2.296 0 0 0 75.5 82.4h-23a2.296 2.296 0 0 0-2.254 1.85l-4.6 22.999A2.298 2.298 0 0 0 47.9 110h32.2a2.298 2.298 0 0 0 2.254-2.751l-4.6-23ZM73.614 87l3.68 18.4H50.706l3.68-18.4h19.228Z"
      fill={color}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M91.6 105.4H36.4a2.3 2.3 0 0 0 0 4.6h55.2a2.3 2.3 0 0 0 0-4.6ZM110 68.6H18a2.3 2.3 0 0 0 0 4.6h92a2.3 2.3 0 0 0 0-4.6Z"
      fill={color}
    />
  
  </svg>
);

export default DesktopComputer;
