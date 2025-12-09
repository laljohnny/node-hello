import React from "react";

interface FireAlarmCommunicatorProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const FireAlarmCommunicator: React.FC<FireAlarmCommunicatorProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <rect
      x={15}
      y={25}
      width={90}
      height={90}
      rx={5}
      stroke={color}
      strokeWidth={6}
      fillOpacity={0}
    />
    <path
      d="M95.876 7.456c11.693-3.14 23.707 3.797 26.835 15.493M97.289 15.43c7.41-1.99 15.024 2.406 17.006 9.818"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <path
      d="m91.229 67.938-5.834-5.834-23.333-23.333a2.917 2.917 0 0 0-4.124 0L34.605 62.105l-5.834 5.833a2.917 2.917 0 0 0 4.124 4.124l.855-.855v27.96a2.917 2.917 0 0 0 2.917 2.916h46.666a2.916 2.916 0 0 0 2.917-2.916v-27.96l.855.855a2.917 2.917 0 0 0 4.124-4.124ZM80.417 96.25H39.583V65.374L60 44.957l20.417 20.417V96.25Z"
      fill={color}
    />
    <path
      d="M63.038 87.32c2.884-5.121 1.677-11.564-2.871-15.321l-.008-.006.02.049-.003.036a8.916 8.916 0 0 1-.327 7.115l-.767 1.555-.235-1.718a7.286 7.286 0 0 0-1.276-3.228h-.107l-.056-.16a12.583 12.583 0 0 1-1.103 5.189 7.27 7.27 0 0 0 .38 6.679l.83 1.393-1.494-.631c-2.464-1.041-4.433-3.046-5.403-5.5a10.077 10.077 0 0 1 .539-8.501 14.378 14.378 0 0 0 1.548-4.238l.278-1.44.708 1.285a7.38 7.38 0 0 1 .743 1.972l.016.016.016.112.015-.005c2.123-2.82 3.395-6.33 3.58-9.883l.048-.921.773.504a13.8 13.8 0 0 1 6.018 9.053l.015.076.008.012.035-.05a4.615 4.615 0 0 0 .944-2.807v-1.582l.954 1.26a15.905 15.905 0 0 1 3.205 10.24c-.188 4.323-2.545 8.117-6.306 10.172l-1.628.89.911-1.618Z"
      fill={color}
    />
  
  </svg>
);

export default FireAlarmCommunicator;
