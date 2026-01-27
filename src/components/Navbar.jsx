import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, Menu, MenuItem } from '@mui/material';
import { AddCircleOutline, Google } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAnchorEl(null);
    window.location.reload();
  };

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <AppBar position="sticky" color="default" elevation={1} sx={{ bgcolor: 'white' }}>
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: '#1976d2', fontWeight: 'bold' }}>
          TechnoPark<span style={{ color: '#333' }}>Events</span>
        </Typography>

        {user ? (
          <Box display="flex" alignItems="center" gap={2}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddCircleOutline />}
              component={Link} 
              to="/upload"
            >
              Post Event
            </Button>
            <Avatar 
              src={user.user_metadata.avatar_url} 
              alt={user.user_metadata.full_name}
              onClick={handleMenu}
              sx={{ cursor: 'pointer' }}
            />
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        ) : (
          <Button 
            variant="outlined" 
            startIcon={<Google />} 
            onClick={handleLogin}
          >
            Sign In
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}