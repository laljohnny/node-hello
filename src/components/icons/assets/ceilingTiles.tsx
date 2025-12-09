import React from "react";

interface CeilingTilesProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  fontSize?: string | number;
}

const CeilingTiles: React.FC<CeilingTilesProps> = ({ color = "currentColor", fontSize = "32px", ...props }) => (
  <svg
    width={fontSize}
    height={fontSize}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >

    <path
      d="m35.304 53.284 3.654-17.123H26.29a1 1 0 0 0-.937.651l-6.126 16.472h16.078ZM43.448 53.284l3.21-17.123H60.05v17.123h-16.6ZM68.193 53.284V36.161h12.424l3.655 17.123h-16.08ZM92.833 53.284l-3.759-17.123h12.372a1 1 0 0 1 .93.632l6.536 16.491H92.833ZM98.158 79.282l-3.93-17.61h17.621l6.413 17.205a.3.3 0 0 1-.281.405H98.158ZM118.888 91.885h-20.73v-5.927h21.03v5.627a.3.3 0 0 1-.3.3ZM89.683 85.958v5.927h-21.49v-5.927h21.49ZM59.387 85.958v5.927H38.139v-5.927h21.248ZM8.664 91.885H29.17v-5.927H8.364v5.627a.3.3 0 0 0 .3.3ZM33.292 61.993l-3.555 16.965H9.894a.3.3 0 0 1-.28-.406l6.308-16.56h17.37ZM59.387 78.959H38.959l2.875-16.966 17.553.323v16.642ZM89.683 78.959h-21.49V61.992l17.854-.32 3.636 17.285Z"
      stroke={color}
      strokeWidth={4}
      fillOpacity={0}
    />
  
  </svg>
);

export default CeilingTiles;
