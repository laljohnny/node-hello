import React from "react";

interface MainDistributionPanelProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const MainDistributionPanel: React.FC<MainDistributionPanelProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <rect
      x={19.371}
      y={17}
      width={89.258}
      height={94}
      rx={2}
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <circle
      cx={50.565}
      cy={46.613}
      r={18.548}
      fillOpacity={0}
      stroke={color}
      strokeWidth={4}
    />
    <path
      d="M63.407 60.312c0-7.093-5.75-12.843-12.842-12.843-7.093 0-12.843 5.75-12.843 12.843M50.852 38.051v10.274"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <rect
      x={30.016}
      y={72.694}
      width={41.097}
      height={18.968}
      rx={2}
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <rect
      x={30.806}
      y={94.823}
      width={6.323}
      height={6.323}
      rx={2}
      fill={color}
    />
    <rect
      x={41.871}
      y={94.823}
      width={6.323}
      height={6.323}
      rx={2}
      fill={color}
    />
    <rect
      x={52.935}
      y={94.823}
      width={6.323}
      height={6.323}
      rx={2}
      fill={color}
    />
    <rect
      x={64}
      y={94.823}
      width={6.323}
      height={6.323}
      rx={2}
      fill={color}
    />
    <path
      stroke={color}
      strokeWidth={5}
      d="M86.258 40.291V87.71M87.206 64.919l9.8-9.799"
    />
    <circle cx={98.498} cy={53.173} r={6.323} fill={color} />
  
  </svg>
);

export default MainDistributionPanel;
