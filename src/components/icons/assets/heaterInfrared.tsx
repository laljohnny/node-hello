import React from "react";

interface HeaterInfraredProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const HeaterInfrared: React.FC<HeaterInfraredProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M103.268 18H24.732C20.717 23.46 18 30.042 18 36.867c0 6.83 2.72 13.412 6.732 18.867h31.182v48.875H45.133V110h37.734v-5.391H72.086V55.734h31.182c4.015-5.46 6.732-12.042 6.732-18.867 0-6.83-2.72-13.411-6.732-18.867Zm-14.83 5.39v26.954H39.562V23.39h48.876ZM23.39 36.868c0-6.01 2.794-11.281 4.144-13.476h6.637v26.953H27.53c-1.352-2.186-4.14-7.427-4.14-13.477Zm43.304 67.742h-5.39V55.734h5.39v48.875Zm33.77-54.265h-6.637V23.39h6.642c1.352 2.185 4.139 7.426 4.139 13.476 0 6.008-2.793 11.278-4.144 13.477Z"
      fill={color}
    />
    <path
      d="M44.953 28.781h38.094v5.39H44.953v-5.39ZM44.953 39.563h38.094v5.39H44.953v-5.39Z"
      fill={color}
    />
  
  </svg>
);

export default HeaterInfrared;
