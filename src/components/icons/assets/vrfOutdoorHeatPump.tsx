import React from "react";

interface VrfOutdoorHeatPumpProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const VrfOutdoorHeatPump: React.FC<VrfOutdoorHeatPumpProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="M74.667 108.174c10.124-18.439 5.885-41.644-10.08-55.172l-.026-.023.07.176-.012.132c3.11 8.43 2.674 17.684-1.147 25.623l-2.693 5.598-.826-6.185a26.634 26.634 0 0 0-4.479-11.624H55.1l-.197-.574c.027 6.41-1.289 12.726-3.872 18.684-3.388 7.796-2.89 16.786 1.334 24.052l2.914 5.017-5.244-2.273c-8.647-3.748-15.56-10.969-18.967-19.81-3.817-9.871-3.11-21.318 1.893-30.612a52.645 52.645 0 0 0 5.434-15.26l.975-5.186 2.488 4.626a27.003 27.003 0 0 1 2.605 7.102l.056.059.058.402.054-.018c7.452-10.157 11.916-22.795 12.567-35.593L57.365 14l2.711 1.814c11.066 7.398 18.751 19.267 21.125 32.604l.054.274.028.042.121-.176a16.905 16.905 0 0 0 3.314-10.113v-5.698l3.351 4.542c7.792 10.557 11.786 23.653 11.249 36.877-.66 15.565-8.934 29.227-22.135 36.629L71.467 114l3.2-5.826Z"
      fill={color}
    />
  
  </svg>
);

export default VrfOutdoorHeatPump;
