import React from "react";

interface LightSwitchProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const LightSwitch: React.FC<LightSwitchProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M77.499 43.015V61.5h-27V43.015c0-.045.015-.144.153-.268.143-.128.39-.246.716-.246h25.261c.327 0 .573.118.716.246.138.124.154.223.154.268Zm-27 27.485h27v14.487c0 .045-.016.144-.154.268a1.073 1.073 0 0 1-.716.246H51.368c-.327 0-.573-.118-.716-.246-.138-.124-.154-.223-.154-.268V70.5Zm15-40.499a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 68a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
      stroke={color}
      strokeWidth={5}
      fillOpacity={0}
    />
    <path
      d="M96.78 109.498H31.221c-.486 0-.722-.357-.722-.605V19.105c0-.248.236-.605.722-.605h65.557c.486 0 .722.357.722.605v89.788c0 .248-.236.605-.722.605Z"
      stroke={color}
      strokeWidth={5}
      fillOpacity={0}
    />
  
  </svg>
);

export default LightSwitch;
