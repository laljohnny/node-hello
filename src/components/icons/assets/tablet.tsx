import React from "react";

interface TabletProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Tablet: React.FC<TabletProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M67 21h-6a2 2 0 0 0 0 4h6a2 2 0 1 0 0-4ZM64 96.031a5.475 5.475 0 0 0-5.469 5.469A5.476 5.476 0 0 0 64 106.969a5.476 5.476 0 0 0 5.469-5.469A5.475 5.475 0 0 0 64 96.031Zm0 7.813a2.347 2.347 0 0 1-2.344-2.344A2.346 2.346 0 0 1 64 99.156a2.346 2.346 0 0 1 2.344 2.344A2.347 2.347 0 0 1 64 103.844Z"
      fill={color}
    />
    <path
      d="M93.454 14H34.546c-4.928 0-8.939 4-8.939 8.915v82.169c0 4.916 4.011 8.916 8.94 8.916h58.907c4.928 0 8.939-4 8.939-8.916V22.915c0-4.915-4.01-8.915-8.939-8.915Zm5.368 91.085c0 2.947-2.409 5.344-5.368 5.344H34.546c-2.96 0-5.367-2.397-5.367-5.344v-82.17c0-2.947 2.408-5.344 5.367-5.344h58.908c2.96 0 5.367 2.397 5.367 5.344v82.17Z"
      fill={color}
    />
  
  </svg>
);

export default Tablet;
