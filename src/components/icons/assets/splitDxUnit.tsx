import React from "react";

interface SplitDxUnitProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const SplitDxUnit: React.FC<SplitDxUnitProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M17.67 25v42.107h92.659V25H17.671Zm87.23 36.678h-7.299V50.819H30.399v10.859h-7.3V30.429H104.9v31.249Zm-69.072 0v-5.43h56.344v5.43H35.828Z"
      fill={color}
    />
    <path
      d="M69.007 39.96h5.43v5.43h-5.43v-5.43ZM80.59 39.96h5.429v5.43h-5.43v-5.43ZM92.172 39.96H97.6v5.43h-5.43v-5.43ZM61.285 74.044h5.43V103h-5.43V74.044ZM49.703 82.256c0 6.385-5.195 11.58-11.58 11.58a7.038 7.038 0 0 1-7.03-7.03 3.932 3.932 0 0 1 3.927-3.927c1 0 1.814.813 1.814 1.813h5.429c0-3.994-3.25-7.242-7.243-7.242-5.159 0-9.357 4.197-9.357 9.356 0 6.87 5.59 12.46 12.46 12.46 9.379 0 17.01-7.631 17.01-17.01v-8.212h-5.43v8.212ZM92.98 77.45c-3.994 0-7.243 3.248-7.243 7.242h5.43c0-1 .813-1.813 1.813-1.813a3.932 3.932 0 0 1 3.927 3.927 7.038 7.038 0 0 1-7.03 7.03c-6.385 0-11.58-5.195-11.58-11.58v-8.212h-5.43v8.212c0 9.379 7.631 17.01 17.01 17.01 6.87 0 12.46-5.59 12.46-12.46 0-5.159-4.198-9.356-9.357-9.356Z"
      fill={color}
    />
  
  </svg>
);

export default SplitDxUnit;
