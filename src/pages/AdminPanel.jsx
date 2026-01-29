import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  Box,
  Skeleton,
  Chip,
  CardMedia,
  Paper,
  Fade
} from "@mui/material";
import {
  CheckCircleOutline,
  HighlightOff,
  ReportProblem,
  Event as EventIcon,
  LocationOn,
  Refresh
} from "@mui/icons-material";
import { eventService } from "../services/eventService";
import { ConfirmationDialog } from "../components/dialogs";

/* ================= HELPER ================= */
const groupReasons = (reports = []) =>
  reports.reduce((acc, r) => {
    acc[r.reason] = (acc[r.reason] || 0) + 1;
    return acc;
  }, {});

export default function AdminModeration() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject'
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);


  const load = async () => {
    setLoading(true);
    try {
      const data = await eventService.getReportedEvents();
      setEvents(data || []);
      console.log(data, "adataaa")
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const LoadingSkeleton = () => (
    <Card sx={{ display: "flex", mb: 2, height: 180 }}>
      <Skeleton variant="rectangular" width={200} height="100%" />
      <Box sx={{ flex: 1, p: 2 }}>
        <Skeleton width="60%" height={28} />
        <Skeleton width="40%" height={20} />
      </Box>
    </Card>
  );

  const handleOpenConfirm = (type, id) => {
    setActionType(type);
    setSelectedEventId(id);
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedEventId || !actionType) return;

    setActionLoading(true);
    try {
      if (actionType === 'approve') {
        await eventService.approveEvent(selectedEventId);
      } else {
        await eventService.rejectEvent(selectedEventId);
      }
      // Refresh list
      await load();
    } catch (error) {
      console.error("Action failed", error);
    } finally {
      setActionLoading(false);
      setConfirmOpen(false);
      setSelectedEventId(null);
      setActionType(null);
    }
  };


  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Moderation Queue
          </Typography>
          <Typography color="text.secondary">
            Review reported events
          </Typography>
        </Box>
        <Button startIcon={<Refresh />} onClick={load}>
          Refresh
        </Button>
      </Box>

      <Stack spacing={2}>
        {loading && <>
          <LoadingSkeleton />
          <LoadingSkeleton />
        </>}

        {!loading && events.length === 0 && (
          <Paper sx={{ p: 6, textAlign: "center" }}>
            <CheckCircleOutline color="success" sx={{ fontSize: 60 }} />
            <Typography>No reported events 🎉</Typography>
          </Paper>
        )}

        {!loading && events.map(event => {
          const grouped = groupReasons(event.event_reports);

          return (
            <Fade in key={event.id}>
              <Card sx={{ display: "flex", borderLeft: "6px solid #d32f2f" }}>
                <CardMedia
                  component="img"
                  sx={{ width: 180 }}
                  image={event.image_url}
                />

                <Box sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700}>
                      {event.title}
                    </Typography>

                    <Stack direction="row" spacing={2} mt={1}>
                      <EventIcon fontSize="small" />
                      <Typography variant="body2">
                        {new Date(event.event_date).toLocaleDateString()}
                      </Typography>
                      <LocationOn fontSize="small" />
                      <Typography variant="body2">
                        {event.building}
                      </Typography>
                    </Stack>

                    {/* REPORT REASONS */}
                    <Box mt={2}>
                      <Typography fontWeight={700} color="error">
                        Report reasons
                      </Typography>

                      <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                        {Object.entries(grouped).map(([reason, count]) => (
                          <Chip
                            key={reason}
                            label={`${reason.replace("_", " ")} (${count})`}
                            color="error"
                            size="small"
                          />
                        ))}
                      </Stack>

                      {/* OPTIONAL MESSAGES */}
                      <Stack mt={2} spacing={1}>
                        {event.event_reports.map((r, i) =>
                          r.message ? (
                            <Paper key={i} sx={{ p: 1 }}>
                              <Typography variant="body2">
                                {r.message}
                              </Typography>
                            </Paper>
                          ) : null
                        )}
                      </Stack>
                    </Box>
                  </CardContent>
                </Box>

                {/* ACTIONS */}
                <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                  <Button
                    color="success"
                    variant="contained"
                    startIcon={<CheckCircleOutline />}
                    onClick={() => handleOpenConfirm('approve', event.id)}
                  >
                    Keep
                  </Button>

                  <Button
                    color="error"
                    variant="contained"
                    startIcon={<HighlightOff />}
                    onClick={() => handleOpenConfirm('reject', event.id)}
                  >
                    Remove
                  </Button>
                </Box>
              </Card>
            </Fade>
          );
        })}
      </Stack>

      <ConfirmationDialog
        open={confirmOpen}
        title={actionType === 'approve' ? "Approve Event" : "Reject Event"}
        message={
          actionType === 'approve'
            ? "Are you sure you want to keep this event? Review reports will be dismissed."
            : "Are you sure you want to remove this event permanently?"
        }
        confirmText={actionType === 'approve' ? "Approve & Keep" : "Reject & Remove"}
        confirmColor={actionType === 'approve' ? "success" : "error"}
        loading={actionLoading}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmOpen(false)}
      />
    </Container>
  );
}
