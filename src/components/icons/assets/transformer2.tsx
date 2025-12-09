import React from "react";

interface Transformer2Props extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const Transformer2: React.FC<Transformer2Props> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M111.962 24c1.23 0 2.226-.895 2.226-2v-4c0-1.105-.997-2-2.226-2H14.038c-1.229 0-2.226.895-2.226 2v4c0 1.105.997 2 2.226 2h5.65v76h-9.516c-1.269 0-2.297.896-2.297 2v8c0 1.104 1.028 2 2.297 2h105.656c1.269 0 2.297-.896 2.297-2v-8c0-1.104-1.028-2-2.297-2h-9.516V24h5.65Z"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <path
      d="M42.939 85H83.06a3.886 3.886 0 0 0 3.406-1.986c.71-1.24.71-2.723 0-3.964L66.404 43.986A3.883 3.883 0 0 0 63 42a3.883 3.883 0 0 0-3.404 1.986L39.533 79.05a3.951 3.951 0 0 0 0 3.964A3.886 3.886 0 0 0 42.94 85Z"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <path
      d="M70 65.462h-4.524l3.451-7.302a.737.737 0 0 0-.1-.788C68.643 57.14 68.333 57 68 57h-7c-.422 0-.8.225-.942.562l-5 11.846a.742.742 0 0 0 .123.772c.188.224.492.358.819.358h4.523l-3.451 7.302c-.182.384-.008.823.41 1.038.16.082.34.122.518.122.283 0 .562-.103.76-.296l12-11.846c.253-.25.312-.604.148-.904-.162-.3-.518-.492-.908-.492Zm-8.828 8.26 1.755-3.715a.738.738 0 0 0-.1-.789c-.185-.232-.495-.372-.827-.372h-4.58l4.285-10.154h4.818l-3.451 7.302a.738.738 0 0 0 .1.788c.185.232.496.372.828.372h3.826l-6.654 6.569Z"
      fill={color}
      stroke={color}
    />
  
  </svg>
);

export default Transformer2;
