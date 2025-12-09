import React from "react";

interface MeterProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Meter: React.FC<MeterProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M67.692 106.167V118a1 1 0 0 1-1 1h-5.385a1 1 0 0 1-1-1v-11.833m7.385 0h11.077m-11.077 0h-7.385m0 0H49.231m36.923 0V118a1 1 0 0 1-1 1h-5.385a1 1 0 0 1-1-1v-11.833m7.385 0H97.23V93.334m-11.077 12.833h-7.385m-29.538 0V118a1 1 0 0 1-1 1h-5.384a1 1 0 0 1-1-1v-11.833m7.384 0h-7.384m0 0H30.769V93.334m0 0h-7.384C19.306 93.334 16 90.05 16 86V16.333C16 12.283 19.306 9 23.385 9h81.23c4.078 0 7.385 3.284 7.385 7.333V86c0 4.05-3.307 7.334-7.385 7.334h-7.384m-66.462 0h66.462M38.154 23.666h-7.385V42h7.385V23.666Zm7.384 0h7.385V42h-7.385V23.666Zm36.924 0h-7.384V42h7.384V23.666Zm7.385 0h7.384V42h-7.384V23.666Zm-22.155 0h-7.385V42h7.385V23.666Zm-5.537 44.001v10.996c0 .002 0 .002.001.001L73.14 60.485a.1.1 0 0 0-.086-.151h-7.207V49.337h-.002L54.862 67.515a.1.1 0 0 0 .085.152h7.207Z"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
  
  </svg>
);

export default Meter;
