import React from "react";

interface RoomProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Room: React.FC<RoomProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 32 33"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="m1 6.5 14.892-5.46a.3.3 0 0 1 .215.003L31 7M1 6.5l15 6m-15-6v5M16 31 1.197 25.572A.3.3 0 0 1 1 25.291V11.5M16 31l14.803-5.428a.3.3 0 0 0 .197-.281V12M16 31V17.295M31 7l-15 5.5M31 7v5m-15 .5v4.795m0 0L31 12m-15 5.295L1 11.5"
      stroke={color}
      strokeWidth={1}
      fillOpacity={0}
    />
    <path
      d="M19.5 24.856v-4.787a.1.1 0 0 1 .065-.093l7.8-2.925a.1.1 0 0 1 .135.093v4.787a.1.1 0 0 1-.065.093l-7.8 2.925a.1.1 0 0 1-.135-.093ZM11 29v-8.932a.1.1 0 0 0-.063-.093l-4.8-1.92a.1.1 0 0 0-.137.093V27"
      stroke={color}
      strokeWidth={1}
      fillOpacity={0}
    />
  
  </svg>
);

export default Room;
