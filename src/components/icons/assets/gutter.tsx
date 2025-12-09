import React from "react";

interface GutterProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Gutter: React.FC<GutterProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M76.58 43.182v12.342l-9.826 5.366c-7.883 4.186-7.235 9.552-7.235 12.772v30.479c3.78 3.971 11.446 3.649 15.442 0v-30.48L91.59 62.93V42.86m-15.01.323v-6.01H31.117m45.462 6.01c3.024 1.36 10.26 3.198 15.01-.322m0 0v-5.688c13.391 0 20.41-6.869 20.41-16.85V20H46.02c0 .143-.001.18-.004.322-.2 9.288-6.841 16.85-15.006 16.85C22.72 37.172 16 29.484 16 20h21.49"
      stroke={color}
      strokeWidth={4}
      strokeLinecap="round"
      fillOpacity={0}
    />
  
  </svg>
);

export default Gutter;
