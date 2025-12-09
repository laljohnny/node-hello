import React from "react";

interface Defibrillator2Props extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Defibrillator2: React.FC<Defibrillator2Props> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M19 19v90h90V19H19Zm74.18 21.156v5.273h-5.336v5.335h-5.273V45.43h-5.335v-5.273h5.335V34.82h5.273v5.336h5.336ZM81.387 79.603 64 96.987 46.613 79.603c-5.073-5.073-5.333-13.05-.598-18.183 4.422-4.391 11.453-4.842 16.374-1.044L64 61.62l1.611-1.244c4.92-3.797 11.951-3.347 16.374 1.044 4.735 5.132 4.475 13.11-.598 18.183Zm22.34 24.124H64.718l20.398-20.395c7.1-7.1 7.408-18.318.7-25.537l-.067-.07a17.742 17.742 0 0 0-1.958-1.687h9.327v-5.335h5.335v-15.82h-5.335v-5.336h-15.82v5.335h-5.336v15.82h5.335v2.312c-4.449-1.052-9.246-.384-13.297 2.08-6.886-4.188-15.925-3.194-21.75 2.631l-.066.07c-6.708 7.22-6.4 18.437.7 25.537l20.398 20.395H24.273V24.273h79.454v79.454Z"
      fill={color}
    />
    <path
      d="M67.99 66.164h-6.004l-6.517 11.964h10.108l-3.841 7.555h5.915l6.523-12.829h-9.819l3.635-6.69Z"
      fill={color}
    />
  
  </svg>
);

export default Defibrillator2;
