import React, { useState, useEffect, useCallback } from "react";
import { 
  Card, CardMedia, Box, Typography, Stack, 
  Snackbar, Alert, useMediaQuery, useTheme, Divider 
} from "@mui/material";
import { AccessTime, LocationOn } from "@mui/icons-material";
import {formatEventDateTime} from "../utils/dateTimeHelpers"

import { useAuth } from "../contexts/AuthContext";
import { useDialog, DIALOG_TYPES } from "../contexts/DialogContext"; 
import { eventService } from "../services/eventService";
import { formatTimeDisplay } from "../utils/dateTimeHelpers";


import EventFormDialog from "./dialogs/EventFormDialog"; 
import { ReviewOverlay, DateBadge, CardActions } from "./EventCardComponents"; 

export default function EventCard({ event,initialReported, onEventUpdated, isListView = false }) {
  const { user } = useAuth();
  const { openDialog } = useDialog(); 
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
 

  const [editOpen, setEditOpen] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, msg: "", severity: "success" });
  const [reported, setReported] = useState(false); 
  const [loadingReportStatus, setLoadingReportStatus] = useState(false);

  const isOwner = user?.id === event.author_id;
  const isUnderReview = event.status === "under_review";


  // Sync state if the prop changes (e.g., after a list refresh)
  useEffect(() => {
    setReported(initialReported);
  }, [initialReported]);

  // Check Report Status with Cache Logic


const handleShare = async (e) => {
  e.stopPropagation();

  const appLink = "https://techno-events.netlify.app/";

  const { date, time } = formatEventDateTime(event.event_date);

  const shareText = `
🎉 Event: ${event.title}
📅 Date: ${date}
⏰ Time: ${time}
📍 Location: ${event.building || event.location || "Technopark"}
📝 Description: ${event.description || "No description available"}

📲 Discover more events on the Technopark Events App:
${appLink}
`.trim();

  if (navigator.share) {
    await navigator.share({
      title: event.title,
      text: shareText,
    });
  } else {
    await navigator.clipboard.writeText(shareText);
    setFeedback({
      open: true,
      msg: "Event details copied to clipboard!",
      severity: "success",
    });
  }
};


 const handleReportClick = (e) => {
    e.stopPropagation();
    if (!user) return openDialog(DIALOG_TYPES.LOGIN, { title: "Login Required",message:"Should login for report this one" });
    
    openDialog(DIALOG_TYPES.REPORT, {
      title: "Report Event",
      onConfirm: async (reason, message) => {
        try {
          // FIX: Pass object with all required fields
          await eventService.reportEvent({ 
            userId: user.id, 
            eventId: event.id, 
            reason, 
            message 
          });
          setReported(true);
          setFeedback({ open: true, msg: "Report submitted", severity: "success" });
          // Refresh parent to show 'Under Review' overlay
          onEventUpdated?.(); 
        } catch (err) {
          setFeedback({ open: true, msg: "Report failed", severity: "error" });
        }
      }
    });
  };

  return (
    <>
      <Card 
        elevation={0}
        sx={{
          display: "flex",
          flexDirection: isListView ? "row" : "column",
          borderRadius: 4,
          mb: 2,
          bgcolor: "#F9FAFB", 
          border: "1px solid #E5E7EB",
          height: isListView ? (isMobile ? 180 : 220) : "auto",
          overflow: "hidden",
          transition: "all 0.2s",
          "&:hover": { boxShadow: theme.shadows[2] }
        }}
      >
        <Box sx={{ 
          position: "relative", 
          width: isListView ? (isMobile ? 140 : 260) : "100%", 
          height: isListView ? "100%" : 220,
          flexShrink: 0,
        }}>
          {isUnderReview && <ReviewOverlay />}
          <DateBadge date={event.event_date} small={isListView} />
          <CardMedia 
            component="img" 
            sx={{ width: "100%", height: "100%", objectFit: "cover" }} 
            image={event.image_url} 
          />
        </Box>

        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2, justifyContent: "space-between" }}>
          <Box>
            <Typography 
              variant={isListView && isMobile ? "subtitle1" : "h6"} 
              fontWeight={800} 
              sx={{ lineHeight: 1.2, mb: 1, color: theme.palette.primary.main }}
              noWrap={isListView && isMobile}
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

            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: isListView ? 2 : 3,
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
              onDelete={(e) => {
                e.stopPropagation();
                openDialog(DIALOG_TYPES.CONFIRM, {
                  title: "Delete Event",
                  message:"do you want to delete this event?",
                  onConfirm: async () => {
                    await eventService.deleteEvent(event.id, event.image_url);
                    onEventUpdated?.();
                  }
                });
              }} 
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