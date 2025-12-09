import React from "react";

interface ThermostatProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Thermostat: React.FC<ThermostatProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <rect
      x={14.531}
      y={25}
      width={99.938}
      height={78}
      rx={4}
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <rect
      x={23.469}
      y={33.938}
      width={32.5}
      height={60.125}
      rx={4}
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <rect
      x={62.469}
      y={34.75}
      width={13}
      height={9.75}
      rx={2}
      stroke={color}
      strokeWidth={3}
      fillOpacity={0}
    />
    <rect
      x={62.469}
      y={49.375}
      width={13}
      height={9.75}
      rx={2}
      stroke={color}
      strokeWidth={3}
      fillOpacity={0}
    />
    <rect
      x={62.469}
      y={64}
      width={13}
      height={9.75}
      rx={2}
      stroke={color}
      strokeWidth={3}
      fillOpacity={0}
    />
    <rect
      x={78.719}
      y={34.75}
      width={13}
      height={9.75}
      rx={2}
      stroke={color}
      strokeWidth={3}
      fillOpacity={0}
    />
    <rect
      x={78.719}
      y={49.375}
      width={13}
      height={9.75}
      rx={2}
      stroke={color}
      strokeWidth={3}
      fillOpacity={0}
    />
    <rect
      x={78.719}
      y={64}
      width={13}
      height={9.75}
      rx={2}
      stroke={color}
      strokeWidth={3}
      fillOpacity={0}
    />
    <rect
      x={94.969}
      y={34.75}
      width={13}
      height={9.75}
      rx={2}
      stroke={color}
      strokeWidth={3}
      fillOpacity={0}
    />
    <rect
      x={94.969}
      y={49.375}
      width={13}
      height={9.75}
      rx={2}
      stroke={color}
      strokeWidth={3}
      fillOpacity={0}
    />
    <rect
      x={94.969}
      y={64}
      width={13}
      height={9.75}
      rx={2}
      stroke={color}
      strokeWidth={3}
      fillOpacity={0}
    />
    <path
      stroke={color}
      strokeWidth={4}
      strokeLinecap="round"
      d="M75.844 86.313v5.75M82.344 86.313v5.75M88.844 86.313v5.75M95.344 86.313v5.75"
    />
    <path
      d="M45.377 67.117V52.018c0-2.801-2.356-5.08-5.252-5.08s-5.252 2.279-5.252 5.08v15.1c-2.063 1.56-3.28 3.952-3.28 6.504 0 4.55 3.828 8.253 8.532 8.253 4.704 0 8.531-3.702 8.531-8.254 0-2.551-1.216-4.944-3.28-6.504Zm-5.252 12.71c-3.537 0-6.415-2.783-6.415-6.206 0-2.058 1.053-3.979 2.816-5.138.29-.19.464-.507.464-.846V52.018c0-1.673 1.406-3.033 3.135-3.033 1.729 0 3.135 1.36 3.135 3.033v15.619c0 .339.174.656.464.846 1.763 1.16 2.816 3.08 2.816 5.138 0 3.423-2.878 6.207-6.415 6.207Z"
      fill={color}
      stroke={color}
      strokeWidth={2}
    />
  
  </svg>
);

export default Thermostat;
