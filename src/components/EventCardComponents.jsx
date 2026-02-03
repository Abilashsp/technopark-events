import { Box, Typography, CardMedia, IconButton, Tooltip, CircularProgress, Stack } from "@mui/material";
import { Share, Edit, Delete, Flag, ReportProblem, AccessTime, LocationOn } from "@mui/icons-material";
import { formatTimeDisplay } from "../utils/dateTimeHelpers";

// 1. Overlay for Reported Events
export const ReviewOverlay = () => (
  <Box
    sx={{
      position: "absolute", inset: 0, zIndex: 10,
      bgcolor: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(4px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      textAlign: "center", p: 3, borderRadius: 3,
    }}
  >
    <ReportProblem color="error" sx={{ fontSize: 40, mb: 1 }} />
    <Typography variant="h6" fontWeight="bold">Under Review</Typography>
    <Typography variant="body2" color="error.main" fontWeight={600} sx={{ mt: 0.5 }}>
      Reported by multiple users
    </Typography>
  </Box>
);

// 2. Date Badge
export const DateBadge = ({ date, small = false }) => {
  const dateObj = new Date(date);
  return (
    <Box
      sx={{
        position: "absolute", top: small ? 8 : 12, left: small ? 8 : 12,
        bgcolor: "white", borderRadius: 2,
        width: small ? 40 : 48, height: small ? 44 : 52,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)", zIndex: 2, overflow: "hidden",
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", fontSize: small ? "0.6rem" : "0.65rem", color: "#555", lineHeight: 1 }}>
        {dateObj.toLocaleString("default", { month: "short" }).toUpperCase()}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 800, color: "#000", lineHeight: 1, fontSize: small ? "1.1rem" : "1.4rem" }}>
        {dateObj.getDate()}
      </Typography>
    </Box>
  );
};

// 3. Action Buttons (Refactored to be cleaner)
export const CardActions = ({ isOwner, reported, loading, listView, onShare, onEdit, onDelete, onReport }) => {
  const btnStyle = (color) => ({
    color: listView ? color || "text.secondary" : "white",
    bgcolor: listView ? "transparent" : "rgba(0,0,0,0.4)",
    "&:hover": { bgcolor: listView ? "#f5f5f5" : "rgba(0,0,0,0.6)" },
  });

  return (
    <>
      <Tooltip title="Share"><IconButton onClick={onShare} size="small" sx={btnStyle()}><Share fontSize="small" /></IconButton></Tooltip>
      
      {isOwner ? (
        <>
          <IconButton onClick={onEdit} size="small" sx={btnStyle("primary.main")}><Edit fontSize="small" /></IconButton>
          <IconButton onClick={onDelete} size="small" sx={btnStyle("error.main")}><Delete fontSize="small" /></IconButton>
        </>
      ) : (
        <Tooltip title={reported ? "Reported" : "Report"}>
          <IconButton 
            onClick={onReport} 
            disabled={loading || reported} 
            size="small"
            sx={{
              ...btnStyle(reported ? "error.main" : "text.secondary"),
              ...(reported && !listView && { bgcolor: "rgba(211, 47, 47, 0.8)" })
            }}
          >
            {loading ? <CircularProgress size={16} color="inherit" /> : <Flag fontSize="small" />}
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};

// 4. Common Event Info Component
export const EventInfo = ({ title, date, building, description, compact = false }) => (
  <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2 }}>
    <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, mb: 1, fontSize: compact ? "1rem" : "1.1rem" }} noWrap={compact}>
      {title}
    </Typography>

    <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
      <Box display="flex" alignItems="center" gap={0.5}>
        <AccessTime sx={{ fontSize: 16, color: "#d32f2f" }} />
        <Typography variant="body2" fontWeight={600} color="text.secondary" fontSize="0.8rem">
          {formatTimeDisplay(date)}
        </Typography>
      </Box>
      <Box display="flex" alignItems="center" gap={0.5}>
        <LocationOn sx={{ fontSize: 18, color: "#757575" }} />
        <Typography variant="body2" color="text.secondary" fontSize="0.8rem" noWrap maxWidth={100}>
          {building}
        </Typography>
      </Box>
    </Stack>

    <Typography variant="body2" color="text.secondary" sx={{
      display: "-webkit-box", WebkitLineClamp: compact ? 3 : 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5
    }}>
      {description}
    </Typography>
  </Box>
);