import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { IconType } from "./AssetIcon";

interface TypePickerProps {
  color: string;
  value: IconType;
  onChange: (type: IconType) => void;
}

const TypePicker: React.FC<TypePickerProps> = ({ color, value, onChange }) => {
  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <Typography variant="h6" display="block">Icon Style</Typography>
      <Button
        variant="outlined"
        size="small"
        onClick={() => onChange("Square")}
        sx={{
          minWidth: 40,
          height: 32,
          p: 0.5,
          border: value === "Square" ? 2 : 1,
          borderColor: value === "Square" ? "primary.main" : "divider",
          backgroundColor: value === "Square" ? "transparent" : "transparent",
          "&:hover": {
            backgroundColor: "#b3d6ff",
          },
        }}
        aria-label="Select square icon type"
      >
        <Box
          sx={{
            width: 20,
            height: 20,
            backgroundColor: color,
            borderRadius: 0,
          }}
        />
      </Button>
      <Button
        variant="outlined"
        size="small"
        onClick={() => onChange("Circle")}
        sx={{
          minWidth: 40,
          height: 32,
          p: 0.5,
          border: value === "Circle" ? 2 : 1,
          borderColor: value === "Circle" ? "primary.main" : "divider",
          backgroundColor: value === "Circle" ? "transparent" : "transparent",
          "&:hover": {
            backgroundColor: "#b3d6ff",
          },
        }}
        aria-label="Select round icon type"
      >
        <Box
          sx={{
            width: 20,
            height: 20,
            backgroundColor: color,
            borderRadius: "50%",
          }}
        />
      </Button>
    </Stack>
  );
};

export default TypePicker;

