import React, { useState } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  FormControlLabel,
  Checkbox,
  Box,
  Alert,
  Card,
  CardMedia,
} from "@mui/material";
import { CloudUpload, Send, Clear } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { eventService } from "../services/eventService";
import { ConfirmationDialog } from "../components/dialogs";
import { BUILDINGS } from "../constants/buildings";
import { getMinDateTime, getMaxDateTime, validateEventTime } from "../utils/dateTimeHelpers";

// Predefined description templates for quick selection
const DESCRIPTION_TEMPLATES = [
  "Join us for an exciting event! Don't miss out.",
  "Meet fellow students and network with professionals.",
  "Learn new skills and enhance your knowledge.",
  "Competitive event with prizes and recognition.",
  "Fun activity with friends and community.",
  "Educational session with hands-on experience.",
  "Casual meetup for discussion and collaboration.",
  "High-energy event with games and activities."
];

export default function Upload() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    building: BUILDINGS[0],
    date: "",
    isAnonymous: false,
    image: null,
  });

  /* ---------- CHECK IF FORM HAS UNSAVED DATA ---------- */
  const hasUnsavedData = () => {
    return (
      formData.image !== null ||
      formData.title.trim() !== "" ||
      formData.description.trim() !== "" ||
      formData.date !== "" ||
      formData.isAnonymous !== false
    );
  };

  const handleBackClick = () => {
    if (hasUnsavedData()) {
      setConfirmDialogOpen(true);
    } else {
      navigate('/');
    }
  };

  const handleConfirmExit = () => {
    setConfirmDialogOpen(false);
    navigate('/');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      setErrorMsg("File size must be less than 5MB");
      return;
    }
    setFormData({ ...formData, image: file });
    setErrorMsg("");
    
    // Create image preview
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: null });
    setImagePreview(null);
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    if (!validateEventTime(newDate)) {
      setErrorMsg("Event time must be between 8 AM and 6 PM");
      return;
    }
    setErrorMsg("");
    setFormData({ ...formData, date: newDate });
  };

 // ... inside Upload.jsx

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation checks
    if (!formData.image) return setErrorMsg("Please upload an image");
    if (!formData.title.trim()) return setErrorMsg("Please enter event title");
    if (!formData.date) return setErrorMsg("Please select event date and time");
    if (!validateEventTime(formData.date)) return setErrorMsg("Event time must be between 8 AM and 6 PM");

    setLoading(true);
    
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error("You must be logged in");

      // Convert the local datetime-local string to a UTC ISO string
      const dateObj = new Date(formData.date); 
      const isoDate = dateObj.toISOString();

      // Upload image
      const publicUrl = await eventService.uploadEventImage(user.id, formData.image);

      // Create event
      await eventService.createEvent({
        title: formData.title,
        description: formData.description,
        building: formData.building,
        event_date: isoDate,
        image_url: publicUrl,
        author_id: user.id,
        author_email: user.email,
        is_anonymous: formData.isAnonymous
      });

      navigate('/');
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, opacity: loading ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Post New Event
        </Typography>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box display="flex" flexDirection="column" gap={2.5} sx={{ position: 'relative' }}>
            {loading && (
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)', zIndex: 10, borderRadius: 1 }}>
                <Typography variant="body1" fontWeight="bold">Uploading...</Typography>
              </Box>
            )}

            {/* Image Upload Section */}
            {!imagePreview ? (
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                fullWidth
                disabled={loading}
                sx={{ 
                  height: 120, 
                  borderStyle: "dashed",
                  borderWidth: 2,
                  borderColor: 'primary.main',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'primary.dark'
                  }
                }}
              >
                <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                  <CloudUpload sx={{ fontSize: 32, color: 'primary.main' }} />
                  <Typography variant="body2" fontWeight={600}>
                    {formData.image ? formData.image.name : "Click to upload or drag and drop"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    (Max 5MB)
                  </Typography>
                </Box>
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={loading}
                />
              </Button>
            ) : (
              <Box display="flex" flexDirection="column" gap={1.5}>
                <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <CardMedia
                    component="img"
                    image={imagePreview}
                    alt="Preview"
                    sx={{ height: 200, objectFit: 'cover' }}
                  />
                </Card>
                <Box display="flex" gap={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    {formData.image?.name}
                  </Typography>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Clear />}
                    onClick={handleRemoveImage}
                    disabled={loading}
                  >
                    Remove
                  </Button>
                </Box>
              </Box>
            )}

            {/* Form Fields */}

            <TextField
              label="Event Title"
              fullWidth
              required
              disabled={loading}
              inputProps={{ maxLength: 50 }}
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              variant="outlined"
              size="medium"
            />

            <Box display="flex" gap={2}>
              <TextField
                select
                label="Building"
                fullWidth
                disabled={loading}
                value={formData.building}
                onChange={(e) =>
                  setFormData({ ...formData, building: e.target.value })
                }
                variant="outlined"
                size="medium"
              >
                {BUILDINGS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                type="datetime-local"
                label="Event Date & Time"
                fullWidth
                required
                disabled={loading}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: getMinDateTime(),
                  max: getMaxDateTime(),
                  step: "60"
                }}
                value={formData.date}
                onChange={handleDateChange}
                helperText="8 AM - 6 PM office hours"
                variant="outlined"
                size="medium"
              />
            </Box>

            <TextField
              select
              label="Quick Description"
              fullWidth
              disabled={loading}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              variant="outlined"
              size="medium"
            >
              {DESCRIPTION_TEMPLATES.map((template, idx) => (
                <MenuItem key={idx} value={template}>
                  {template}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Custom Description (Optional)"
              multiline
              rows={3}
              fullWidth
              disabled={loading}
              placeholder="Or write your own custom description..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              helperText="Select a template above or write your own description"
              variant="outlined"
            />

            <FormControlLabel
              control={
                <Checkbox
                  disabled={loading}
                  checked={formData.isAnonymous}
                  onChange={(e) =>
                    setFormData({ ...formData, isAnonymous: e.target.checked })
                  }
                />
              }
              label="Post Anonymously (Hide my name)"
            />

            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                size="large"
                disabled={loading}
                onClick={handleBackClick}
                sx={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? null : <Send />}
                sx={{ flex: 1 }}
              >
                {loading ? "Publishing..." : "Publish Event"}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>

      {/* UNSAVED DATA CONFIRMATION DIALOG */}
      <ConfirmationDialog
        open={confirmDialogOpen}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to leave?"
        onConfirm={handleConfirmExit}
        onCancel={() => setConfirmDialogOpen(false)}
        confirmText="Discard"
        cancelText="Keep Editing"
        confirmColor="error"
      />
    </Container>
  );
}
