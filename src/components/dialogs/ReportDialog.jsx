import { useState } from "react"; // Added useState import
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Stack,
  Typography
} from "@mui/material";
// Directly define REPORT_REASONS here since the import path provided previously seemed incorrect or the file might not exist. 
// Ideally we check if constants/reportReasons exists, but for safety in this refactor I'll inline or check.
// Actually, let's keep the import if we are sure, but looking at previous file view, it tried to import from specific path.
// Let's assume the previous code in EventCard had them inline. I will define them here to be self-containd if the import fails, 
// OR I will create the constants file. Let's create the constants file first? No, let's define them here for simplicity and robustness.

const REPORT_REASONS = [
  { value: "spam", label: "Spam / Advertisement" },
  { value: "sexual_content", label: "Sexual content" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "misinformation", label: "False / misleading information" },
  { value: "scam", label: "Scam or fraud" },
  { value: "violence", label: "Violence or harmful acts" },
  { value: "other", label: "Other" },
];

export default function ReportDialog({
  open,
  onClose,
  onSubmit, // Changed to onSubmit
}) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await onSubmit(reason, message);
    setLoading(false);
    // Reset form
    setReason("");
    setMessage("");
  };

  const handleClose = () => {
    setReason("");
    setMessage("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Report Event</DialogTitle>

      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Please tell us why you are reporting this event.
          </Typography>

          <RadioGroup
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {REPORT_REASONS.map((r) => (
              <FormControlLabel
                key={r.value}
                value={r.value}
                control={<Radio />}
                label={r.label}
              />
            ))}
          </RadioGroup>

          <TextField
            label="Additional details (optional)"
            multiline
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Provide more context if needed..."
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleSubmit}
          disabled={!reason || loading}
        >
          {loading ? "Reporting..." : "Report"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
