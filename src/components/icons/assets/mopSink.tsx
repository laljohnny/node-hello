import React from "react";

interface MopSinkProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const MopSink: React.FC<MopSinkProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="m102.405 90.309 5.31 3.186a2.648 2.648 0 0 1-2.724 4.54l-3.076-1.846-.461 5.529A7.941 7.941 0 0 1 93.541 109H79.46a7.941 7.941 0 0 1-7.914-7.282l-2.243-26.91a2.647 2.647 0 0 1 2.638-2.867h29.118a2.648 2.648 0 0 1 2.638 2.867l-1.292 15.5Zm-5.06-3.036.837-10.038H74.818l2.004 24.044a2.647 2.647 0 0 0 2.638 2.427h14.08a2.647 2.647 0 0 0 2.638-2.427l.678-8.126-11.718-7.03a2.647 2.647 0 1 1 2.724-4.54l9.484 5.69ZM21.648 109a2.647 2.647 0 1 1 0-5.294H64A2.647 2.647 0 1 1 64 109H21.647Zm18.53-14.559V79.882h-1.324a5.294 5.294 0 0 1-5.294-5.294V53.412a5.294 5.294 0 0 1 5.294-5.294h1.323v-26.47a2.647 2.647 0 1 1 5.295 0v26.47h1.323a5.294 5.294 0 0 1 5.294 5.294v21.176a5.294 5.294 0 0 1-5.294 5.294h-1.323v14.56h5.294a2.647 2.647 0 1 1 0 5.293H34.882a2.647 2.647 0 1 1 0-5.294h5.294Zm-1.324-41.03v21.177h7.941V53.412h-7.941Z"
      fill={color}
    />
  
  </svg>
);

export default MopSink;
