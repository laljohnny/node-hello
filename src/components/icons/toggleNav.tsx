import { Icon, IconProps } from "@chakra-ui/react";
import { useState } from "react";

const ToggleNav = (props: IconProps & any) => {
  const [id] = useState(`filter0_toggle_nav${Math.random()}`);
  return (
    <Icon
      fill="currentColor"
      viewBox="0 0 44 44"
      width="44px"
      height="44px"
      {...props}
    >
      <g filter={`url(#${id})`}>
        <circle cx="22" cy="18" r="12" />
      </g>
      <path
        d="M19.147 18.427a.5.5 0 01-.147-.353v-.253a.513.513 0 01.147-.353l3.428-3.417a.333.333 0 01.473 0l.474.473a.327.327 0 010 .466l-2.968 2.958 2.968 2.957a.333.333 0 010 .473l-.474.467a.333.333 0 01-.473 0l-3.428-3.418z"
        fill="#fff"
      />
      <defs>
        <filter
          id={id}
          x="0"
          y="0"
          width="44"
          height="44"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="5" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.11 0" />
          <feBlend in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
      </defs>
    </Icon>
  );
};

export default ToggleNav;
