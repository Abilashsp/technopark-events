/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, TextField, RadioGroup, FormControlLabel, Radio, Stack
} from "@mui/material";

const DialogContext = createContext();

// --- CONSTANTS ---
export const DIALOG_TYPES = {
  CONFIRM: "CONFIRM",
  REPORT: "REPORT",
  LOGIN: "LOGIN",
};

const REPORT_REASONS = [
  { value: "spam", label: "Spam / Advertisement" },
  { value: "sexual_content", label: "Sexual content" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "scam", label: "Scam or fraud" },
  { value: "other", label: "Other" },
];

export const DialogProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    type: null,
    props: {}, // Title, message, onConfirm, etc.
  });

  const openDialog = useCallback((type, props = {}) => {
    setDialogState({ isOpen: true, type, props });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    // Small delay to clear type after animation finishes
    setTimeout(() => setDialogState({ isOpen: false, type: null, props: {} }), 200);
  }, []);

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog }}>
      {children}
      {/* THE SINGLE GLOBAL DIALOG COMPONENT */}
      <GlobalDialog
        open={dialogState.isOpen}
        type={dialogState.type}
        {...dialogState.props}
        onClose={closeDialog}
      />
    </DialogContext.Provider>
  );
};

export const useDialog = () => useContext(DialogContext);

/* ========================================================================
   THE UNIFIED COMPONENT
   This renders the correct content based on the 'type' passed to it.
   ======================================================================== */
const GlobalDialog = ({ open, type, onClose, onConfirm, title, message, ...other }) => {

  // State specifically for Report Dialog
  const [reportData, setReportData] = useState({ reason: "", message: "" });
  const [loading, setLoading] = useState(false);

  // --- HANDLERS ---
  const handleConfirm = async () => {
    if (onConfirm) {
      setLoading(true);
      if (type === DIALOG_TYPES.REPORT) {
        await onConfirm(reportData.reason, reportData.message);
      } else {
        await onConfirm();
      }
      setLoading(false);
    }
    onClose();
    setReportData({ reason: "", message: "" }); // Reset
  };

  // --- RENDER CONTENT BASED ON TYPE ---
  const renderContent = () => {
    switch (type) {
      case DIALOG_TYPES.CONFIRM:
      case DIALOG_TYPES.LOGIN:
        return <Typography>{message}</Typography>;

      case DIALOG_TYPES.REPORT:
        return (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Please tell us why you are reporting this event.
            </Typography>
            <RadioGroup
              value={reportData.reason}
              onChange={(e) => setReportData({ ...reportData, reason: e.target.value })}
            >
              {REPORT_REASONS.map((r) => (
                <FormControlLabel key={r.value} value={r.value} control={<Radio />} label={r.label} />
              ))}
            </RadioGroup>
            <TextField
              label="Additional details"
              multiline rows={3}
              value={reportData.message}
              onChange={(e) => setReportData({ ...reportData, message: e.target.value })}
            />
          </Stack>
        );
      default:
        return null;
    }
  };

  // --- DYNAMIC BUTTON CONFIG ---
  let confirmBtnText = other.confirmText || "Confirm";
  let confirmBtnColor = other.confirmColor || "primary";
  let showCancel = true;
  let disableConfirm = false;

  if (type === DIALOG_TYPES.LOGIN) {
    confirmBtnText = "Close";
    confirmBtnColor = "primary";
    showCancel = false;
  } else if (type === DIALOG_TYPES.REPORT) {
    confirmBtnText = "Report";
    confirmBtnColor = "error";
    disableConfirm = !reportData.reason;
  }

  // --- RENDER ---
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>

      <DialogContent dividers>
        {renderContent()}
      </DialogContent>

      <DialogActions>
        {showCancel && (
          <Button onClick={onClose} disabled={loading}>
            {other.cancelText || "Cancel"}
          </Button>
        )}
        <Button
          variant="contained"
          color={confirmBtnColor}
          onClick={type === DIALOG_TYPES.LOGIN ? onClose : handleConfirm}
          disabled={loading || disableConfirm}
        >
          {loading ? "Processing..." : confirmBtnText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};



