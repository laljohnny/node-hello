import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  DownloadOutlined as DownloadIcon,
  Search as SearchIcon,
  ZoomOutMap as ZoomOutMapIcon,
  AssignmentTurnedIn as AssignIcon,
  AssignmentReturn as UnassignIcon,
  Upload as UploadIcon,
} from "@mui/icons-material";

type GalleryImage = {
  id: string;
  name: string;
  src: string;
  isObjectUrl?: boolean;
  status: "assigned" | "unassigned";
};

const seedImages: GalleryImage[] = [
  {
    id: "seed-alert",
    name: "alert.svg",
    src: "/images/alert.svg",
    status: "assigned",
  },
  
];

const Gallery: React.FC = () => {
  const [images, setImages] = useState<GalleryImage[]>(seedImages);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<"assigned" | "unassigned" | "all">("assigned");
  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  useEffect(
    () => () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    },
    []
  );

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      images.forEach((image) => {
        if (prev.has(image.id)) {
          next.add(image.id);
        }
      });
      return next.size === prev.size ? prev : next;
    });
  }, [images]);

  const handleUpload: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const nextImages: GalleryImage[] = [];
    Array.from(files).forEach((file) => {
      const objectUrl = URL.createObjectURL(file);
      objectUrlsRef.current.add(objectUrl);
      nextImages.push({
        id: `upload-${crypto.randomUUID()}`,
        name: file.name,
        src: objectUrl,
        isObjectUrl: true,
        status: "unassigned",
      });
    });

    setImages((prev) => [...prev, ...nextImages]);
    event.target.value = "";
  };

  const toggleSelection = useCallback((imageId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(imageId)) {
        next.delete(imageId);
      } else {
        next.add(imageId);
      }
      return next;
    });
  }, []);

  const handleImageClick = (image: GalleryImage) => {
    setPreviewImage(image);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;

    setImages((prev) => {
      const remaining = prev.filter((image) => {
        if (!selectedIds.has(image.id)) {
          return true;
        }
        if (image.isObjectUrl) {
          URL.revokeObjectURL(image.src);
          objectUrlsRef.current.delete(image.src);
        }
        return false;
      });
      return remaining;
    });
    setSelectedIds(new Set());
  };

  const handlePreviewClose = () => {
    setPreviewImage(null);
  };

  const filteredImages = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return images.filter((image) => {
      const matchesTerm = term ? image.name.toLowerCase().includes(term) : true;
      const matchesFilter =
        activeFilter === "all" ? true : image.status === activeFilter;
      return matchesTerm && matchesFilter;
    });
  }, [images, searchTerm, activeFilter]);

  const selectedImages = useMemo(
    () => images.filter((image) => selectedIds.has(image.id)),
    [images, selectedIds]
  );

  const clearSelection = () => setSelectedIds(new Set());

  const handleFilterChange = useCallback(
    (
      _event: React.MouseEvent<HTMLElement>,
      nextValue: "assigned" | "unassigned" | "all" | null
    ) => {
      if (!nextValue) return;
      setActiveFilter(nextValue);
    },
    []
  );

  const handleDownloadSelected = () => {
    selectedImages.forEach((image) => {
      const link = document.createElement("a");
      link.href = image.src;
      link.download = image.name;
      link.rel = "noopener";
      link.target = "_blank";
      link.click();
    });
  };

  const updateStatusForSelected = (status: GalleryImage["status"]) => {
    if (selectedIds.size === 0) return;
    setImages((prev) =>
      prev.map((image) =>
        selectedIds.has(image.id) ? { ...image, status } : image
      )
    );
    clearSelection();
  };

  const assignedCount = useMemo(
    () => images.filter((image) => image.status === "assigned").length,
    [images]
  );

  const unassignedCount = useMemo(
    () => images.filter((image) => image.status === "unassigned").length,
    [images]
  );

  return (
    <Stack spacing={3} sx={{ pb: { xs: 4, md: 6 } }}>
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 3,
          px: { xs: 2, md: 3 },
          py: { xs: 2, md: 3 },
          borderColor: "divider",
          backgroundColor: (theme) =>
            theme.palette.mode === "light"
              ? "rgba(255,255,255,0.9)"
              : "rgba(18,18,18,0.9)",
          backdropFilter: "blur(14px)",
        }}
      >
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={{ xs: 1.5, lg: 2 }}
              alignItems={{ xs: "stretch", lg: "center" }}
              justifyContent="space-between"
              flexWrap="wrap"
              useFlexGap
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 1.25, sm: 1 }}
                alignItems={{ xs: "stretch", sm: "center" }}
                flexWrap="wrap"
                useFlexGap
                sx={{ flexGrow: 1, minWidth: 0 }}
              >
                <TextField
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name"
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    width: { xs: "100%", sm: 220, md: 240 },
                  }}
                />

                <ToggleButtonGroup
                  color="secondary"
                  size="small"
                  exclusive
                  value={activeFilter}
                  onChange={handleFilterChange}
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    "& .MuiToggleButtonGroup-grouped": {
                      border: "none",
                      m: 0,
                    },
                    "& .MuiToggleButton-root": {
                      textTransform: "none",
                      fontWeight: 500,
                      borderRadius: 999,
                      px: 2,
                      py: 0.75,
                      color: "text.primary",
                      border: "1px solid",
                      borderColor: "divider",
                      "&.Mui-selected": {
                        color: "primary.contrastText",
                        backgroundColor: "primary.main",
                        borderColor: "primary.main",
                        "& .filter-count": {
                          backgroundColor: "rgba(255,255,255,0.2)",
                          color: "inherit",
                        },
                        "& .filter-count-assigned": {
                          color: "inherit",
                        },
                      },
                    },
                  }}
                >
                  <ToggleButton value="assigned">
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Typography variant="body2" fontWeight={600} className="filter-count-assigned">
                        Assigned
                      </Typography>
                      <Chip
                        size="small"
                        label={assignedCount}
                        className="filter-count"
                        sx={{
                          height: 20,
                          fontSize: 12,
                          borderRadius: 999,
                        }}
                      />
                    </Stack>
                  </ToggleButton>
                  <ToggleButton value="unassigned">
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Typography variant="body2" fontWeight={600} className="filter-count-assigned">
                        Unassigned
                      </Typography>
                      <Chip
                        size="small"
                        label={unassignedCount}
                        className="filter-count"
                        sx={{
                          height: 20,
                          fontSize: 12,
                          borderRadius: 999,
                        }}
                      />
                    </Stack>
                  </ToggleButton>
                  <ToggleButton value="all">
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Typography variant="body2" fontWeight={600} className="filter-count-assigned">
                        All
                      </Typography>
                      <Chip
                        size="small"
                        label={images.length}
                        className="filter-count"
                        sx={{
                          height: 20,
                          fontSize: 12,
                          borderRadius: 999,
                        }}
                      />
                    </Stack>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              <Tooltip title="Upload new media files" placement="top">
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<UploadIcon />}
                  size="small"
                  sx={{
                    alignSelf: { xs: "stretch", lg: "center" },
                    borderRadius: 999,
                    px: 2.5,
                  }}
                >
                  Upload
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    multiple
                    onChange={handleUpload}
                  />
                </Button>
              </Tooltip>
            </Stack>

      </Paper>

      {selectedIds.size > 0 && (
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 3,
            px: { xs: 2, md: 3 },
            py: { xs: 2, md: 2.5 },
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            gap: 2,
            background:
              "linear-gradient(120deg, rgba(103,58,183,0.16) 0%, rgba(103,58,183,0.08) 100%)",
            borderColor: "primary.light",
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {selectedIds.size} {selectedIds.size === 1 ? "item" : "items"} selected
          </Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadSelected}
            >
              Download
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteSelected}
            >
              Delete
            </Button>
            {(activeFilter === "unassigned" || activeFilter === "all") && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<AssignIcon />}
                onClick={() => updateStatusForSelected("assigned")}
              >
                Assign
              </Button>
            )}
            {(activeFilter === "assigned" || activeFilter === "all") && (
              <Button
                variant="contained"
                color="secondary"
                size="small"
                startIcon={<UnassignIcon />}
                onClick={() => updateStatusForSelected("unassigned")}
              >
                Unassign
              </Button>
            )}
            <Button variant="text" size="small" onClick={clearSelection}>
              Clear
            </Button>
          </Stack>
        </Paper>
      )}

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "repeat(1, minmax(0, 1fr))",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
          },
        }}
      >
        {filteredImages.map((image) => {
          const isSelected = selectedIds.has(image.id);
          return (
            <Box
              key={image.id}
              sx={{
                position: "relative",
                borderRadius: 2,
                overflow: "hidden",
                border: (theme) =>
                  isSelected
                    ? `2px solid ${theme.palette.primary.main}`
                    : `1px solid ${theme.palette.divider}`,
                boxShadow: isSelected ? 6 : 1,
                transition: "box-shadow 160ms ease, transform 160ms ease",
                cursor: "pointer",
                "&:hover": {
                  transform: "scale(1.01)",
                  boxShadow: 6,
                },
                "&:hover .gallery-overlay": {
                  opacity: 1,
                  pointerEvents: "auto",
                },
              }}
              onClick={() => handleImageClick(image)}
            >
              <Box
                className="gallery-overlay"
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  px: 1.5,
                  pt: 1.5,
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 65%, transparent 100%)",
                  opacity: isSelected ? 1 : 0,
                  transition: "opacity 140ms ease",
                  pointerEvents: isSelected ? "auto" : "none",
                  zIndex: 2,
                  "& > *": {
                    pointerEvents: "auto",
                  },
                }}
              >
                <Checkbox
                  size="small"
                  checked={isSelected}
                  onClick={(event) => event.stopPropagation()}
                  onChange={() => toggleSelection(image.id)}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.75)",
                    borderRadius: "50%",
                  }}
                />
                <IconButton
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleImageClick(image);
                  }}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.85)",
                  }}
                >
                  <ZoomOutMapIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box
                component="img"
                src={image.src}
                alt={image.name}
                sx={{
                  width: "100%",
                  height: 240,
                  objectFit: "cover",
                  display: "block",
                  backgroundColor: "#f5f5f5",
                }}
              />
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  px: 2,
                  py: 1,
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                }}
              >
                <Typography
                  variant="body2"
                  noWrap
                  sx={{ maxWidth: "70%", fontWeight: 500 }}
                >
                  {/* {image.name} */}
                </Typography>
                <Chip
                  size="small"
                  label={
                    image.status === "assigned" ? "Assigned" : "Unassigned"
                  }
                  color={image.status === "assigned" ? "primary" : "default"}
                  variant={image.status === "assigned" ? "filled" : "outlined"}
                />
              </Stack>
            </Box>
          );
        })}
        {filteredImages.length === 0 && (
          <Box
            sx={{
              gridColumn: "1 / -1",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 2,
              p: 6,
              color: "text.secondary",
            }}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              No images found
            </Typography>
            <Typography variant="body2">
              Try adjusting the filters or uploading new images.
            </Typography>
          </Box>
        )}
      </Box>

      <Dialog
        open={Boolean(previewImage)}
        onClose={handlePreviewClose}
        maxWidth="lg"
        fullWidth
      >
        {previewImage && (
          <>
            <DialogTitle
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h6" sx={{ pr: 2 }} noWrap>
                {previewImage.name}
              </Typography>
              <IconButton edge="end" onClick={handlePreviewClose}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent
              dividers
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#131313",
              }}
            >
              <Box
                component="img"
                src={previewImage.src}
                alt={previewImage.name}
                sx={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  objectFit: "contain",
                  borderRadius: 1,
                  boxShadow: 6,
                }}
              />
            </DialogContent>
          </>
        )}
      </Dialog>
    </Stack>
  );
};

export default Gallery;
