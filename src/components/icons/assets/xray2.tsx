import React from "react";

interface Xray2Props extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Xray2: React.FC<Xray2Props> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="m29.687 48.129-8.463 12.558L30.545 75h-6.747l-5.967-9.75L11.864 75H5.156l9.282-14.313-8.463-12.558h6.864l4.992 8.034 5.031-8.034h6.825Zm2.79 19.422v-4.29h13.768v4.29H32.478ZM62.493 53.16H57.5v7.566h4.836c1.04 0 1.86-.39 2.457-1.17.624-.78.936-1.651.936-2.613 0-.936-.299-1.794-.897-2.574-.572-.806-1.352-1.209-2.34-1.209Zm2.496 12.324L71.658 75h-6.865l-6.006-9.282H57.5V75h-5.733V48.129h10.998c2.86 0 5.057.871 6.591 2.613 1.56 1.716 2.34 3.783 2.34 6.201 0 2.054-.572 3.874-1.716 5.46-1.144 1.586-2.808 2.613-4.992 3.081Zm18.553-1.794h5.577l-2.847-9.36-2.73 9.36Zm7.41 4.953H81.67L79.29 75h-6.084l9.984-26.871h6.201L99.336 75H93.33l-2.379-6.357ZM112.387 75h-5.811V62.832L96.202 48.129h6.786l6.474 10.062 6.552-10.062h6.786L112.387 62.91V75Z"
      fill={color}
    />
  </svg>
);

export default Xray2;
