import React from "react";

interface GroundingCabinetProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const GroundingCabinet: React.FC<GroundingCabinetProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M64 17c-25.916 0-47 21.084-47 47s21.084 47 47 47 47-21.084 47-47-21.084-47-47-47Zm0 88.492c-22.879 0-41.492-18.613-41.492-41.492 0-22.879 18.613-41.492 41.492-41.492 22.879 0 41.492 18.613 41.492 41.492 0 22.879-18.613 41.492-41.492 41.492Z"
      fill={color}
    />
    <path
      d="M96.447 64.196H66.754V34.502a2.754 2.754 0 0 0-5.508 0v29.694H31.553a2.754 2.754 0 0 0 0 5.508h64.894a2.754 2.754 0 1 0 0-5.508ZM87.597 75.995H40.403a2.754 2.754 0 0 0 0 5.507h47.194a2.754 2.754 0 1 0 0-5.507ZM78.749 87.794H49.252a2.754 2.754 0 1 0 0 5.508h29.497a2.755 2.755 0 0 0 0-5.508Z"
      fill={color}
    />
  
  </svg>
);

export default GroundingCabinet;
