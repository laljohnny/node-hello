import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FormHelperText from "@mui/material/FormHelperText";
import AssetIcon, { IconType, getIconComponent } from "./AssetIcon";
import ColorPicker from "./ColorPicker";
import IconPicker from "./IconPicker";
import TypePicker from "./TypePicker";

interface AssetIconFieldProps {
  iconName: string;
  iconColor: string;
  iconType: IconType;
  onIconNameChange: (value: string) => void;
  onIconColorChange: (value: string) => void;
  onIconTypeChange: (value: IconType) => void;
  parentColor?: string;
  error?: string;
  touched?: boolean;
}

const AssetIconField: React.FC<AssetIconFieldProps> = ({
  iconName,
  iconColor,
  iconType,
  onIconNameChange,
  onIconColorChange,
  onIconTypeChange,
  parentColor,
  error,
  touched,
}) => {
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const finalColorValue = iconColor || parentColor || "#4A5568";

  return (
    <Box sx={{ mt: 3 }}>
      <TypePicker
        color={finalColorValue}
        value={iconType}
        onChange={onIconTypeChange}
      />
      <Box
        sx={{
          mt: 3,
          position: "relative",
          textAlign: "center",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="flex-start"
          spacing={2}
        >
          <Box sx={{ flexShrink: 0 }}>
            {iconName ? (
              <AssetIcon
                iconName={iconName}
                iconColor={finalColorValue}
                iconType={iconType}
              />
            ) : (
              <Box
                sx={{
                  width: "4rem",
                  height: "4rem",
                  backgroundColor: finalColorValue,
                  borderRadius: iconType === "Square" ? 0 : "50%",
                }}
              />
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="text"
              size="small"
              onClick={() => setIsColorPickerOpen(true)}
              sx={{ fontSize: "12px" }}
            >
              {finalColorValue ? "Change" : "Select"} Color
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={() => setIsIconPickerOpen(true)}
              sx={{ fontSize: "12px" }}
            >
              {iconName ? "Change" : "Select"} Icon
            </Button>
          </Stack>
        </Stack>

        {error && touched && (
          <FormHelperText error sx={{ mt: 1 }}>
            {error}
          </FormHelperText>
        )}

        <ColorPicker
          parentColor={parentColor}
          isColorPickerOpen={isColorPickerOpen}
          onColorPickerClose={() => setIsColorPickerOpen(false)}
          value={iconColor || finalColorValue}
          onChange={onIconColorChange}
        />

        <IconPicker
          defaultCustomIconText={iconName && !getIconComponent(iconName) ? iconName : ""}
          value={iconName}
          isIconPickerOpen={isIconPickerOpen}
          onIconPickerClose={() => setIsIconPickerOpen(false)}
          onSelect={onIconNameChange}
          color={finalColorValue}
          iconType={iconType}
        />
      </Box>
    </Box>
  );
};

export default AssetIconField;

