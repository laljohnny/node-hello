import React from "react";

interface RooftopUnitProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const RooftopUnit: React.FC<RooftopUnitProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="m95.5 40.5 15.5 5V55l-11 20.5m-4.5-35v9L80.5 80m15-39.5-24 6.923m24-6.923v-6c-12.4-3.6-21.167.5-24 3.5v9.423M100 75.5v11l-19.5 10m19.5-21L80.5 80m0 16.5V80m0 16.5h-17m8-49.077-8 2.308m0 0L36 57.663m27.5-7.932V74.5m0 22H36m27.5 0v-22M36 57.663 17.5 63v33.5H36m0-38.837V80m0 16.5V80m0 0 27.5-5.5"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <path
      d="m100 46 3 1v3h-3v-4ZM100 50h3L92.682 71.647 89 72.303 100 50ZM104.338 48l2.783.928v2.783h-2.783V48Z"
      fill={color}
    />
    <path
      d="M104.338 51.71h2.783l-9.572 20.082-3.415.608 10.204-20.69Z"
      fill={color}
    />
  
  </svg>
);

export default RooftopUnit;
