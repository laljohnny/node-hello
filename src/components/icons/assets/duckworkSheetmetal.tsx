import React from "react";

interface DuckworkSheetmetalProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const DuckworkSheetmetal: React.FC<DuckworkSheetmetalProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M108.246 72.078h-2.754v-13.77c0-16.734-13.615-30.292-30.293-30.292h-2.754v-8.262a2.754 2.754 0 0 0-5.507 0v8.262H33.89v-8.262a2.754 2.754 0 0 0-5.508 0v8.262h-8.63A2.754 2.754 0 0 0 17 30.77v27.539a2.754 2.754 0 0 0 2.754 2.754h52.691v11.015h-2.754a2.754 2.754 0 0 0-2.754 2.754v11.016a2.754 2.754 0 0 0 2.754 2.754h38.555A2.754 2.754 0 0 0 111 85.848V74.832a2.754 2.754 0 0 0-2.754-2.754Zm-35.8-38.555v22.032H50.413V33.523h22.031Zm5.507.154a24.67 24.67 0 0 1 12.708 5.276L77.953 51.66V33.677Zm16.602 9.17a24.668 24.668 0 0 1 5.275 12.708H81.849l12.707-12.708Zm-72.047-9.324h22.398v22.032H22.508V33.523Zm55.445 27.54h22.031v11.015h-22.03V61.062Zm27.539 22.03H72.445v-5.507h33.047v5.508ZM97.23 94.11a2.754 2.754 0 0 0-2.753 2.753v11.383a2.754 2.754 0 1 0 5.507 0V96.863a2.754 2.754 0 0 0-2.753-2.754ZM80.707 94.11a2.754 2.754 0 0 0-2.754 2.753v11.383a2.754 2.754 0 1 0 5.508 0V96.863a2.754 2.754 0 0 0-2.754-2.754Z"
      fill={color}
    />
  
  </svg>
);

export default DuckworkSheetmetal;
