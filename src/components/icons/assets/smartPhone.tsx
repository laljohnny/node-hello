import React from "react";

interface SmartPhoneProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const SmartPhone: React.FC<SmartPhoneProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
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
      d="M33.548 25.905c0-6.299 5.106-11.405 11.404-11.405h38.096c6.298 0 11.404 5.106 11.404 11.405v76.19c0 6.299-5.106 11.405-11.404 11.405H44.952c-6.298 0-11.404-5.106-11.404-11.405v-76.19Zm3.762 0a7.643 7.643 0 0 1 7.642-7.643h38.096a7.643 7.643 0 0 1 7.642 7.643v76.19a7.643 7.643 0 0 1-7.642 7.643H44.952a7.643 7.643 0 0 1-7.642-7.643v-76.19Z"
      fill={color}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M47.833 16.381c0-1.039.843-1.881 1.881-1.881h28.572c1.038 0 1.88.842 1.88 1.881v4.762a6.643 6.643 0 0 1-6.642 6.643H54.476a6.643 6.643 0 0 1-6.643-6.643V16.38Zm28.572 4.762c0 1.591-1.29 2.88-2.881 2.88H54.476a2.881 2.881 0 0 1-2.88-2.88v-2.881h24.809v2.88Z"
      fill={color}
    />
  
  </svg>
);

export default SmartPhone;
