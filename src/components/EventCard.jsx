import React, { useState, useEffect } from "react";
import { 
  Card, CardMedia, Box, Typography, Stack, 
  Snackbar, Alert, useMediaQuery, useTheme, Divider 
} from "@mui/material";
import { AccessTime, LocationOn } from "@mui/icons-material";

// Logic & Context
import { useAuth } from "../contexts/AuthContext";
import { useDialog, DIALOG_TYPES } from "../contexts/DialogContext"; 
import { eventService } from "../services/eventService";
import { formatTimeDisplay } from "../utils/dateTimeHelpers";

// Component Imports
import EventFormDialog from "./dialogs/EventFormDialog"; 
import { ReviewOverlay, DateBadge, CardActions } from "./EventCardComponents"; 

export default function EventCard({ event, onEventUpdated, isListView = false }) {
  const { user } = useAuth();
  const { openDialog } = useDialog(); 
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const actualListView = isListView;

  /* --- STATE --- */
  const [editOpen, setEditOpen] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, msg: "", severity: "success" });
  const [reported, setReported] = useState(false); 
  const [loadingReportStatus, setLoadingReportStatus] = useState(false);

  const isOwner = user?.id === event.author_id;
  const isUnderReview = event.status === "under_review";

  /* --- Check Report Status --- */
  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      if (!user || isOwner) return;
      setLoadingReportStatus(true);
      try {
        const hasReported = await eventService.hasReported(event.id);
        if (mounted) setReported(hasReported);
      } catch (err) {
        console.error("Failed to check report status", err);
      } finally {
        if (mounted) setLoadingReportStatus(false);
      }
    };
    checkStatus();
    return () => { mounted = false; };
  }, [user, isOwner, event.id]);

  /* --- ACTIONS --- */
  const handleShare = async (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/events/${event.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, url: shareUrl });
      } catch (err) { console.log("Share failed", err); }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setFeedback({ open: true, msg: "Link copied to clipboard!", severity: "success" });
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    openDialog(DIALOG_TYPES.CONFIRM, {
      title: "Delete Event",
      message: "Are you sure you want to delete this event forever?",
      confirmText: "Delete",
      confirmColor: "error",
      onConfirm: async () => {
        await eventService.deleteEvent(event.id, event.image_url);
        onEventUpdated?.();
      }
    });
  };

  const handleReportClick = (e) => {
    e.stopPropagation();
    if (!user) return openDialog(DIALOG_TYPES.LOGIN, { title: "Login Required" });
    openDialog(DIALOG_TYPES.REPORT, {
      title: "Report Event",
      onConfirm: async (reason, message) => {
        await eventService.reportEvent(event.id, reason, message);
        setReported(true); 
      }
    });
  };

  return (
    <>
      <Card 
        elevation={0}
        sx={{
          display: "flex",
          flexDirection: actualListView ? "row" : "column",
          borderRadius: 4,
          mb: 2,
          bgcolor: "#F9FAFB", 
          border: "1px solid #E5E7EB",
          height: actualListView ? (isMobile ? 180 : 220) : "auto",
          overflow: "hidden",
          transition: "all 0.2s",
          "&:hover": { boxShadow: theme.shadows[2] }
        }}
      >
        {/* Image Section */}
        <Box sx={{ 
          position: "relative", 
          width: actualListView ? (isMobile ? 140 : 260) : "100%", 
          height: actualListView ? "100%" : 220,
          flexShrink: 0,
        }}>
          {isUnderReview && <ReviewOverlay />}
          <DateBadge date={event.event_date} small={actualListView} />
          <CardMedia 
            component="img" 
            sx={{ width: "100%", height: "100%", objectFit: "cover" }} 
            image={event.image_url} 
          />
        </Box>

        {/* Content Section */}
        <Box sx={{ 
          flex: 1, 
          display: "flex", 
          flexDirection: "column", 
          p: 2,
          justifyContent: "space-between" 
        }}>
          <Box>
            {/* Event Name with Color */}
            <Typography 
              variant={actualListView && isMobile ? "subtitle1" : "h6"} 
              fontWeight={800} 
              sx={{ 
                lineHeight: 1.2, 
                mb: 1,
                color: theme.palette.primary.main // Giving the event name a primary color
              }}
              noWrap={actualListView && isMobile}
            >
              {event.title}
            </Typography>

            <Stack spacing={0.5} sx={{ mb: 1.5 }}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <LocationOn sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary" noWrap fontSize="0.8rem">
                  {event.building || "Central Park, NYC"}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <AccessTime sx={{ fontSize: 16, color: "#d32f2f" }} />
                <Typography variant="body2" fontWeight={600} color="text.secondary" fontSize="0.8rem">
                  {formatTimeDisplay(event.event_date)}
                </Typography>
              </Box>
            </Stack>

            {/* Event Description */}
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: actualListView ? 2 : 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                fontSize: "0.85rem",
                lineHeight: 1.4
              }}
            >
              {event.description || "No description provided for this event."}
            </Typography>
          </Box>

          <Box>
            <Divider sx={{ my: 1, opacity: 0.6 }} />
            <CardActions 
              isOwner={isOwner} 
              reported={reported}
              loading={loadingReportStatus}
              listView={true}
              onShare={handleShare} 
              onEdit={() => setEditOpen(true)} 
              onDelete={handleDeleteClick} 
              onReport={handleReportClick}
            />
          </Box>
        </Box>
      </Card>

      <EventFormDialog 
        open={editOpen} 
        onClose={() => setEditOpen(false)} 
        onSuccess={() => onEventUpdated?.()} 
        eventToEdit={event} 
      />

      <Snackbar 
        open={feedback.open} autoHideDuration={3000} 
        onClose={() => setFeedback(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={feedback.severity} variant="filled">{feedback.msg}</Alert>
      </Snackbar>
    </>
  );
}