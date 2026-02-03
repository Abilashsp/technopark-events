import React from 'react';
import { Box, Typography, Button, CardMedia, Chip, Stack } from "@mui/material";
import { CloudUpload, DeleteForever, AutoAwesome } from "@mui/icons-material";

// 1. Image Upload Banner
export const ImageUploadBanner = ({ imagePreview, error, onImageChange, onRemove }) => {
  return (
    <Box
      sx={{
        width: "100%",
        height: 200,
        bgcolor: "#f0f0f0",
        borderRadius: 2,
        overflow: "hidden",
        position: "relative",
        border: error ? "2px dashed #d32f2f" : "2px dashed #ccc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        "&:hover": { bgcolor: "#e0e0e0" },
      }}
    >
      {imagePreview ? (
        <>
          <CardMedia component="img" image={imagePreview} alt="Event Cover" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />

          <Stack direction="row" spacing={1} sx={{ position: "absolute", bottom: 10, right: 10 }}>
            <Button
              variant="contained"
              component="label"
              size="small"
              startIcon={<CloudUpload />}
              sx={{ bgcolor: "white", color: "primary.main", "&:hover": { bgcolor: "#f5f5f5" }, opacity: 0.9 }}
            >
              Replace
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={onImageChange}
              />
            </Button>

            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<DeleteForever />}
              onClick={onRemove}
              sx={{ opacity: 0.9 }}
            >
              Remove
            </Button>
          </Stack>
        </>
      ) : (
        <>
          <CloudUpload sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Click to upload cover image
          </Typography>
          <input
            type="file"
            accept="image/*"
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
            onChange={onImageChange}
          />
        </>
      )}
    </Box>
  );
};

// 2. Template Selector
export const TemplateSelector = ({ templates, currentDescription, onSelect }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <AutoAwesome fontSize="small" color="primary" />
        <Typography variant="caption" fontWeight="bold" color="primary">
          QUICK TEMPLATES
        </Typography>
      </Stack>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {templates.map((template) => (
          <Chip
            key={template}
            label={template}
            onClick={() => onSelect(template)}
            clickable
            size="small"
            variant="outlined"
            sx={{
              borderColor: currentDescription === template ? "primary.main" : undefined,
              bgcolor: currentDescription === template ? "primary.lighter" : undefined,
            }}
          />
        ))}
      </Stack>
    </Box>
  );
};