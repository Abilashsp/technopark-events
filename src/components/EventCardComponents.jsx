import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
  Button,
} from "@mui/material";
import {
  Share,
  Edit,
  Delete,
  ReportProblem,
  AccessTime,
  LocationOn,
} from "@mui/icons-material";


// 1. Overlay for Reported Events
export const ReviewOverlay = () => (
  <Box
    sx={{
      position: "absolute",
      inset: 0,
      zIndex: 10,
      bgcolor: "rgba(255, 255, 255, 0.85)",
      backdropFilter: "blur(4px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      p: 3,
      borderRadius: 3,
    }}
  >
    <ReportProblem color="error" sx={{ fontSize: 40, mb: 1 }} />
    <Typography variant="h6" fontWeight="bold">
      Under Review
    </Typography>
    <Typography
      variant="body2"
      color="error.main"
      fontWeight={600}
      sx={{ mt: 0.5 }}
    >
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
        position: "absolute",
        top: small ? 8 : 12,
        left: small ? 8 : 12,
        bgcolor: "white",
        borderRadius: 2,
        width: small ? 40 : 48,
        height: small ? 44 : 52,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        zIndex: 2,
        overflow: "hidden",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 800,
          textTransform: "uppercase",
          fontSize: small ? "0.6rem" : "0.65rem",
          color: "#555",
          lineHeight: 1,
        }}
      >
        {dateObj.toLocaleString("default", { month: "short" }).toUpperCase()}
      </Typography>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 800,
          color: "#000",
          lineHeight: 1,
          fontSize: small ? "1.1rem" : "1.4rem",
        }}
      >
        {dateObj.getDate()}
      </Typography>
    </Box>
  );
};

// 3. Action Buttons (Unified Icon Actions + Your Report Button)
export const CardActions = ({
  isOwner,
  reported,
  loading,
  listView,
  onShare,
  onEdit,
  onDelete,
  onReport,
}) => {
  const btnStyle = (color) => ({
    color:  color,
    bgcolor:  "transparent" ,
    "&:hover": { bgcolor: listView ? "#f5f5f5" : "rgba(0,0,0,0.6)" },
  });

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      {/* Left side: Standard Icons */}
      <Stack direction="row" spacing={0.5}>
        <Tooltip title="Share">
          <IconButton onClick={onShare} size="small" sx={btnStyle()}>
            <Share fontSize="small" />
          </IconButton>
        </Tooltip>

        {isOwner && (
          <>
            <Tooltip title="Edit">
              <IconButton
                onClick={onEdit}
                size="small"
                sx={btnStyle("primary.main")}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                onClick={onDelete}
                size="small"
                sx={btnStyle("error.main")}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Stack>

      {/* Right side: Your modified Report Button */}
      {!isOwner && (
        <Tooltip title={reported ? "Reported" : "Report"}>
          <Button
            onClick={onReport}
            disabled={loading || reported}
            size="small"
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.75rem",
              minWidth: "auto",
              p: 0.5,
              color: reported ? "" : "red",
            }}
          >
            {loading ? (
              <CircularProgress size={16} color="inherit" />
            ) : reported ? (
              "Reported"
            ) : (
              "Report"
            )}
          </Button>
        </Tooltip>
      )}
    </Box>
  );
};
