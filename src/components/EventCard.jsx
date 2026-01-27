import React, { Activity, useEffect, useState } from "react";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  CardActionArea,
  Stack
} from "@mui/material";
import {
  LocationOn,
  AccessTime,
  Flag,
  Edit,
  Delete,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { authService } from "../services/authService";
import { eventService } from "../services/eventService";
import {
  ConfirmationDialog,
  EditEventDialog,
  LoginRequiredDialog,
} from "./dialogs";
import LoadingSpinner from "./LoadingSpinner";
import {
  formatDateDisplay,
  formatTimeDisplay,
  formatDateTimeForInput,
  convertToISO,
} from "../utils/dateTimeHelpers";

export default function EventCard({
  event,
  onEventUpdated,
  isListView = false,
}) {
  const [currentUser, setCurrentUser] = useState(null);
  const [reported, setReported] = useState(false);
  const [openSnack, setOpenSnack] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [severity, setSeverity] = useState("success");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loginRequiredOpen, setLoginRequiredOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(true);

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    building: "",
    event_date: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ---------- DATE FORMAT ---------- */
  const month = formatDateDisplay(event.event_date).split(" ")[0];
  const day = parseInt(formatDateDisplay(event.event_date).split(" ")[1]);
  const time = formatTimeDisplay(event.event_date);

  /* ---------- LOAD USER ---------- */
  useEffect(() => {
    const loadUser = async () => {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    };
    loadUser();
  }, []);

  const isOwner = currentUser?.id === event.author_id;

  /* ---------- CHECK REPORT STATUS ---------- */
  useEffect(() => {
    let cancelled = false;

    // Don’t decide loading until we KNOW user state
    if (!currentUser) {
      setReportLoading(false);
      return;
    }

    // Owners cannot report — no need to check DB
    if (isOwner) {
      setReported(false);
      setReportLoading(false);
      return;
    }

    const checkReported = async () => {
      try {
        setReportLoading(true);
        const already = await eventService.hasReported(event.id);

        if (!cancelled) {
          setReported(already);
        }
      } catch (err) {
        console.error("hasReported failed", err);
        if (!cancelled) {
          setReported(false);
        }
      } finally {
        if (!cancelled) {
          setReportLoading(false);
        }
      }
    };

    checkReported();

    return () => {
      cancelled = true;
    };
  }, [currentUser, isOwner, event.id]);

  /* ---------- REPORT ---------- */
  const handleReportClick = (e) => {
    e.stopPropagation();
    if (!currentUser) {
      setLoginRequiredOpen(true);
      return;
    }
    setReportDialogOpen(true);
  };

  const confirmReport = async () => {
    setReportDialogOpen(false);
    try {
      await eventService.reportEvent(event.id);
      setReported(true);
      setSnackMsg("Report submitted. Thank you.");
      setSeverity("success");
    } catch (err) {
      setSnackMsg(err.message || "Error reporting event");
      setSeverity("error");
    }
    setOpenSnack(true);
  };

  /* ---------- DELETE ---------- */
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await eventService.deleteEvent(event.id);
      setSnackMsg("Event deleted successfully");
      setSeverity("success");
      setDeleteDialogOpen(false);
      setOpenSnack(true);
      onEventUpdated?.();
    } catch (err) {
      setSnackMsg(err.message || "Delete failed");
      setSeverity("error");
      setOpenSnack(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ---------- EDIT ---------- */
  const handleOpenEditDialog = () => {
    setEditForm({
      title: event.title,
      description: event.description,
      building: event.building,
      event_date: formatDateTimeForInput(event.event_date),
    });
    setEditDialogOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (
      !editForm.title.trim() ||
      !editForm.building.trim() ||
      !editForm.event_date
    ) {
      setSnackMsg("Please fill in all fields");
      setSeverity("error");
      setOpenSnack(true);
      return;
    }

    setEditLoading(true);
    try {
      await eventService.updateEvent(event.id, {
        title: editForm.title,
        description: editForm.description,
        building: editForm.building,
        event_date: convertToISO(editForm.event_date),
      });
      setSnackMsg("Event updated successfully");
      setSeverity("success");
      setEditDialogOpen(false);
      setOpenSnack(true);
      onEventUpdated?.();
    } catch (err) {
      setSnackMsg(err.message || "Update failed");
      setSeverity("error");
      setOpenSnack(true);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <>
      {isListView ? (
        // LIST VIEW
        <Card
          sx={{
            display: "flex",
            flexDirection: "row",
            height: "154px", // Slightly more compact than 140px
            width: "100%",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "none", // cleaner default look
            overflow: "hidden",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              borderColor: "primary.main",
              transform: "translateY(-2px)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            },
          }}
        >
          {/* 1. IMAGE SECTION - Fixed width, covers full height */}
          <Box sx={{ width: "160px", flexShrink: 0, overflow: "hidden" }}>
            <CardMedia
              component="img"
              image={event.image_url}
              alt={event.title}
              sx={{
                height: "100%",
                width: "100%",
                objectFit: "cover",
                transition: "transform 0.3s",
                "&:hover": { transform: "scale(1.05)" }, // Subtle zoom effect
              }}
            />
          </Box>

          {/* 2. CONTENT SECTION - Takes remaining space */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              p: 1.5,
              minWidth: 0, // CRITICAL: Enables text truncation in flex children
            }}
          >
            {/* Top: Title & Description */}
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                color="text.primary"
                sx={{
                  lineHeight: 1.2,
                  mb: 0.5,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontSize: "1.5rem",
                }}
              >
                {event.title}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2, // Limit to 2 lines for compactness
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  fontSize: "1rem",
                  lineHeight: 1.4,
                }}
              >
                {event.description}
              </Typography>
            </Box>

            {/* Bottom: Metadata (Location & Time) */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  color: "text.secondary",
                }}
              >
                <LocationOn sx={{ fontSize: 20, color: "primary.main" }} />
                <Typography variant="caption" fontWeight={500} sx={{
                  fontSize: "1rem",
                }} noWrap>
                  {event.building}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  color: "text.secondary",
                }}
              >
                <AccessTime sx={{ fontSize: 14, color: "action.active" }} />
                <Typography variant="caption" noWrap>
                  {formatDateDisplay(event.event_date)} • {time}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* 3. ACTIONS SECTION - Vertical column on the right */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              borderLeft: "1px solid",
              borderColor: "divider",
              width: "48px",
              bgcolor: "action.hover", // Subtle background distinction
            }}
          >
            {isOwner ? (
              <Stack spacing={1}>
                <Tooltip title="Edit" arrow placement="left">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditDialog();
                    }}
                  >
                    {editLoading ? (
                      <LoadingSpinner size={16} />
                    ) : (
                      <Edit fontSize="small" sx={{ fontSize: 18 }} />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete" arrow placement="left">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialogOpen(true);
                    }}
                  >
                    {deleteLoading ? (
                      <LoadingSpinner size={16} />
                    ) : (
                      <Delete fontSize="small" sx={{ fontSize: 18 }} />
                    )}
                  </IconButton>
                </Tooltip>
              </Stack>
            ) : (
              <Tooltip
                title={reported ? "Reported" : "Report"}
                arrow
                placement="left"
              >
                <IconButton
                  size="small"
                  onClick={handleReportClick}
                  disabled={reported}
                  color={reported ? "error" : "default"}
                >
                  {reportLoading ? (
                    <LoadingSpinner size={16} />
                  ) : (
                    <Flag fontSize="small" sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Card>
      ) : (
        // GRID VIEW
        <Card
          sx={{
            height: "100%",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            transition: "0.25s",
            "&:hover": {
              boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
            },
          }}
        >
          {/* IMAGE SECTION */}
          <Box sx={{ position: "relative", height: 190 }}>
            <CardActionArea disableRipple sx={{ height: "100%" }}>
              <CardMedia
                component="img"
                image={event.image_url}
                alt={event.title}
                sx={{ height: "100%", objectFit: "cover" }}
              />
            </CardActionArea>

            {/* DATE BADGE */}
            <Box
              sx={{
                position: "absolute",
                top: 12,
                left: 12,
                bgcolor: alpha("#fff", 0.92),
                px: 1.2,
                py: 0.4,
                borderRadius: 2,
                textAlign: "center",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              }}
            >
              <Typography fontSize="0.65rem" fontWeight={800} color="error">
                {month}
              </Typography>
              <Typography fontWeight={900}>{day}</Typography>
            </Box>

            {/* ACTIONS */}
            <Box
              sx={{
                position: "absolute",
                top: 10,
                right: 10,
                display: "flex",
                gap: 1,
              }}
            >
              {isOwner ? (
                <>
                  <Tooltip title="Edit">
                    {editLoading ? (
                      <LoadingSpinner size={24} thickness={3} />
                    ) : (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditDialog();
                        }}
                        sx={{
                          bgcolor: alpha("#1976d2", 0.8),
                          color: "#fff",
                          "&:hover": { bgcolor: "#1976d2" },
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    )}
                  </Tooltip>

                  <Tooltip title="Delete">
                    {deleteLoading ? (
                      <LoadingSpinner size={24} thickness={3} />
                    ) : (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteDialogOpen(true);
                        }}
                        sx={{
                          bgcolor: alpha("#d32f2f", 0.8),
                          color: "#fff",
                          "&:hover": { bgcolor: "#d32f2f" },
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </Tooltip>
                </>
              ) : (
                <Tooltip title={reported ? "Already reported" : "Report"}>
                  {reportLoading ? (
                    <LoadingSpinner size={24} thickness={3} />
                  ) : (
                    <IconButton
                      size="small"
                      disabled={reported}
                      onClick={handleReportClick}
                      sx={{
                        bgcolor: alpha("#000", 0.35),
                        color: reported ? "#ef5350" : "#fff",
                        "&:hover": { bgcolor: alpha("#000", 0.55) },
                      }}
                    >
                      <Flag fontSize="small" />
                    </IconButton>
                  )}
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* CONTENT */}
          <CardContent sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="caption" fontWeight={600} color="primary">
                <LocationOn sx={{ fontSize: 14 }} /> {event.building}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <AccessTime sx={{ fontSize: 14 }} /> {time}
              </Typography>
            </Box>

            <Typography
              variant="h6"
              fontWeight={800}
              sx={{
                fontSize: "1.05rem",
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {event.title}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                lineHeight: 1.6,
                mt: 0.5,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {event.description}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* REPORT CONFIRMATION */}
      <ConfirmationDialog
        open={reportDialogOpen}
        title="Report Event?"
        message="Are you sure you want to report this event? This action cannot be undone."
        onConfirm={confirmReport}
        onCancel={() => setReportDialogOpen(false)}
        confirmText="Report"
        confirmColor="error"
      />

      {/* LOGIN REQUIRED DIALOG */}
      <LoginRequiredDialog
        open={loginRequiredOpen}
        onClose={() => setLoginRequiredOpen(false)}
      />

      {/* EDIT DIALOG */}
      <EditEventDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleSaveEdit}
        formData={editForm}
        onFormChange={handleEditChange}
        loading={editLoading}
      />

      {/* DELETE CONFIRMATION */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Delete Event?"
        message="This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        confirmText="Delete"
        confirmColor="error"
      />

      {/* SNACKBAR */}
      <Snackbar
        open={openSnack}
        autoHideDuration={3000}
        onClose={() => setOpenSnack(false)}
      >
        <Alert severity={severity} variant="filled">
          {snackMsg}
        </Alert>
      </Snackbar>
    </>
  );
}
console.log();
