import React, { useState, useEffect } from "react";
import { 
  Card, CardMedia, Box, Typography, Stack, 
  Snackbar, Alert, useMediaQuery, useTheme, 
  CircularProgress 
} from "@mui/material";
import { 
  AccessTime, LocationOn, 
  ReportProblem 
} from "@mui/icons-material";

// 1. Logic & Context Imports
import { useAuth } from "../contexts/AuthContext";
import { useDialog, DIALOG_TYPES } from "../contexts/DialogContext"; 
import { eventService } from "../services/eventService";
import { formatDateDisplay, formatTimeDisplay } from "../utils/dateTimeHelpers";

// 2. Component Imports
import EventFormDialog from "./dialogs/EventFormDialog"; 
import { ReviewOverlay, DateBadge, CardActions } from "./EventCardComponents"; 

export default function EventCard({ event, onEventUpdated, isListView = false }) {
  const { user } = useAuth();
  const { openDialog } = useDialog(); 
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const actualListView = isListView && !isMobile;

  // --- STATE ---
  const [editOpen, setEditOpen] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, msg: "", severity: "success" });
  
  // 1. RESTORED: Reported State
  const [reported, setReported] = useState(false); 
  const [loadingReportStatus, setLoadingReportStatus] = useState(false);

  const isOwner = user?.id === event.author_id;
  const isUnderReview = event.status === "under_review";

  // --- 2. RESTORED: Check Report Status on Mount ---
  useEffect(() => {
    let mounted = true;

    const checkStatus = async () => {
      if (!user || isOwner) return; // Owners can't report themselves, guests can't see status
      
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
    const text = `${event.title} @ ${event.building}\n${formatDateDisplay(event.event_date)}`;
    if (navigator.share) await navigator.share({ title: event.title, text });
    else {
      await navigator.clipboard.writeText(text);
      setFeedback({ open: true, msg: "Link copied!", severity: "success" });
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
        setFeedback({ open: true, msg: "Event deleted", severity: "success" });
        onEventUpdated?.();
      }
    });
  };

  const handleReportClick = (e) => {
    e.stopPropagation();
    if (!user) {
      return openDialog(DIALOG_TYPES.LOGIN, { 
        title: "Login Required", 
        message: "You must be logged in to report events." 
      });
    }

    openDialog(DIALOG_TYPES.REPORT, {
      title: "Report Event",
      onConfirm: async (reason, message) => {
        await eventService.reportEvent(event.id, reason, message);
        // 3. UPDATE UI IMMEDIATELY
        setReported(true); 
        setFeedback({ open: true, msg: "Report submitted", severity: "success" });
      }
    });
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setEditOpen(true);
  };

  /* --- RENDERERS --- */

  const CardContentInner = ({ compact = false }) => (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2 }}>
      <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, mb: 1 }} noWrap={compact}>
        {event.title}
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
        <Box display="flex" alignItems="center" gap={0.5}>
          <AccessTime sx={{ fontSize: 16, color: "#d32f2f" }} />
          <Typography variant="body2" fontWeight={600} color="text.secondary" fontSize="0.8rem">
            {formatTimeDisplay(event.event_date)}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={0.5}>
          <LocationOn sx={{ fontSize: 18, color: "#757575" }} />
          <Typography variant="body2" color="text.secondary" fontSize="0.8rem" noWrap maxWidth={100}>
            {event.building}
          </Typography>
        </Box>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{
        display: "-webkit-box", WebkitLineClamp: compact ? 3 : 2, WebkitBoxOrient: "vertical", overflow: "hidden"
      }}>
        {event.description}
      </Typography>
    </Box>
  );

  return (
    <>
      <Card 
        elevation={0}
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: actualListView ? "row" : "column",
          borderRadius: 3,
          mb: 2,
          bgcolor: actualListView ? "white" : "transparent",
          border: actualListView ? "1px solid #eee" : "none",
          height: actualListView ? 160 : "100%",
          overflow: "hidden",
          transition: "all 0.2s",
          "&:hover": { 
            borderColor: "#ccc", 
            transform: actualListView ? "translateX(4px)" : "translateY(-4px)" 
          }
        }}
      >
        <Box sx={{ 
          position: "relative", 
          width: actualListView ? 220 : "100%", 
          flexShrink: 0,
          borderRadius: actualListView ? 0 : 3,
          overflow: "hidden" 
        }}>
          {isUnderReview && <ReviewOverlay />}
          <DateBadge date={event.event_date} small={actualListView} />
          
          {!actualListView && (
            <Box sx={{ position: "absolute", top: 12, right: 12, zIndex: 2, display: 'flex', gap: 0.5 }}>
              <CardActions 
                isOwner={isOwner} 
                reported={reported} // Pass reported state
                loading={loadingReportStatus} // Pass loading state
                onShare={handleShare} onEdit={handleEditClick} onDelete={handleDeleteClick} onReport={handleReportClick} 
              />
            </Box>
          )}

          <CardMedia 
            component="img" 
            sx={{ width: "100%", height: "100%", objectFit: "cover", aspectRatio: actualListView ? "auto" : "4/3", bgcolor: "#f0f0f0" }} 
            image={event.image_url} 
          />
        </Box>

        <CardContentInner compact={!actualListView} />

        {actualListView && (
          <Box sx={{ width: 60, borderLeft: "1px solid #f0f0f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, bgcolor: "#fafafa" }}>
            <CardActions 
              isOwner={isOwner} 
              reported={reported} // Pass reported state
              loading={loadingReportStatus} 
              listView 
              onShare={handleShare} onEdit={handleEditClick} onDelete={handleDeleteClick} onReport={handleReportClick} 
            />
          </Box>
        )}
      </Card>

      <EventFormDialog 
        open={editOpen} 
        onClose={() => setEditOpen(false)} 
        onSuccess={() => {
          onEventUpdated?.();
          setFeedback({ open: true, msg: "Event updated!", severity: "success" });
        }} 
        eventToEdit={event} 
      />

      <Snackbar 
        open={feedback.open} autoHideDuration={3000} 
        onClose={() => setFeedback(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={feedback.severity} variant="filled" sx={{ borderRadius: 2 }}>{feedback.msg}</Alert>
      </Snackbar>
    </>
  );
}