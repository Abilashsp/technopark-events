import React, { useEffect, useState } from "react";
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
  Stack,
  CircularProgress,
  Chip,
  useMediaQuery,
  useTheme
} from "@mui/material";
import {
  LocationOn,
  AccessTime,
  Flag,
  Edit,
  Delete,
  Share,
  ReportProblem
} from "@mui/icons-material";

import { eventService } from "../services/eventService";
import {
  ConfirmationDialog,
  EditEventDialog,
  LoginRequiredDialog,
  ReportDialog,
} from "./dialogs";
import { useAuth } from "../contexts/AuthContext";
import {
  formatDateDisplay,
  formatTimeDisplay,
  formatDateTimeForInput,
  convertToISO,
} from "../utils/dateTimeHelpers";

export default function EventCard({ event, onEventUpdated, isListView = false }) {
  const { user: currentUser, loading: authLoading } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Force grid view on mobile regardless of prop
  const actualListView = isListView && !isMobile;

  const [reported, setReported] = useState(false);
  const [actionsLoading, setActionsLoading] = useState(true);

  // --- DIALOG & FEEDBACK STATES ---
  const [openSnack, setOpenSnack] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [severity, setSeverity] = useState("success");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [loginRequiredOpen, setLoginRequiredOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    title: "", description: "", building: "", event_date: "",
  });

  const isUnderReview = event.status === "under_review";
  const isOwner = currentUser?.id === event.author_id;

  // --- DATE PARSING ---
  const eventDateObj = new Date(event.event_date);
  const dateDay = eventDateObj.getDate();
  const dateMonth = eventDateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
  const timeDisplay = formatTimeDisplay(event.event_date);

  // --- EFFECT: CHECK REPORT ---
  useEffect(() => {
    let cancelled = false;
    const checkReported = async () => {
      if (authLoading) return;
      if (!currentUser || isOwner) {
        setReported(false); setActionsLoading(false); return;
      }
      try {
        const already = await eventService.hasReported(event.id);
        if (!cancelled) setReported(already);
      } catch {
        if (!cancelled) setReported(false);
      } finally {
        if (!cancelled) setActionsLoading(false);
      }
    };
    checkReported();
    return () => { cancelled = true; };
  }, [currentUser, isOwner, event.id, authLoading]);

  // --- HANDLER: FORM CHANGE (Fixes the freezing issue) ---
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --- HANDLERS ---
  const handleShare = async (e) => {
    e.stopPropagation();
    const text = `📅 ${event.title}\n📍 ${event.building}\n⏰ ${formatDateDisplay(event.event_date)}\n\n${event.description}`;
    if (navigator.share) await navigator.share({ title: event.title, text });
    else { await navigator.clipboard.writeText(text); setSnackMsg("Copied to clipboard"); setSeverity("success"); setOpenSnack(true); }
  };

  const handleReportClick = (e) => {
    e.stopPropagation();
    if (!currentUser) { setLoginRequiredOpen(true); return; }
    setReportDialogOpen(true);
  };

  const handleSubmitReport = async (reason, message) => {
    try {
      await eventService.reportEvent(event.id, reason, message);
      setReported(true); setSnackMsg("Reported"); setSeverity("success"); setReportDialogOpen(false);
    } catch (err) { setSnackMsg("Failed"); setSeverity("error"); } finally { setOpenSnack(true); }
  };

  const handleOpenEditDialog = (e) => {
    e?.stopPropagation();
    setEditForm({
      title: event.title, description: event.description, building: event.building, event_date: formatDateTimeForInput(event.event_date),
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    setEditLoading(true);
    try {
      await eventService.updateEvent(event.id, { ...editForm, event_date: convertToISO(editForm.event_date) });
      setSnackMsg("Updated"); setSeverity("success"); setEditDialogOpen(false); onEventUpdated?.();
    } catch { setSnackMsg("Failed"); setSeverity("error"); } finally { setEditLoading(false); setOpenSnack(true); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await eventService.deleteEvent(event.id);
      setSnackMsg("Deleted"); setSeverity("success"); setDeleteDialogOpen(false); onEventUpdated?.();
    } catch { setSnackMsg("Failed"); setSeverity("error"); } finally { setDeleteLoading(false); setOpenSnack(true); }
  };

  // --- SUB-COMPONENTS ---

  // 1. New Overlay Component (Consistent across List/Grid)
  const ReviewOverlay = () => (
    <Box
      sx={{
        position: 'absolute',
        inset: 0, // Covers the whole card
        zIndex: 10,
        bgcolor: 'rgba(255, 255, 255, 0.85)', // High opacity to fade out content
        backdropFilter: 'blur(4px)', // Glass effect
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: 3,
        borderRadius: 3
      }}
    >
      <ReportProblem color="error" sx={{ fontSize: 40, mb: 1 }} />
      <Typography variant="h6" fontWeight="bold" color="text.primary">
        Under Review
      </Typography>
      <Typography variant="body2" color="error.main" fontWeight={600} sx={{ mt: 0.5 }}>
        Reported by multiple users
      </Typography>
    </Box>
  );

  const DateBadge = ({ small = false }) => (
    <Box
      sx={{
        position: 'absolute',
        top: small ? 8 : 12,
        left: small ? 8 : 12,
        bgcolor: 'white',
        borderRadius: 2,
        width: small ? 40 : 48,
        height: small ? 44 : 52,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 2,
        overflow: 'hidden'
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: small ? '0.6rem' : '0.65rem', color: '#555', lineHeight: 1 }}>
        {dateMonth}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 800, color: '#000', lineHeight: 1, fontSize: small ? '1.1rem' : '1.4rem' }}>
        {dateDay}
      </Typography>
    </Box>
  );

  const ActionButtons = () => (
    <>
      <Tooltip title="Share">
        <IconButton
          onClick={handleShare}
          size="small"
          sx={{
            color: actualListView ? 'text.secondary' : 'white',
            bgcolor: actualListView ? 'transparent' : 'rgba(0,0,0,0.4)',
            '&:hover': { bgcolor: actualListView ? '#f5f5f5' : 'rgba(0,0,0,0.6)' }
          }}
        >
          <Share fontSize="small" />
        </IconButton>
      </Tooltip>

      {isOwner ? (
        <>
          <IconButton onClick={handleOpenEditDialog} size="small" sx={{ color: actualListView ? 'primary.main' : 'white', bgcolor: actualListView ? 'transparent' : 'rgba(0,0,0,0.4)', '&:hover': { bgcolor: actualListView ? '#e3f2fd' : 'rgba(0,0,0,0.6)' } }}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton onClick={(e) => { e.stopPropagation(); setDeleteDialogOpen(true); }} size="small" sx={{ color: actualListView ? 'error.main' : 'white', bgcolor: actualListView ? 'transparent' : 'rgba(0,0,0,0.4)', '&:hover': { bgcolor: actualListView ? '#ffebee' : 'rgba(0,0,0,0.6)' } }}>
            <Delete fontSize="small" />
          </IconButton>
        </>
      ) : (
        <Tooltip title={reported ? "Reported" : "Report"}>
          <IconButton
            onClick={handleReportClick}
            disabled={authLoading || actionsLoading || reported}
            size="small"
            sx={{
              color: reported ? (actualListView ? 'error.main' : 'white') : (actualListView ? 'text.secondary' : 'white'),
              bgcolor: actualListView ? 'transparent' : (reported ? 'rgba(211, 47, 47, 0.8)' : 'rgba(0,0,0,0.4)'),
              '&:hover': { bgcolor: actualListView ? '#f5f5f5' : (reported ? 'rgba(211, 47, 47, 1)' : 'rgba(0,0,0,0.6)') }
            }}
          >
            {(authLoading || (currentUser && actionsLoading)) ? <CircularProgress size={16} color="inherit" /> : <Flag fontSize="small" />}
          </IconButton>
        </Tooltip>
      )}
    </>
  );

  // ==========================================
  // VIEW 1: HORIZONTAL LIST VIEW
  // ==========================================
  if (actualListView) {
    return (
      <>
        <Card
          elevation={0}
          sx={{
            position: 'relative', // Necessary for absolute overlay
            display: 'flex',
            borderRadius: 3,
            mb: 2,
            bgcolor: 'white',
            border: '1px solid #eee',
            height: 160,
            overflow: 'hidden',
            transition: 'all 0.2s',
            '&:hover': { borderColor: '#ccc', transform: 'translateX(4px)' }
          }}
        >
          {/* APPLY OVERLAY HERE FOR LIST VIEW */}
          {isUnderReview && <ReviewOverlay />}

          {/* LEFT: IMAGE & BADGE */}
          <Box sx={{ width: 220, position: 'relative', flexShrink: 0 }}>
            <DateBadge small />
            <CardMedia
              component="img"
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              image={event.image_url || "https://via.placeholder.com/200x200?text=Event"}
              alt={event.title}
            />
          </Box>

          {/* MIDDLE: CONTENT */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, mb: 1 }}>
              {event.title}
            </Typography>

            <Stack direction="row" spacing={3} sx={{ mb: 1.5 }}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <AccessTime sx={{ fontSize: 16, color: '#d32f2f' }} />
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  {timeDisplay}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <LocationOn sx={{ fontSize: 18, color: '#757575' }} />
                <Typography variant="body2" color="text.secondary">
                  {event.building}
                </Typography>
              </Box>
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>
              {event.description}
            </Typography>
          </Box>

          {/* RIGHT: ACTIONS */}
          <Box sx={{
            width: 60,
            borderLeft: '1px solid #f0f0f0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            bgcolor: '#fafafa'
          }}>
            <ActionButtons />
          </Box>
        </Card>
        
        <Dialogs />
      </>
    );
  }

  // ==========================================
  // VIEW 2: VERTICAL GRID VIEW (DEFAULT)
  // ==========================================
  return (
    <>
      <Card
        elevation={0}
        sx={{
          position: "relative",
          borderRadius: 3,
          bgcolor: 'transparent',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s',
          '&:hover': { transform: 'translateY(-4px)' }
        }}
      >
        <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden' }}>
          
          {/* APPLY OVERLAY HERE FOR GRID VIEW */}
          {isUnderReview && <ReviewOverlay />}

          <DateBadge />
          <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 0.5, zIndex: 2 }}>
            <ActionButtons />
          </Box>

          <CardMedia
            component="img"
            sx={{ aspectRatio: '4/3', objectFit: 'cover', bgcolor: '#f0f0f0' }}
            image={event.image_url || "https://via.placeholder.com/400x300?text=Event"}
            alt={event.title}
          />
        </Box>

        <CardContent sx={{ px: 0.5, pt: 1.5, pb: 0 }}>
          <Typography variant="h6" fontWeight={800} sx={{ fontSize: '1rem', lineHeight: 1.3, mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.title}
          </Typography>

          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <AccessTime sx={{ fontSize: 16, color: '#d32f2f' }} />
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#555' }}>
                {timeDisplay}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={0.5}>
              <LocationOn sx={{ fontSize: 18, color: '#757575' }} />
              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#757575', maxWidth: 100 }} noWrap>
                {event.building}
              </Typography>
            </Box>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '4.5em' }}>
            {event.description}
          </Typography>
        </CardContent>
      </Card>

      <Dialogs />
    </>
  );

  // --- REUSABLE DIALOGS ---
  function Dialogs() {
    return (
      <>
        <ReportDialog
          open={reportDialogOpen}
          onClose={() => setReportDialogOpen(false)}
          onSubmit={handleSubmitReport}
        />

        <LoginRequiredDialog
          open={loginRequiredOpen}
          onClose={() => setLoginRequiredOpen(false)}
        />

        <EditEventDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSave={handleSaveEdit}
          formData={editForm}
          onFormChange={handleEditFormChange}
          loading={editLoading}
        />

        <ConfirmationDialog
          open={deleteDialogOpen}
          title="Delete Event"
          message="Delete this event forever?"
          confirmText="Delete"
          confirmColor="error"
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteDialogOpen(false)}
        />

        <Snackbar
          open={openSnack}
          autoHideDuration={3000}
          onClose={() => setOpenSnack(false)}
        >
          <Alert severity={severity}>{snackMsg}</Alert>
        </Snackbar>
      </>
    );
  }
}