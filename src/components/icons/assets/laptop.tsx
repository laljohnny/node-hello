import React from "react";

interface LaptopProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Laptop: React.FC<LaptopProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M75.363 94.167v2.024H52.751v-2.024H4.554V95c0 1.31.476 2.618 1.43 3.572.95.95 2.26 1.429 3.57 1.429h108.891c1.31 0 2.618-.476 3.571-1.43.951-.95 1.429-2.26 1.429-3.57v-.833H75.363ZM20.502 97.5h-4.998v-.595h4.998v.595ZM18.716 92.263h90.563a3.25 3.25 0 0 0 3.212-3.212V31.212A3.25 3.25 0 0 0 109.279 28H18.716c-.832 0-1.667.357-2.261.951a3.254 3.254 0 0 0-.951 2.261v57.836c0 .832.357 1.667.95 2.261.714.716 1.43.954 2.262.954Zm45.341-62.834c.595 0 1.07.476 1.07 1.07 0 .594-.475 1.07-1.07 1.07-.594 0-1.07-.476-1.07-1.07 0-.595.476-1.07 1.07-1.07Zm-43.436 3.569h86.875v54.267H20.621V32.998Z"
      fill={color}
    />
  
  </svg>
);

export default Laptop;
