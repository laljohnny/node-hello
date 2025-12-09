import React from "react";

interface PipeHangerProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const PipeHanger: React.FC<PipeHangerProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M85.83 48.234c0-10.047-9.774-18.191-21.83-18.191s-21.83 8.144-21.83 18.191M85.83 91.894c0-10.047-9.774-18.192-21.83-18.192s-21.83 8.145-21.83 18.192"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <path
      d="M79.766 96.745c0-7.368-7.059-13.34-15.766-13.34s-15.766 5.972-15.766 13.34M100.383 50.234c10.176 0 18.617 8.769 18.617 19.83 0 11.06-8.441 19.83-18.617 19.83H85.404v-39.66h14.979ZM27.617 50.234C17.441 50.234 9 59.003 9 70.064c0 11.06 8.441 19.83 18.617 19.83h14.979v-39.66H27.617Z"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <path
      d="M83.404 50.66h16.979C111.769 50.66 121 61.248 121 74.309c0 13.06-9.231 23.648-20.617 23.648H77.34M44.596 50.66H27.617C16.231 50.66 7 61.248 7 74.309c0 13.06 9.23 23.648 20.617 23.648H50.66"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <circle
      cx={26.404}
      cy={70.064}
      r={6.064}
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <circle
      cx={101.596}
      cy={70.064}
      r={6.064}
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
  
  </svg>
);

export default PipeHanger;
