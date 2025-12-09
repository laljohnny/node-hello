import { Icon, IconProps } from "@chakra-ui/react";
import { useState } from "react";

const NoResource = (props: IconProps) => {
  const [id] = useState(`filter0_dashboard-${Math.random()}`);
  return (
    <Icon viewBox="0 0 240 190" width="240px" height="auto" {...props}>
      <g filter={`url(#${id})`}>
        <rect x="40" y="35" width="160" height="110" rx="5" fill="#fff" />
      </g>
      <path d="M40 40a5 5 0 015-5h150a5 5 0 015 5v8H40v-8z" fill="#0B0B0B" />
      <circle cx="46.5" cy="41.5" r="1.5" fill="#C8C8C8" />
      <circle cx="51.5" cy="41.5" r="1.5" fill="#404040" />
      <circle cx="56.5" cy="41.5" r="1.5" fill="#646464" />
      <circle cx="98" cy="76" r="3" fill="#CACACA" />
      <circle cx="142" cy="76" r="3" fill="#CACACA" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M120 101c-9.389 0-17 7.611-17 17h-2c0-10.493 8.507-19 19-19s19 8.507 19 19h-2c0-9.389-7.611-17-17-17z"
        fill="#CACACA"
      />
      <defs>
        <filter
          id={id}
          x="0"
          y="0"
          width="240"
          height="190"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="5" />
          <feGaussianBlur stdDeviation="20" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0" />
          <feBlend in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
      </defs>
    </Icon>
  );
};

export default NoResource;
