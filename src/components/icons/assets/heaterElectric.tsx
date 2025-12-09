import React from "react";

interface HeaterElectricProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const HeaterElectric: React.FC<HeaterElectricProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M100.211 42.73H27.789c-4.846 0-8.789 3.943-8.789 8.79v41.308c0 4.846 3.943 8.789 8.79 8.789h5.268V109h7.03v-7.383h48.165V109h7.031v-7.383h4.927c4.846 0 8.789-3.943 8.789-8.789V51.52c0-4.846-3.943-8.788-8.789-8.788Zm1.758 50.098a1.76 1.76 0 0 1-1.758 1.758H27.789a1.76 1.76 0 0 1-1.758-1.758V51.52c0-.969.789-1.757 1.758-1.757h72.422a1.76 1.76 0 0 1 1.758 1.758v41.308ZM60.484 56.82h7.032v30.736h-7.032V56.819Zm-13.715 0h7.03v30.736h-7.03V56.819Zm-13.711 0h7.03v30.736h-7.03V56.819Zm41.308 0h7.031v30.736h-7.03V56.819Zm13.887 0h7.031v30.736h-7.031V56.819Zm-28.526-28.4L65.917 19c3.266 2.183 4.158 6.623 1.994 9.916l-6.19 9.42c-3.265-2.183-4.158-6.623-1.994-9.917Zm21.094 0L87.01 19c3.266 2.183 4.158 6.623 1.994 9.916l-6.19 9.42c-3.265-2.183-4.159-6.623-1.994-9.917Zm-42.188 0L44.823 19c3.266 2.183 4.159 6.623 1.994 9.916l-6.19 9.42c-3.265-2.183-4.158-6.623-1.994-9.917Z"
      fill={color}
    />
  
  </svg>
);

export default HeaterElectric;
