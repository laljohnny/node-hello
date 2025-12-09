import React from "react";

interface FireExtinguisher1Props extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const FireExtinguisher1: React.FC<FireExtinguisher1Props> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

      <path
        d="m91.033 28.67-8.399-5.268h3.111a2.695 2.695 0 1 0 0-5.39c-15.385 0-7.892-.012-23.28-.012a2.695 2.695 0 0 0-2.695 2.695v3.52h-3.046c-11.59 0-21.02 9.43-21.02 21.02v62.07a2.695 2.695 0 0 0 5.39 0v-62.07c0-8.618 7.011-15.63 15.63-15.63h3.046v4.965c-6.162 3.05-10.187 9.412-10.187 16.386V104.54a5.452 5.452 0 0 0 5.446 5.446h25.653a5.452 5.452 0 0 0 5.446-5.446V50.957c0-6.982-4.026-13.344-10.188-16.387v-9.003l12.23 7.669a2.695 2.695 0 0 0 2.863-4.567Zm-23.178 4.014c-.906 0-1.905.08-2.695.198V23.39s-.23.012 5.39.012v9.48a19.38 19.38 0 0 0-2.695-.198ZM80.737 73.05h-6.593V55.8h6.593v17.248Zm-.055 31.547H55.03a.056.056 0 0 1-.055-.056v-8.374h25.764v8.374a.056.056 0 0 1-.056.056Zm.043-54.185h-8.318a3.658 3.658 0 0 0-3.653 3.653v20.722a3.658 3.658 0 0 0 3.653 3.653h8.33v12.337H54.974v-39.82c0-6.961 5.642-12.882 12.882-12.882 6.99 0 12.58 5.545 12.87 12.337Z"
        fill={color}
      />
    
  </svg>
);

export default FireExtinguisher1;
