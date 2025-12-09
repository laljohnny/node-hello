import React from "react";

interface ThermostaticMixingValveProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const ThermostaticMixingValve: React.FC<ThermostaticMixingValveProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M108.094 50.533H94.539v-3.907a2.745 2.745 0 0 0-5.489 0v.323H73.33v-5.186a5.799 5.799 0 0 0-5.793-5.792h-.793v-5.489h8.378a2.745 2.745 0 0 0 0-5.489h-8.377v-2.248a2.745 2.745 0 0 0-5.49 0v2.248h-8.377a2.745 2.745 0 0 0 0 5.489h8.377v5.489h-.792a5.799 5.799 0 0 0-5.793 5.792v5.186H38.95v-.323a2.745 2.745 0 0 0-5.49 0v3.907H19.907a2.745 2.745 0 0 0-2.745 2.745v14.637a2.745 2.745 0 0 0 2.745 2.744H33.46v3.907a2.745 2.745 0 0 0 5.489 0v-.32h11.403v11.4h-.323a2.745 2.745 0 0 0 0 5.49h3.075v14.12A2.745 2.745 0 0 0 55.85 108h16.3a2.745 2.745 0 0 0 2.745-2.744v-14.12h3.075a2.744 2.744 0 0 0 0-5.49h-.323v-11.4H89.05v.32a2.744 2.744 0 1 0 5.49 0v-3.907h13.554a2.745 2.745 0 0 0 2.745-2.744V53.277a2.745 2.745 0 0 0-2.745-2.744Zm-47.935-8.77c0-.167.136-.303.304-.303h7.074c.168 0 .304.136.304.303v5.186H60.16v-5.186ZM22.65 65.17v-9.148h10.81v9.148H22.65Zm46.756 37.341H58.594V91.135h10.812v11.376ZM89.05 68.756H74.903a2.745 2.745 0 0 0-2.745 2.745v14.145H55.842V71.5a2.745 2.745 0 0 0-2.745-2.745H38.95V52.438h50.1v16.318Zm16.3-3.586H94.54v-9.148h10.81v9.148Z"
      fill={color}
    />
  
  </svg>
);

export default ThermostaticMixingValve;
