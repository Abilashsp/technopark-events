import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  InputAdornment,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import { 
  Title, 
  Description, 
  LocationOn, 
  Event as EventIcon,
  Close 
} from '@mui/icons-material';
import { getMinDateTime, getMaxDateTime } from '../../utils/dateTimeHelpers';

export default function EditEventDialog({
  open,
  onClose,
  onSave,
  formData,
  onFormChange, // This must be passed from EventCard
  loading = false,
}) {
  return (
    <Dialog 
      open={open} 
      onClose={() => !loading && onClose()} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, p: 1 }
      }}
    >
      {/* HEADER */}
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold">
          Edit Event
        </Typography>
        <IconButton onClick={onClose} disabled={loading} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          
          {/* TITLE INPUT */}
          <TextField
            fullWidth
            label="Event Title"
            name="title"
            value={formData.title}
            onChange={onFormChange}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Title color="action" />
                </InputAdornment>
              ),
            }}
          />

          {/* DATE INPUT */}
          <TextField
            fullWidth
            type="datetime-local"
            label="Date & Time"
            name="event_date"
            value={formData.event_date}
            onChange={onFormChange}
            disabled={loading}
            InputLabelProps={{ shrink: true }}
            helperText="Office hours: 8 AM - 6 PM (30 min intervals)"
            inputProps={{
              min: getMinDateTime(),
              max: getMaxDateTime(),
              step: "1800" // 30 minutes
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EventIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          {/* LOCATION INPUT */}
          <TextField
            fullWidth
            label="Building / Location"
            name="building"
            value={formData.building}
            onChange={onFormChange}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOn color="action" />
                </InputAdornment>
              ),
            }}
          />

          {/* DESCRIPTION INPUT */}
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={onFormChange}
            multiline
            rows={4}
            disabled={loading}
            placeholder="What is this event about?"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ mt: 1.5, alignSelf: 'flex-start' }}>
                  <Description color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={onSave}
          variant="contained" 
          disabled={loading}
          sx={{ px: 4, borderRadius: 2 }}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}