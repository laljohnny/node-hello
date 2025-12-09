import React from "react";

interface LightFixtureProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const LightFixture: React.FC<LightFixtureProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M64 34.894c-16.274 0-29.515 13.24-29.515 29.515 0 10.915 6.03 20.876 15.523 25.913v9.831a3.064 3.064 0 0 0 3.064 3.064h21.856a3.063 3.063 0 0 0 3.063-3.064v-9.755c9.492-5.168 15.523-15.163 15.523-25.99 0-16.274-13.24-29.514-29.514-29.514Zm9.646 50.834a3.065 3.065 0 0 0-1.782 2.783v8.578H56.136v-8.68c0-1.21-.714-2.309-1.82-2.8-8.324-3.7-13.703-12.022-13.703-21.2C40.613 51.513 51.105 41.02 64 41.02c12.896 0 23.386 10.492 23.386 23.388 0 9.105-5.393 17.473-13.74 21.319ZM72.885 105.872h-17.77a3.064 3.064 0 0 0 0 6.128h17.77a3.064 3.064 0 0 0 0-6.128ZM67.064 16h-6.128v12.766h6.128V16ZM29.072 60.63H16.306v6.128h12.766V60.63ZM111.694 60.63H98.928v6.128h12.766V60.63ZM32.452 27.813l-4.308 4.357 9.09 8.988 4.308-4.358-9.09-8.987ZM95.548 27.816l-9.09 8.988 4.309 4.357 9.09-8.988-4.31-4.357Z"
      fill={color}
    />
  
  </svg>
);

export default LightFixture;
