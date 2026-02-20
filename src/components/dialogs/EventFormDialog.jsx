import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Stack, InputAdornment, IconButton, Typography, MenuItem, Alert, Grid,
  useTheme, Box
} from "@mui/material";
import {
  Title, Description, LocationOn, Event as EventIcon, Close, Send
} from "@mui/icons-material";

// 1. Imports
import { useEventForm } from "../../hooks/useEventForm";
import { ImageUploadBanner, TemplateSelector } from "../EventFormComponents";
import { useDialog, DIALOG_TYPES } from "../../contexts/DialogContext"; // <--- Global Dialog Hook
import { BUILDINGS } from "../../constants/buildings";
import { getMinDateTime, getMaxDateTime } from "../../utils/dateTimeHelpers";

const DESCRIPTION_TEMPLATES = [
  "Join us for an exciting event!",
  "Network with professionals.",
  "Learn new skills workshop.",
  "Competitive event with prizes.",
  "Fun community meetup.",
];

export default function EventFormDialog({ open, onClose, onSuccess, eventToEdit = null }) {
  const theme = useTheme();

  // 2. Use Global Dialog Hook
  const { openDialog } = useDialog();

  // Hook handles form logic
  const {
    formData, loading, errorMsg, imagePreview, isEditMode, isDirty, handlers
  } = useEventForm(open, eventToEdit, onSuccess, onClose);

  // 3. Updated Close Handler (Uses Global Context)
  const handleRequestClose = () => {
    if (loading) return;

    if (isDirty) {
      openDialog(DIALOG_TYPES.CONFIRM, {
        title: "Discard changes?",
        message: "You have unsaved changes. Closing now will lose your progress.",
        confirmText: "Discard",
        cancelText: "Keep Editing",
        confirmColor: "error",
        onConfirm: () => onClose() // Simply close the form on confirm
      });
    } else {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleRequestClose}
      fullWidth
      maxWidth="md"
      fullScreen={window.innerWidth < 600}
      PaperProps={{ sx: { borderRadius: { xs: 0, sm: 3 }, bgcolor: '#fff' } }}
    >
      {/* HEADER */}
      <DialogTitle sx={{
        display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Typography variant="h6" fontWeight="700" color="text.primary">
          {isEditMode ? "Edit Event" : "Create New Event"}
        </Typography>
 
      </DialogTitle>

      {/* CONTENT */}
      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#fafafa' }}>
        <Stack spacing={3} sx={{ mt: 1 }}>

          {errorMsg && <Alert severity="error" sx={{ borderRadius: 2 }}>{errorMsg}</Alert>}

          {/* 1. COVER IMAGE */}
          <ImageUploadBanner
            imagePreview={imagePreview}
            error={errorMsg.includes("image")}
            onImageChange={handlers.handleImageChange}
            onRemove={handlers.handleRemoveImage}
          />

          {/* 2. FIELDS GRID */}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Event Title" name="title"
                value={formData.title} onChange={handlers.handleChange}
                   slotProps={{
    htmlInput: { maxLength: 15}
  }}
                placeholder="Event Name" variant="outlined" sx={{ bgcolor: 'white' }}
                helperText={`${formData.title.length} / 15 characters`}
                InputProps={{ startAdornment: <InputAdornment position="start"><Title color="action" /></InputAdornment> }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth type="datetime-local" label="Date & Time" name="date"
                value={formData.date} onChange={handlers.handleDateChange}
                InputLabelProps={{ shrink: true }} sx={{ bgcolor: 'white' }}
                inputProps={{ min: getMinDateTime(), max: getMaxDateTime() }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth label="Venue / Building" name="building"
                value={formData.building || ""} onChange={handlers.handleChange} sx={{ bgcolor: 'white' }}
                InputProps={{ startAdornment: <InputAdornment position="start"><LocationOn color="action" /></InputAdornment> }}
              >
                {BUILDINGS.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>

          {/* 3. DESCRIPTION */}
          <Box>
            <TemplateSelector
              templates={DESCRIPTION_TEMPLATES}
              currentDescription={formData.description}
              onSelect={handlers.handleTemplateClick}
            />
            <TextField
              multiline rows={4} fullWidth label="Detailed Description" name="description"
              value={formData.description} onChange={handlers.handleChange}
            slotProps={{
    htmlInput: { maxLength: 50}
  }}
  helperText={`${formData.description.length} / 50 characters`}
              placeholder="What is this event about? Who should attend?" sx={{ bgcolor: 'white' }}
              InputProps={{ startAdornment: <InputAdornment position="start" sx={{ mt: 1.5 }}><Description color="action" /></InputAdornment> }}
            />
          </Box>
        </Stack>
      </DialogContent>

      {/* FOOTER */}
      <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: '#fff' }}>
        <Button onClick={handleRequestClose} disabled={loading} color="inherit" sx={{ borderRadius: 2, px: 3 }}>
          Cancel
        </Button>
        <Button
          onClick={handlers.handleSubmit} variant="contained" disabled={loading} startIcon={<Send />}
          sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 'bold', boxShadow: 2 }}
        >
          {loading ? "Publishing..." : isEditMode ? "Update Event" : "Post Event"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}