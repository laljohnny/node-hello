import React from "react";

interface NotificationAppliance1Props extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const NotificationAppliance1: React.FC<NotificationAppliance1Props> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M80.298 63.424c-.126-.08-1.077-.731-2.029-2.7-1.748-3.616-2.115-8.71-2.115-12.347v-.047c-.02-4.806-2.964-8.95-7.177-10.808v-2.843c0-2.58-2.144-4.679-4.779-4.679h-.396c-2.635 0-4.779 2.099-4.779 4.679v2.843c-4.227 1.864-7.177 6.029-7.177 10.855 0 3.637-.367 8.73-2.115 12.347-.952 1.969-1.903 2.62-2.03 2.7-.531.24-.794.797-.671 1.36.123.57.668.962 1.262.962h9.227C57.571 69.203 60.457 72 64 72c3.543 0 6.43-2.797 6.48-6.254h9.228c.594 0 1.139-.392 1.262-.962a1.189 1.189 0 0 0-.672-1.36ZM61.541 34.679c0-1.221 1.014-2.214 2.261-2.214h.396c1.247 0 2.261.993 2.261 2.214v2.044a12.414 12.414 0 0 0-4.918 0v-2.044ZM64 69.535c-2.154 0-3.912-1.691-3.963-3.789h7.926c-.051 2.098-1.808 3.789-3.963 3.789Zm5.069-6.254H51.161c.218-.332.44-.707.66-1.132 1.687-3.252 2.542-7.885 2.542-13.772 0-5.202 4.323-9.434 9.637-9.434 5.313 0 9.636 4.232 9.636 9.438v.045c.005 5.863.86 10.48 2.543 13.723.22.425.442.8.66 1.132h-7.77Z"
      fill={color}
      stroke={color}
      strokeWidth={2}
    />
    <rect
      x={29}
      y={16}
      width={70}
      height={96}
      rx={2}
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <rect
      x={38}
      y={80}
      width={52}
      height={6}
      rx={3}
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
    <circle
      cx={64}
      cy={99}
      r={5}
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
  
  </svg>
);

export default NotificationAppliance1;
