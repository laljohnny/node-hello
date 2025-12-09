import React from "react";

interface ElectricalProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Electrical: React.FC<ElectricalProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M93.088 55.211H69l20.8-36.833a2.949 2.949 0 0 0-.015-2.921A2.905 2.905 0 0 0 87.27 14H52.363a2.91 2.91 0 0 0-2.76 2.006l-17.455 52.93a2.948 2.948 0 0 0 .402 2.638 2.903 2.903 0 0 0 2.359 1.215h24.686l-15.726 37.132a2.94 2.94 0 0 0 1.12 3.625 2.896 2.896 0 0 0 3.734-.533l46.543-52.93c1.658-1.886.326-4.872-2.178-4.872ZM56.256 95.608l10.418-24.599c.817-1.928-.59-4.08-2.676-4.08H38.94l15.522-47.07h27.807l-20.8 36.833c-1.1 1.948.299 4.378 2.53 4.378h22.627l-30.37 34.538Z"
      fill={color}
    />
  
  </svg>
);

export default Electrical;
