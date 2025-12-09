import React from "react";

interface FireJBoxProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const FireJBox: React.FC<FireJBoxProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M22.194 14.806A6.194 6.194 0 0 1 16.004 21c1.395-.002 2.97-1.104 2.97-2.974 0-.492-.067-.855-.394-1.441a6.587 6.587 0 0 0-.343-.523c-.474-.676-1.147-1.638-1.265-3.062 0 0-.466.189-.972.61-.602.502-1.26 1.333-1.26 2.57l-1.216-.356c-.373.85-.506 1.582-.499 2.201v.001A2.975 2.975 0 0 0 16 21a6.195 6.195 0 0 1-5.297-9.408s.79 1.683 2.144 1.14c.533-.214 1.14-.815.568-1.805-.617-1.068-.29-2.576 1.07-3.153C16 7.13 16 5 16 5c.152.098 2.393 1.583 1.57 3.497-.49 1.143-.55 2.528.472 2.834 1.223.367 1.868-1.33 1.868-1.33a6.182 6.182 0 0 1 2.284 4.805ZM9.759 27v-3.445h2.155v.645h-1.42v.785h1.125v.64h-1.125V27h-.735ZM13.45 23.555h.73V27h-.73v-3.445Z"
      fill={color}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="m18.537 27-.855-1.22c.28-.06.494-.192.64-.395.147-.203.22-.437.22-.7 0-.31-.1-.575-.3-.795-.196-.223-.478-.335-.845-.335h-1.41V27h.735v-1.19h.165l.77 1.19h.88Zm-1.815-2.8h.64c.127 0 .227.052.3.155a.53.53 0 0 1-.005.665.375.375 0 0 1-.315.15h-.62v-.97Z"
      fill={color}
    />
    <path
      d="M20.17 27v-3.445h2.18v.645H20.9v.785h1.27v.635H20.9v.735h1.496V27H20.17Z"
      fill={color}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1 0a1 1 0 0 0-1 1v30a1 1 0 0 0 1 1h30a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H1Zm3 3a1 1 0 0 0-1 1v24a1 1 0 0 0 1 1h24a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4Z"
      fill={color}
    />
  
  </svg>
);

export default FireJBox;
