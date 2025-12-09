import React from "react";

interface ParkingLightProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const ParkingLight: React.FC<ParkingLightProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
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
      d="M63.03 15c10.68 0 19.382 8.746 19.382 19.508v51.195h3.829a2 2 0 0 1 1.993 1.835l1.79 21.603h4.046a1.93 1.93 0 0 1 0 3.859H66.93a1.93 1.93 0 1 1 0-3.859h4.047l1.789-21.603a2 2 0 0 1 1.993-1.835h3.83V34.508c0-8.624-6.974-15.649-15.56-15.649h-4.022l-.162.802c-1.261 6.226-6.745 10.917-13.286 10.917C38.089 30.578 32 24.46 32 16.93A1.93 1.93 0 0 1 33.93 15h29.1Zm-7.822 3.86-.47 1.332c-1.337 3.793-4.941 6.527-9.18 6.527-4.237 0-7.842-2.734-9.179-6.527l-.47-1.333h19.299Zm19.606 90.281 1.621-19.579h8.13l1.621 19.579H74.814Z"
      fill={color}
    />
  
  </svg>
);

export default ParkingLight;
