import React from "react";

interface PhotoSensorProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const PhotoSensor: React.FC<PhotoSensorProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M85.114 102.479A30.88 30.88 0 0 1 64 110.789a30.877 30.877 0 0 1-21.113-8.311l-4.234 4.544A37.068 37.068 0 0 0 64 117c9.44 0 18.441-3.543 25.347-9.977l-4.233-4.544Z"
      fill={color}
    />
    <path
      d="M46.083 99.043a26.199 26.199 0 0 0 17.918 7.053 26.199 26.199 0 0 0 17.916-7.052l-4.234-4.545a20.01 20.01 0 0 1-13.682 5.386 20.009 20.009 0 0 1-13.684-5.386l-4.234 4.544Z"
      fill={color}
    />
    <path
      d="m74.563 91.147-4.234-4.545a9.256 9.256 0 0 1-6.328 2.493 9.256 9.256 0 0 1-6.33-2.493l-4.233 4.544A15.446 15.446 0 0 0 64 95.306c3.932 0 7.683-1.477 10.562-4.16ZM59.652 82.007h8.686c10.8 0 19.584-8.785 19.584-19.584V26.55h-13.3v-9.34h10.195V11H43.174v6.211h10.205v9.34H40.068v35.872c0 10.799 8.785 19.584 19.584 19.584Zm8.686-6.211h-8.686c-7.374 0-13.373-6-13.373-13.373v-2.016h35.432v2.016c0 7.374-5.999 13.373-13.373 13.373ZM59.591 17.21h8.82v9.34h-8.82v-9.34Zm22.12 15.551v21.434H46.28V32.762h35.432Z"
      fill={color}
    />
    <path d="M60.895 64.984h6.21v6.212h-6.21v-6.212Z" fill={color} />
  
  </svg>
);

export default PhotoSensor;
