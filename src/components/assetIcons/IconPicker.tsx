import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Input from "@mui/material/Input";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import AssetIcons from "../icons/assets/index";
import AssetIcon, { IconType } from "./AssetIcon";

interface IconPickerProps {
  defaultCustomIconText: string;
  value: string;
  isIconPickerOpen: boolean;
  onIconPickerClose: () => void;
  onSelect: (icon: string) => void;
  color: string;
  iconType: IconType;
}

const IconPicker: React.FC<IconPickerProps> = ({
  defaultCustomIconText,
  value,
  isIconPickerOpen,
  onIconPickerClose,
  onSelect,
  color,
  iconType,
}) => {
  const [customIconText, setCustomIconText] = useState(defaultCustomIconText);
  const [tabValue, setTabValue] = useState(0);

  const setIconValue = React.useCallback(
    (icon: string) => {
      onSelect(icon);
      setCustomIconText("");
      onIconPickerClose();
    },
    [onSelect, onIconPickerClose]
  );

  useEffect(() => {
    setCustomIconText(defaultCustomIconText);
    setTabValue(defaultCustomIconText ? 1 : 0);
  }, [defaultCustomIconText]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Modal
      open={isIconPickerOpen}
      onClose={onIconPickerClose}
      aria-labelledby="icon-picker-modal"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 600 },
          maxWidth: "90vw",
          maxHeight: "90vh",
          bgcolor: "background.paper",
          boxShadow: 24,
          borderRadius: 1,
          p: 3,
          overflow: "auto",
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Select Icon" />
            <Tab label="Create Text Icon" />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <Box
            sx={{
              mt: 2,
              maxHeight: "400px",
              overflow: "auto",
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              justifyContent: "flex-start",
            }}
          >
            {Object.keys(AssetIcons || {}).length === 0 && (
              <Typography sx={{ p: 2, color: "text.secondary" }}>
                No icons available
              </Typography>
            )}
            {Object.keys(AssetIcons || {}).map((key) => (
              <Box
                key={key}
                onClick={() => setIconValue(key)}
                sx={{
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: 1,
                  border: value === key ? "3px solid" : "3px solid transparent",
                  borderColor: value === key ? "secondary.main" : "transparent",
                  "&:hover": {
                    borderColor: "secondary.main",
                    backgroundColor: "action.hover",
                  },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AssetIcon
                  iconName={key}
                  iconColor={color}
                  iconType={iconType}
                  iconSize="sm"
                />
              </Box>
            ))}
          </Box>
        )}

        {tabValue === 1 && (
          <Stack spacing={2} sx={{ mt: 2, textAlign: "center" }}>
            <Box sx={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AssetIcon
                iconName={customIconText}
                iconColor={color}
                iconType={iconType}
              />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", mb: 1, display: "block" }}
              >
                Enter three letters for your icon
              </Typography>
              <Box sx={{ width: 120, mx: "auto" }}>
                <Input
                  autoComplete="off"
                  inputProps={{ maxLength: 4 }}
                  value={customIconText}
                  onChange={(e) => setCustomIconText(e.target.value)}
                  sx={{ textAlign: "center" }}
                />
              </Box>
            </Box>
            <Button
              variant="outlined"
              onClick={() => setIconValue(customIconText)}
              sx={{ mt: 2, px: 3 }}
            >
              Save
            </Button>
          </Stack>
        )}
      </Box>
    </Modal>
  );
};

export default IconPicker;

