import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { GithubPicker, MaterialPicker, SliderPicker } from "react-color";

export const defaultAssetCategoryColors = [
  "#C0C0C0",
  "#808080",
  "#2F4F4F",
  "#708090",
  "#000000",
  "#FF0000",
  "#8B0000",
  "#FFA500",
  "#FFD700",
  "#F0E68C",
  "#FFFF00",
  "#4169E1",
  "#1E90FF",
  "#6495ED",
  "#808000",
  "#00FF00",
  "#98FB98",
  "#008000",
  "#00FFFF",
  "#008080",
  "#0000FF",
  "#000080",
  "#FF00FF",
  "#800080",
];

interface ColorPickerProps {
  parentColor?: string;
  isColorPickerOpen: boolean;
  onColorPickerClose: () => void;
  value: string;
  onChange: (color: string) => void;
  showAdvanced?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  parentColor,
  isColorPickerOpen,
  onColorPickerClose,
  value,
  onChange,
  showAdvanced = false,
}) => {
  if (!isColorPickerOpen) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          "& .github-picker": {
            boxShadow: "none !important",
            border: "0 !important",
            justifyContent: "space-between",
            padding: "0 !important",
            maxWidth: "450px",
            "& > span": {
              margin: "4px 6px",
            },
          },
        }}
      >
        <GithubPicker
          colors={defaultAssetCategoryColors}
          width="100%"
          color={value}
          triangle="hide"
          onChangeComplete={(color) => onChange(color.hex)}
        />
        {showAdvanced && (
          <>
            <Box sx={{ my: 2 }}>
              <SliderPicker
                color={value}
                onChangeComplete={(color) => onChange(color.hex)}
              />
            </Box>
            <MaterialPicker
              color={value}
              onChangeComplete={(color) => onChange(color.hex)}
            />
          </>
        )}
      </Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        sx={{ mt: 1, maxWidth: "450px" }}
      >
        <Button
          variant="text"
          size="small"
          onClick={onColorPickerClose}
          sx={{ fontSize: "0.875rem" }}
        >
          Close
        </Button>
        {!!parentColor && !!value && value !== parentColor && (
          <Button
            variant="text"
            size="small"
            onClick={() => onChange("")}
            sx={{ fontSize: "0.875rem" }}
          >
            Use default category color
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default ColorPicker;

