import React from "react";

interface Xray1Props extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Xray1: React.FC<Xray1Props> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle
      cx={64}
      cy={64}
      r={47}
      stroke={color}
      strokeWidth={6}
      fillOpacity={0}
    />
    <circle
      cx={64}
      cy={64}
      r={36}
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <path
      fill={color}
      d="M57.804 68.888c-1.294-2.24-.88-4.155-.954-5.04H39.005c.086.758-.66 7.03 3.342 13.96 4.015 6.951 9.77 9.391 10.424 9.874l8.922-15.448c-.748-.519-2.603-1.12-3.889-3.346ZM88.996 63.848H71.15c-.075.91.33 2.814-.955 5.04-1.294 2.24-3.158 2.84-3.889 3.346l8.922 15.448c.615-.454 6.422-2.943 10.425-9.874 4.014-6.952 3.25-13.153 3.342-13.96ZM64 40.318c-8.03 0-13.02 3.763-13.765 4.088l8.922 15.447c.83-.392 2.273-1.694 4.843-1.694 2.588 0 4.03 1.31 4.844 1.694l8.922-15.447c-.7-.306-5.76-4.088-13.766-4.088Z"
    />
    <path
      fill={color}
      d="M64 60.114a5.205 5.205 0 0 0-5.2 5.198A5.205 5.205 0 0 0 64 70.51c2.868 0 5.201-2.332 5.201-5.198a5.205 5.205 0 0 0-5.2-5.198Z"
    />
  </svg>
);

export default Xray1;
