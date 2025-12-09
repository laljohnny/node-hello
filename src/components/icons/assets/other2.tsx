import React from "react";

interface Other2Props extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Other2: React.FC<Other2Props> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <circle
      cx={44}
      cy={78}
      r={7}
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <ellipse
      cx={44.5}
      cy={30.5}
      rx={17.5}
      ry={16.5}
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <path
      d="M50.125 27.692h-3.958l3.02-6.637a.691.691 0 0 0-.088-.717.914.914 0 0 0-.724-.338H42.25c-.37 0-.7.204-.824.51l-4.375 10.77a.695.695 0 0 0 .108.702c.164.204.43.326.716.326h3.958l-3.02 6.637c-.16.35-.007.748.359.944a.96.96 0 0 0 .453.111.933.933 0 0 0 .664-.269l10.5-10.77a.696.696 0 0 0 .13-.821c-.141-.273-.452-.448-.794-.448Zm-7.725 7.51 1.537-3.378a.691.691 0 0 0-.088-.717.914.914 0 0 0-.724-.338h-4.008l3.75-9.23h4.216l-3.02 6.637a.691.691 0 0 0 .087.717.914.914 0 0 0 .725.338h3.348L42.4 35.202Z"
      fill={color}
      stroke={color}
    />
    <path
      d="M74.952 114V39.937A.945.945 0 0 0 74 39H60.901a.945.945 0 0 0-.952.938v22.5a.945.945 0 0 1-.953.937h-29.04a.945.945 0 0 1-.952-.938v-22.5A.945.945 0 0 0 28.05 39H14.952a.945.945 0 0 0-.952.938v73.124c0 .518.426.938.952.938h19.663c.526 0 .953-.42.953-.938V92.906c0-.518.426-.937.952-.937h15.912c.526 0 .953.42.953.937v20.156c0 .518.426.938.952.938h20.615Zm0 0h23.81c6.312 0 11.428-5.037 11.428-11.25V78.375m0 0H114v-8.438m-3.81 8.438h-3.333v-8.438"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
  
  </svg>
);

export default Other2;
