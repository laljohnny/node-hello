import React from "react";

interface FireAlarmProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const FireAlarm: React.FC<FireAlarmProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M43.297 36.438a1 1 0 0 0-1-1h-3.86a1 1 0 0 0-1 1v3.859a1 1 0 0 0 1 1h3.86a1 1 0 0 0 1-1v-3.86ZM59.052 36.438a1 1 0 0 0-1-1h-3.859a1 1 0 0 0-1 1v3.859a1 1 0 0 0 1 1h3.86a1 1 0 0 0 1-1v-3.86ZM68.948 36.438a1 1 0 0 1 1-1h3.859a1 1 0 0 1 1 1v3.859a1 1 0 0 1-1 1h-3.86a1 1 0 0 1-1-1v-3.86ZM90.563 36.438a1 1 0 0 0-1-1h-3.86a1 1 0 0 0-1 1v3.859a1 1 0 0 0 1 1h3.86a1 1 0 0 0 1-1v-3.86Z"
      fill={color}
    />
    <path
      d="M38.438 49.156a1 1 0 0 0-1 1v15.969a1 1 0 0 0 1 1h51.124a1 1 0 0 0 1-1V50.156a1 1 0 0 0-1-1H38.438Z"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <path
      clipRule="evenodd"
      d="M20.25 14A6.25 6.25 0 0 0 14 20.25v87.5a6.25 6.25 0 0 0 6.25 6.25h87.5a6.25 6.25 0 0 0 6.25-6.25v-87.5a6.25 6.25 0 0 0-6.25-6.25h-87.5Zm6.469 11.719a1 1 0 0 0-1 1v50.589a1 1 0 0 0 .685.949L48.29 85.51c.601.2 1.232-.204 1.359-.825C51.012 78.008 56.919 72.984 64 72.984s12.988 5.024 14.352 11.702c.127.62.758 1.025 1.359.825l21.885-7.254a1 1 0 0 0 .685-.95V26.72a1 1 0 0 0-1-1H26.719Z"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
  
  </svg>
);

export default FireAlarm;
