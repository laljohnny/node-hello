import React from "react";

interface WiringElectricalProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const WiringElectrical: React.FC<WiringElectricalProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M104.334 31.444c-16.683 0-30.47 12.658-32.294 28.89h-3.873V20.672A3.67 3.67 0 0 0 64.5 17a3.67 3.67 0 0 0-3.666 3.673v39.66H56.96c-1.825-16.231-15.61-28.889-32.294-28.889A3.67 3.67 0 0 0 21 35.117a3.669 3.669 0 0 0 3.666 3.672c12.635 0 23.124 9.375 24.903 21.544h-6.692a3.669 3.669 0 0 0-3.666 3.672v10.773h-3.544a3.67 3.67 0 0 0-3.666 3.671v28.878A3.67 3.67 0 0 0 35.667 111h57.681a3.67 3.67 0 0 0 3.667-3.673V78.449a3.67 3.67 0 0 0-3.667-3.671h-3.544V64.005a3.669 3.669 0 0 0-3.666-3.672h-6.706c1.778-12.17 12.267-21.544 24.902-21.544A3.669 3.669 0 0 0 108 35.117a3.67 3.67 0 0 0-3.666-3.673Zm-14.651 72.212h-50.35V82.122h50.35v21.534Zm-7.211-28.888H46.544v-7.09h35.928v7.09Z"
      fill={color}
    />
  
  </svg>
);

export default WiringElectrical;
