import React from "react";

interface RefrigerantCopperPipingProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const RefrigerantCopperPiping: React.FC<RefrigerantCopperPipingProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M29 32.5h70M29 48.5h70M29 64.5h70M29 80.5h70M29 96.5h70M29 48.5c-4.418 0-8-3.181-8-7.742s3.582-8.258 8-8.258M29 80.5c-4.418 0-8-3.181-8-7.742s3.582-8.258 8-8.258M99 96.5c4.418 0 8-3.181 8-7.742s-3.582-8.258-8-8.258M99 64.5c4.418 0 8-3.181 8-7.742s-3.582-8.258-8-8.258M107 24.242c0 4.56-3.582 8.258-8 8.258M21 104.758c0-4.561 3.582-8.258 8-8.258M33 40v8M33 71v8M33 55v8M33 87v8M49 40v8M49 71v8M49 55v8M49 87v8M65 40v8M65 71v8M65 55v8M65 87v8M81 40v8M81 71v8M81 55v8M81 87v8M97 40v8M97 71v8M97 55v8M97 87v8"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
  
  </svg>
);

export default RefrigerantCopperPiping;
