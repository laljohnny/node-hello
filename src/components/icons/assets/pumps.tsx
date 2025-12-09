import React from "react";

interface PumpsProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Pumps: React.FC<PumpsProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M109 24.273V19H77.36v5.273h5.273v21.27h-5.274V40.27H61.54v15.82h-5.273V45.543H19v36.914h37.266V71.91h5.273v15.82h15.82v-5.273h5.274v21.27h-5.274V109H109v-5.273h-5.273v-21.27H109V45.543h-5.273v-21.27H109ZM40.445 66.637H24.273v-5.274h16.172v5.274Zm0-15.82v5.273H24.273v-5.274h16.172ZM24.273 71.91h16.172v5.274H24.273V71.91Zm26.72 5.274h-5.274V50.816h5.273v26.368Zm5.273-10.547v-5.274h5.273v5.274h-5.273Zm15.82 15.82h-5.273V45.543h5.273v36.914Zm15.82 21.27v-5.45h10.547v5.45H87.906Zm10.547-10.723H87.906V82.457h10.547v10.547Zm5.274-15.82H77.359V50.816h26.368v26.368Zm-15.82-31.641V34.996h10.546v10.547H87.906Zm10.546-15.82H87.906v-5.45h10.547v5.45Z"
      fill={color}
    />
    <path d="M93 67h5v5h-5v-5ZM93 56h5v5h-5v-5Z" fill={color} />
  
  </svg>
);

export default Pumps;
