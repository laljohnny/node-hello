import React from "react";

interface TemperatureSensorProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const TemperatureSensor: React.FC<TemperatureSensorProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M77.155 60.87h-.626a3.132 3.132 0 1 0 0 6.264h.626a3.132 3.132 0 1 0 0-6.264ZM100.646 39.822a3.145 3.145 0 0 0-4.385 4.51 27.097 27.097 0 0 1 6.257 30.377 27.097 27.097 0 0 1-6.257 8.963 3.145 3.145 0 1 0 4.385 4.51 33.46 33.46 0 0 0 10.336-24.18 33.46 33.46 0 0 0-10.336-24.18Z"
      fill={color}
    />
    <path
      d="M88.838 49.062a3.132 3.132 0 1 0-3.947 4.823 13.155 13.155 0 0 1 5.106 10.117A13.156 13.156 0 0 1 84.89 74.12a3.132 3.132 0 0 0 1.974 5.544 2.944 2.944 0 0 0 1.973-.72 18.792 18.792 0 0 0 0-29.881ZM57.736 66.383V32.68a15.661 15.661 0 0 0-31.322 0v33.702a25.057 25.057 0 1 0 31.322 0ZM42.075 104.72a18.794 18.794 0 0 1-10.743-34.203 3.133 3.133 0 0 0 1.346-2.568V32.68a9.396 9.396 0 0 1 18.793 0v35.268a3.132 3.132 0 0 0 1.347 2.568 18.792 18.792 0 0 1-10.743 34.203Z"
      fill={color}
    />
    <path
      d="M45.207 73.994V32.68a3.132 3.132 0 0 0-6.264 0v41.313a12.53 12.53 0 1 0 6.264 0Zm-3.132 18.354a6.264 6.264 0 1 1 0-12.529 6.264 6.264 0 0 1 0 12.53Z"
      fill={color}
    />
  
  </svg>
);

export default TemperatureSensor;
