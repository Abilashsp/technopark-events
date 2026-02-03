import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Skeleton,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Dialog,
  IconButton,
  Tooltip,
  Stack,
  Button
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  Refresh,
  CheckCircleOutline,
  ZoomIn
} from "@mui/icons-material";

// 1. Imports
import { eventService } from "../services/eventService";
import { useDialog, DIALOG_TYPES } from "../contexts/DialogContext"; // <--- GLOBAL DIALOG

/* ================= HELPER ================= */
const groupReasons = (reports = []) =>
  reports.reduce((acc, r) => {
    acc[r.reason] = (acc[r.reason] || 0) + 1;
    return acc;
  }, {});

/* ================= SUB-COMPONENT: IMAGE PREVIEW ================= */
const ImagePreviewDialog = ({ open, url, onClose }) => (
  <Dialog 
    open={open} 
    onClose={onClose} 
    maxWidth="md" 
    fullWidth
    PaperProps={{ sx: { bgcolor: "transparent", boxShadow: "none" } }}
  >
    <Box 
      component="img" 
      src={url} 
      onClick={onClose}
      sx={{ 
        width: "100%", 
        height: "auto", 
        maxHeight: "80vh", 
        objectFit: "contain", 
        borderRadius: 2,
        cursor: "pointer"
      }} 
    />
  </Dialog>
);

export default function AdminModeration() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 2. Use Global Dialog
  const { openDialog } = useDialog();

  // Image Preview State (Kept local as it's specific to this view)
  const [previewUrl, setPreviewUrl] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await eventService.getReportedEvents();
      setEvents(data || []);
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // 3. Optimized Action Handler
  const handleActionClick = (type, eventId) => {
    const isApprove = type === 'approve';
    
    openDialog(DIALOG_TYPES.CONFIRM, {
      title: isApprove ? "Approve Event" : "Reject Event",
      message: isApprove 
        ? "Are you sure you want to keep this event? All reports will be dismissed." 
        : "Are you sure you want to remove this event permanently? This cannot be undone.",
      confirmText: isApprove ? "Approve & Keep" : "Reject & Remove",
      confirmColor: isApprove ? "success" : "error",
      onConfirm: async () => {
        if (isApprove) {
          await eventService.approveEvent(eventId);
        } else {
          await eventService.rejectEvent(eventId);
        }
        await load(); // Refresh list after action
      }
    });
  };

  // Table Skeleton
  const TableRowsSkeleton = () => (
    [...Array(3)].map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton variant="rectangular" width={60} height={40} /></TableCell>
        <TableCell><Skeleton width={150} /><Skeleton width={100} /></TableCell>
        <TableCell><Skeleton width={100} /></TableCell>
        <TableCell><Skeleton width={200} /></TableCell>
        <TableCell align="right"><Skeleton width={80} /></TableCell>
      </TableRow>
    ))
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Moderation Queue
          </Typography>
          <Typography color="text.secondary">
            Manage reported content
          </Typography>
        </Box>
        <Button startIcon={<Refresh />} onClick={load} variant="outlined">
          Refresh
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell width={100}>Image</TableCell>
              <TableCell width={250}>Event Details</TableCell>
              <TableCell width={150}>Location</TableCell>
              <TableCell>Report Reasons</TableCell>
              <TableCell align="right" width={140}>Actions</TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {loading ? (
              <TableRowsSkeleton />
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <CheckCircleOutline color="success" sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" color="text.secondary">No reported events found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => {
                const grouped = groupReasons(event.event_reports);
                
                return (
                  <TableRow 
                    key={event.id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    {/* 1. IMAGE CELL */}
                    <TableCell>
                      <Tooltip title="Click to zoom">
                        <Box 
                          sx={{ 
                            position: 'relative', 
                            width: 80, 
                            height: 50, 
                            cursor: 'pointer',
                            borderRadius: 1,
                            overflow: 'hidden',
                            '&:hover .zoom-icon': { opacity: 1 }
                          }}
                          onClick={() => setPreviewUrl(event.image_url)}
                        >
                          <Avatar 
                            variant="square" 
                            src={event.image_url} 
                            sx={{ width: '100%', height: '100%' }}
                          />
                          <Box 
                            className="zoom-icon"
                            sx={{ 
                              position: 'absolute', inset: 0, 
                              bgcolor: 'rgba(0,0,0,0.3)', 
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              opacity: 0, transition: '0.2s'
                            }}
                          >
                            <ZoomIn sx={{ color: 'white' }} />
                          </Box>
                        </Box>
                      </Tooltip>
                    </TableCell>

                    {/* 2. DETAILS CELL */}
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {event.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {new Date(event.event_date).toLocaleDateString()}
                      </Typography>
                    </TableCell>

                    {/* 3. LOCATION CELL */}
                    <TableCell>
                      <Chip 
                        label={event.building} 
                        size="small" 
                        variant="outlined" 
                        sx={{ borderRadius: 1 }} 
                      />
                    </TableCell>

                    {/* 4. REPORTS CELL */}
                    <TableCell>
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {Object.entries(grouped).map(([reason, count]) => (
                          <Chip
                            key={reason}
                            label={`${reason.replace("_", " ")} (${count})`}
                            color="error"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        ))}
                      </Stack>
                      {/* Show snippets of messages if they exist */}
                      {event.event_reports.some(r => r.message) && (
                         <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                           "{event.event_reports.find(r => r.message)?.message}"
                           {event.event_reports.filter(r => r.message).length > 1 && "..."}
                         </Typography>
                      )}
                    </TableCell>

                    {/* 5. ACTIONS CELL */}
                    <TableCell align="right">
                      <Stack direction="row" justifyContent="flex-end" spacing={1}>
                        <Tooltip title="Keep Event (Dismiss Reports)">
                          <IconButton 
                            color="success" 
                            onClick={() => handleActionClick('approve', event.id)}
                            size="small"
                            sx={{ border: '1px solid', borderColor: 'success.light' }}
                          >
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete Event">
                          <IconButton 
                            color="error" 
                            onClick={() => handleActionClick('reject', event.id)}
                            size="small"
                            sx={{ border: '1px solid', borderColor: 'error.light' }}
                          >
                            <Cancel />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>


      <ImagePreviewDialog 
        open={!!previewUrl} 
        url={previewUrl} 
        onClose={() => setPreviewUrl(null)} 
      />
    </Container>
  );
}