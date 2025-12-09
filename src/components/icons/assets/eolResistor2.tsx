import React from "react";

interface EolResistor2Props extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const EolResistor2: React.FC<EolResistor2Props> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M93.777 81.448a2.962 2.962 0 0 1-2.722-1.831l-9.96-23.7-8 23.5a2.969 2.969 0 0 1-2.773 2.031h-.026a2.966 2.966 0 0 1-2.781-1.98L59.223 56.43l-8.058 23.013a2.968 2.968 0 0 1-2.731 2.005 2.96 2.96 0 0 1-2.808-1.893l-6.218-15.748H24.592v-6.043h16.817c1.209 0 2.297.75 2.748 1.893l4.052 10.26 8.186-23.378c.42-1.198 1.53-2 2.777-2.006h.013c1.242 0 2.353.79 2.781 1.98l8.252 22.929 7.789-22.878a2.97 2.97 0 0 1 2.694-2.029 2.958 2.958 0 0 1 2.828 1.83l9.813 23.353 3.013-9.834c.387-1.261 1.532-2.12 2.828-2.12H116v6.043h-14.639l-4.755 15.52a2.973 2.973 0 0 1-2.829 2.121ZM24.592 63.807V23H19V95.07h5.592V63.807Z"
      fill={color}
    />
  
  </svg>
);

export default EolResistor2;
