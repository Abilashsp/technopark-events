import React, { useEffect, useState } from 'react';
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
  Chip // 1. Import Chip
} from '@mui/material';
// 2. Import Admin Icon
import { AddCircleOutline, Google, Add, AdminPanelSettings, Logout } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { authService } from '../services/authService';
import { ConfirmationDialog } from './dialogs';
import { useAuth } from '../contexts/AuthContext';


export default function Navbar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, isAdmin, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);


  /* ================= HANDLERS ================= */
  /* ================= HANDLERS ================= */
  const handleLogin = async () => {
    await signInWithGoogle();
  };


  const handleLogoutClick = () => {
    setAnchorEl(null);
    setLogoutDialogOpen(true);
  };

  const handleConfirmLogout = async () => {
    setLogoutDialogOpen(false);
    await signOut();
    window.location.reload();
  };


  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  /* ================= UI ================= */

  // Design Config for Admin
  const adminColor = '#ff9800'; // Warning Orange/Gold color to signify Admin

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={1}
      sx={{
        bgcolor: 'white',
        // 3. Admin Distinct Visual: Colored bottom border
        borderBottom: isAdmin ? `3px solid ${adminColor}` : 'none',
        transition: 'border-bottom 0.3s ease'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>

        {/* LOGO AREA */}
        <Box display="flex" alignItems="center" gap={1}>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              textDecoration: 'none',
              color: '#1976d2',
              fontWeight: 'bold',
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              display: 'flex',
              alignItems: 'center'
            }}
          >
            TechnoPark<span style={{ color: '#333' }}>Events</span>
          </Typography>

          {/* 4. Admin Badge next to Logo */}
          {isAdmin && (
            <Chip
              label={isMobile ? "ADMIN" : "ADMIN MODE"}
              icon={<AdminPanelSettings sx={{ '&&': { color: 'white' } }} />}
              size="small"
              sx={{
                bgcolor: adminColor,
                color: 'white',
                fontWeight: 'bold',
                height: 24,
                fontSize: '0.75rem',
                cursor: 'default'
              }}
            />
          )}
        </Box>

        {/* RIGHT SIDE */}
        <Box display="flex" alignItems="center" gap={isMobile ? 1 : 2}>

          {authLoading ? (
            <CircularProgress size={28} />
          ) : user ? (
            <>
              {/* POST EVENT */}
              {isMobile ? (
                <Tooltip title="Post Event">
                  <IconButton
                    component={Link}
                    to="/upload"
                    color="primary"
                    sx={{ bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' } }}
                  >
                    <Add />
                  </IconButton>
                </Tooltip>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddCircleOutline />}
                  component={Link}
                  to="/upload"
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Post Event
                </Button>
              )}

              {/* AVATAR */}
              <Avatar
                src={user.user_metadata?.avatar_url}
                alt={user.user_metadata?.full_name}
                onClick={handleMenu}
                sx={{
                  cursor: 'pointer',
                  width: 36,
                  height: 36,
                  // 5. Admin Visual: Ring around avatar
                  border: isAdmin ? `2px solid ${adminColor}` : '2px solid #fff',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
              />

              {/* MENU */}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                {isAdmin && (
                  <MenuItem
                    component={Link}
                    to="/admin"
                    onClick={handleClose}
                    // 6. Highlight the Admin Panel link in the menu
                    sx={{ color: adminColor, fontWeight: 'bold' }}
                  >
                    <AdminPanelSettings sx={{ mr: 1, fontSize: 20 }} />
                    Admin Panel
                  </MenuItem>
                )}

                <MenuItem onClick={handleLogoutClick}>
                  <Logout fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              variant={isMobile ? 'text' : 'outlined'}
              startIcon={<Google />}
              onClick={handleLogin}
              sx={{ textTransform: 'none' }}
            >
              {isMobile ? 'Sign In' : 'Sign In with Google'}
            </Button>
          )}
        </Box>
      </Toolbar>

      {/* LOGOUT DIALOG */}
      <ConfirmationDialog
        open={logoutDialogOpen}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Stay"
        onConfirm={handleConfirmLogout}
        onCancel={() => setLogoutDialogOpen(false)}
      />
    </AppBar>
  );
}