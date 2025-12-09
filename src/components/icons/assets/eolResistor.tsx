import React from "react";

interface EolResistorProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const EolResistor: React.FC<EolResistorProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

      <path
        d="M29.5 11.5H28v-3A1.5 1.5 0 0 0 26.5 7H22v1h-2v8h2v1h4.5a1.5 1.5 0 0 0 1.5-1.5v-3h1.5a1 1 0 0 1 1 1V25h1V13.5a2 2 0 0 0-2-2ZM13 8h1v8h-1V8ZM10 7H5.5A1.5 1.5 0 0 0 4 8.5v3H2.5a2 2 0 0 0-2 2V25h1V13.5a1 1 0 0 1 1-1H4v3A1.5 1.5 0 0 0 5.5 17H10v-1h2V8h-2V7ZM18 8h1v8h-1V8ZM15 8h2v8h-2V8Z"
        fill={color}
      />
    
  </svg>
);

export default EolResistor;
