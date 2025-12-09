import React from "react";
import Box from "@mui/material/Box";
import tinycolor2 from "tinycolor2";
import AssetIcons from "../icons/assets/index";

export type IconType = "Square" | "Circle";

interface AssetIconProps {
  iconName: string;
  iconSize?: "xs" | "sm" | "md" | "lg";
  iconColor?: string;
  iconType: IconType;
  sx?: any;
}

const getIconComponent = (icon: string): React.FC<any> | undefined => {
  return (AssetIcons as unknown as { [key: string]: React.FC<any> })[icon];
};

const AssetIcon: React.FC<AssetIconProps> = ({
  iconName,
  iconSize = "md",
  iconColor = "#4A5568",
  iconType,
  sx,
}) => {
  const Asset = React.useMemo(() => getIconComponent(iconName), [iconName]);
  const iconTextColor = React.useMemo(
    () => (tinycolor2(iconColor).isDark() ? "white" : "black"),
    [iconColor]
  );
  
  const boxSize =
    iconSize === "md"
      ? "4rem"
      : iconSize === "sm"
      ? "3rem"
      : iconSize === "xs"
      ? "2rem"
      : "6rem";
  const iconBoxSize =
    iconSize === "md"
      ? "3.2rem"
      : iconSize === "sm"
      ? "2.3rem"
      : iconSize === "xs"
      ? "1.5rem"
      : "5rem";
  let iconTextSize =
    iconSize === "md"
      ? 1.2
      : iconSize === "sm"
      ? 0.9
      : iconSize === "xs"
      ? 0.65
      : 1.8;
  if (iconName.length > 3) {
    iconTextSize -= 0.2;
  }

  return (
    <Box
      sx={{
        width: boxSize,
        height: boxSize,
        backgroundColor: iconColor,
        borderRadius: iconType === "Square" ? 0 : "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...sx,
      }}
    >
      {Asset ? (
        <Asset
          color={iconTextColor}
          fontSize={iconBoxSize}
        />
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: boxSize,
            height: boxSize,
            color: iconTextColor,
            fontSize: `${iconTextSize}rem`,
            fontWeight: 700,
            wordBreak: "break-all",
            overflow: "hidden",
          }}
        >
          {iconName}
        </Box>
      )}
    </Box>
  );
};

export { getIconComponent };
export default AssetIcon;

