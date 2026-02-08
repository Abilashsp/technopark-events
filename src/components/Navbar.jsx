import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Chip,
  
} from "@mui/material";
import {
  AddCircleOutline,
  Google,
  Add,
  AdminPanelSettings,
  Logout,
  Lock,
  EventNote
} from "@mui/icons-material";
import { Link } from "react-router-dom";

// 1. Context & Service Imports
import { useRefresh } from "../contexts/RefreshContext"; // Import Refresh Hook
import { useAuth } from "../contexts/AuthContext";
import { useDialog, DIALOG_TYPES } from "../contexts/DialogContext"; // Global Dialog Hook

// 2. Component Imports
import EventFormDialog from "./dialogs/EventFormDialog";

export default function Navbar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Hooks
  const {
    user,
    isAdmin,
    loading: authLoading,
    signInWithGoogle,
    signOut,
  } = useAuth();
  const { openDialog } = useDialog(); // <--- Use Global Dialogs
  const { triggerRefresh } = useRefresh(); // <--- Use Refresh Hook

  // Local State
  const [anchorEl, setAnchorEl] = useState(null);
  const [createEventOpen, setCreateEventOpen] = useState(false); // Only state needed now

  const adminColor = "#ff9800";

  /* ================= HANDLERS ================= */

  const handleLogin = async () => {
    await signInWithGoogle();
  };

  // 1. REPLACED: Logout now uses Global Dialog
  const handleLogoutClick = () => {
    setAnchorEl(null);
    openDialog(DIALOG_TYPES.CONFIRM, {
      title: "Sign Out",
      message: "Are you sure you want to sign out?",
      confirmText: "Sign Out",
      cancelText: "Stay",
      onConfirm: async () => {
        await signOut();
        window.location.reload();
      },
    });
  };

  // 2. REPLACED: Login Prompt uses Global Dialog
  const handlePostClick = () => {
    if (!user) {
      openDialog(DIALOG_TYPES.LOGIN, {
        title: "Login Required",
        message: "You must be signed in to post an event.",
      });
    } else {
      setCreateEventOpen(true);
    }
  };

  const handleEventSuccess = () => {
    triggerRefresh(); // Trigger global refresh
    console.log("Event created - Refresh Triggered");
  };

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  /* ================= UI ================= */
  return (
    <>
      <AppBar
        position="sticky"
        color="default"
        elevation={1}
        sx={{
          bgcolor: "white",
          borderBottom: isAdmin ? `3px solid ${adminColor}` : "none",
          transition: "border-bottom 0.3s ease",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          {/* LEFT: LOGO */}
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                textDecoration: "none",
                color: "#1976d2",
                fontWeight: "bold",
                fontSize: { xs: "1.1rem", sm: "1.25rem" },
                display: "flex",
                alignItems: "center",
              }}
            >
              TechnoPark<span style={{ color: "#333" }}>Events</span>
            </Typography>

            {isAdmin && (
              <Chip
                label={isMobile ? "ADMIN" : "ADMIN MODE"}
                icon={<AdminPanelSettings sx={{ "&&": { color: "white" } }} />}
                size="small"
                sx={{
                  bgcolor: adminColor,
                  color: "white",
                  fontWeight: "bold",
                  height: 24,
                  fontSize: "0.75rem",
                  cursor: "default",
                }}
              />
            )}
          </Box>

          {/* RIGHT: ACTIONS */}
          <Box display="flex" alignItems="center" gap={isMobile ? 1 : 2}>
            {authLoading ? (
              <CircularProgress size={28} />
            ) : user ? (
              <>
                {/* POST BUTTON */}
                {isMobile ? (
                  <Tooltip title="Post Event">
                    <IconButton
                      onClick={handlePostClick}
                      color="primary"
                      sx={{
                        bgcolor: "#e3f2fd",
                        "&:hover": { bgcolor: "#bbdefb" },
                      }}
                    >
                      <Add />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddCircleOutline />}
                    onClick={handlePostClick}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Post Event
                  </Button>
                )}

                {/* USER AVATAR */}
                <Avatar
                  src={user.user_metadata?.avatar_url}
                  alt={user.user_metadata?.full_name}
                  onClick={handleMenu}
                  sx={{
                    cursor: "pointer",
                    width: 36,
                    height: 36,
                    border: isAdmin
                      ? `2px solid ${adminColor}`
                      : "2px solid #fff",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                  }}
                />

                {/* DROPDOWN MENU */}
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                >
                  {/* NEW: My Events Link */}
                  <MenuItem
                    component={Link}
                    to="/my-events"
                    onClick={handleClose}
                  >
                    <EventNote
                      fontSize="small"
                      sx={{ mr: 1.5, color: "text.secondary" }}
                    />
                    My Events
                  </MenuItem>

                  {isAdmin && (
                    <MenuItem
                      component={Link}
                      to="/admin"
                      onClick={handleClose}
                      sx={{ color: adminColor, fontWeight: "bold" }}
                    >
                      <AdminPanelSettings sx={{ mr: 1, fontSize: 20 }} />
                      Admin Panel
                    </MenuItem>
                  )}

                  <MenuItem onClick={handleLogoutClick}>
                    <Logout
                      fontSize="small"
                      sx={{ mr: 1.5, color: "text.secondary" }}
                    />
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                {/* GUEST VIEW */}
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Lock />}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                  onClick={handlePostClick} // Will trigger Login Dialog via Context
                >
                  Post Event
                </Button>
                <Button
                  variant={isMobile ? "text" : "outlined"}
                  startIcon={<Google />}
                  onClick={handleLogin}
                  sx={{ textTransform: "none" }}
                >
                  {isMobile ? "Sign In" : "Sign In with Google"}
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <EventFormDialog
        open={createEventOpen}
        onClose={() => setCreateEventOpen(false)}
        onSuccess={handleEventSuccess}
        eventToEdit={null} // Explicitly null for Create Mode
      />
    </>
  );
}
