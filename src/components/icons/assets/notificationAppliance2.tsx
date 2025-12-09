import React from "react";

interface NotificationAppliance2Props extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const NotificationAppliance2: React.FC<NotificationAppliance2Props> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      clipRule="evenodd"
      d="M24 12a4 4 0 0 0-4 4v96a4 4 0 0 0 4 4h80a4 4 0 0 0 4-4V16a4 4 0 0 0-4-4H24Z"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <path
      d="M30 88a2 2 0 0 1 2-2h64a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H32a2 2 0 0 1-2-2V88Z"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M54 26a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-2 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm2 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM44 28a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm2 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-2 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-6-18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-2 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm2 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm22-14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm2 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-2 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10-18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-2 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm2 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm6-14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm2 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-2 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10-18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-2 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm2 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm6-14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm2 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-2 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM36 55v16h3.257v-6.386h4.985V61.64h-4.985v-3.645h6.293V55H36Zm19.589 0h-3.235v16h3.235V55Zm15.523 10.334L74.901 71h-3.9l-3.412-5.527h-.73V71H63.6V55h6.248c1.625 0 2.873.519 3.745 1.556.886 1.022 1.33 2.252 1.33 3.692 0 1.223-.326 2.307-.976 3.251-.65.945-1.595 1.556-2.836 1.835ZM82.14 55v16H92v-2.996h-6.625v-3.413h5.628v-2.95h-5.628v-3.645h6.426V55h-9.66Zm-12.446 2.996h-2.836V62.5h2.748c.59 0 1.056-.232 1.395-.697.355-.464.532-.983.532-1.556 0-.557-.17-1.068-.51-1.532-.324-.48-.767-.72-1.329-.72Z"
      fill={color}
    />
  
  </svg>
);

export default NotificationAppliance2;
