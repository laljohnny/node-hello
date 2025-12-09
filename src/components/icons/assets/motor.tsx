import React from "react";

interface MotorProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Motor: React.FC<MotorProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

      <path
        d="M15 81.44c0 7.34 5.95 13.289 13.288 13.289h7.305a1 1 0 0 0 1-1v-64.44a1 1 0 0 0-1-1h-7.305C20.95 28.288 15 34.236 15 41.575v39.865Z"
        stroke={color}
        strokeWidth={4}
        fillOpacity={0}
      />
      <path
        d="M113 63.508a2 2 0 1 0 0-4v4Zm-9.446-2c0 3.935-3.202 7.136-7.164 7.136v4c6.16 0 11.164-4.98 11.164-11.136h-4Zm-7.164-7.135c3.962 0 7.164 3.2 7.164 7.135h4c0-6.156-5.004-11.135-11.164-11.135v4Zm9.164 9.135H113v-4h-7.446v4Z"
        fill={color}
      />
      <rect
        x={70.644}
        y={26.627}
        width={14.949}
        height={69.763}
        rx={2}
        stroke={color}
        strokeWidth={4}
        fillOpacity={0}
      />
      <path
        d="M84.271 38.593H94.39v45.83H84.27v-45.83ZM38.254 32.932h32.39M38.254 47.051h32.39M38.254 61.169h32.39M38.254 76.118h32.39M38.254 89.406h32.39M45.46 89.746l-2.724 10.373a1 1 0 0 0 .967 1.254H65.24a1 1 0 0 0 .976-1.221l-2.35-10.406"
        stroke={color}
        strokeWidth={4}
        fillOpacity={0}
      />
    
  </svg>
);

export default Motor;
