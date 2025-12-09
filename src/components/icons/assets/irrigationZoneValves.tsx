import React from "react";

interface IrrigationZoneValvesProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const IrrigationZoneValves: React.FC<IrrigationZoneValvesProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M105.422 61.422H95.109A2.578 2.578 0 0 0 92.531 64v2.578H82.047v-7.734a2.578 2.578 0 0 0-2.578-2.578H76.89V45.953h7.734a2.578 2.578 0 0 0 2.578-2.578v-15.64c0-4.265-3.47-7.735-7.734-7.735H48.53c-4.264 0-7.734 3.47-7.734 7.734v15.641a2.578 2.578 0 0 0 2.578 2.578h7.734v10.313h-2.578a2.578 2.578 0 0 0-2.578 2.578v7.734H35.47V64a2.578 2.578 0 0 0-2.578-2.578H22.578A2.578 2.578 0 0 0 20 64v41.422A2.578 2.578 0 0 0 22.578 108h10.313a2.578 2.578 0 0 0 2.578-2.578v-2.578H92.53v2.578A2.578 2.578 0 0 0 95.11 108h10.313a2.578 2.578 0 0 0 2.578-2.578V64a2.578 2.578 0 0 0-2.578-2.578ZM76.891 25.156h2.578a2.581 2.581 0 0 1 2.578 2.578v13.063H76.89v-15.64Zm-46.579 77.688h-5.156v-15.64h5.157v15.64Zm0-20.797h-5.156V66.578h5.157v15.469Zm36.266-56.89h5.156v15.64h-5.156v-15.64Zm-10.312 0h5.156v15.64h-5.156v-15.64Zm0 20.796h15.468v10.313H56.266V45.953Zm-10.313-5.156V27.734a2.581 2.581 0 0 1 2.578-2.578h2.578v15.64h-5.156Zm5.156 20.625h25.782v5.156H51.109v-5.156Zm41.422 36.266H35.47V71.733H92.53v25.954Zm10.313 5.156h-5.156v-15.64h5.156v15.64Zm0-20.797h-5.156V66.578h5.156v15.469Z"
      fill={color}
    />
  
  </svg>
);

export default IrrigationZoneValves;
