import React from 'react';
import { CircularProgress, Box } from '@mui/material';

export default function LoadingSpinner({ size = 24, thickness = 4, sx = {} }) {
  return (
    <Box display="flex" alignItems="center" justifyContent="center">
      <CircularProgress 
        size={size} 
        thickness={thickness} 
        sx={{ color: '#1a1a1a', ...sx }}
      />
    </Box>
  );
}
