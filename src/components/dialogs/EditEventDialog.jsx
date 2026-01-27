import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import { getMinDateTime, getMaxDateTime } from '../../utils/dateTimeHelpers';

export default function EditEventDialog({
  open,
  onClose,
  onSave,
  formData,
  onFormChange,
  loading = false,
}) {
  return (
    <Dialog 
      open={open} 
      onClose={() => !loading && onClose()} 
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle>Edit Event</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <TextField
          fullWidth
          label="Title"
          name="title"
          value={formData.title}
          onChange={onFormChange}
          disabled={loading}
        />
        <TextField
          fullWidth
          label="Description"
          name="description"
          value={formData.description}
          onChange={onFormChange}
          multiline
          rows={3}
          disabled={loading}
        />
        <TextField
          fullWidth
          label="Building"
          name="building"
          value={formData.building}
          onChange={onFormChange}
          disabled={loading}
        />
        <TextField
          fullWidth
          type="datetime-local"
          label="Event Date & Time"
          name="event_date"
          value={formData.event_date}
          onChange={onFormChange}
          InputLabelProps={{ shrink: true }}
          disabled={loading}
          helperText="8 AM - 6 PM office hours (30-minute intervals)"
          inputProps={{
            min: getMinDateTime(),
            max: getMaxDateTime(),
            step: "60"
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          color="primary" 
          variant="contained" 
          onClick={onSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
