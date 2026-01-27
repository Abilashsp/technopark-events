import React, { useEffect, useState, useCallback } from 'react';
import {
  Container,
  Grid,
  Chip,
  Box,
  CircularProgress,
  Typography,
  Fade,
  TextField,
  InputAdornment,
  Button,
  Pagination,
  IconButton,
  Tooltip
} from '@mui/material';
import { Search, ViewAgenda, ViewWeek } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { eventService } from '../services/eventService';
import { BUILDING_FILTERS, DATE_FILTERS, PAGE_SIZE } from '../constants/dateFilters';

export default function Feed() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'

  // Get filters from URL params
  const buildingFilter = searchParams.get('building') || 'All';
  const dateFilter = searchParams.get('date') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const result = await eventService.fetchEvents(
      buildingFilter,
      dateFilter === 'all' ? null : dateFilter,
      searchQuery,
      currentPage,
      PAGE_SIZE
    );
    setEvents(result.events || []);
    setTotalPages(result.totalPages || 1);
    setLoading(false);
  }, [buildingFilter, dateFilter, searchQuery, currentPage]);

  const handleBuildingChange = (building) => {
    const params = new URLSearchParams(searchParams);
    params.set('building', building);
    params.set('page', '1'); // Reset to page 1 on filter change
    setSearchParams(params);
  };

  const handleDateChange = (date) => {
    const params = new URLSearchParams(searchParams);
    params.set('date', date);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      params.set('search', searchInput);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (event, value) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', value.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Separate function for refresh that can be called from EventCard
  const handleRefreshEvents = useCallback(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: 2,
        minHeight: '100vh',
        bgcolor: '#fafafa',
        direction: 'ltr'
      }}
    >

      {/* Header Section */}
      <Box mb={2.5} textAlign="left">
        <Typography variant="h5" component="h1" fontWeight={800} color="#1a1a1a" gutterBottom sx={{ mb: 0.5 }}>
          Discover Events
        </Typography>
        <Typography variant="body2" color="text.secondary">
          See what's happening around Technopark today.
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box mb={2.5} display="flex" gap={1} flexWrap={{ xs: 'wrap', sm: 'nowrap' }} sx={{ direction: 'ltr' }}>
        <TextField
          fullWidth
          placeholder="Search events by title or description..."
          variant="outlined"
          size="small"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#666' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            bgcolor: '#fff',
            borderRadius: 1,
            '& .MuiOutlinedInput-root': {
              fontSize: { xs: '14px', md: '16px' },
            }
          }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          sx={{
            whiteSpace: 'nowrap',
            fontSize: { xs: '12px', md: '14px' },
            px: { xs: 1.5, md: 2 },
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          Search
        </Button>
      </Box>

      {/* Building Filter Chips */}
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          pb: 1,
          justifyContent: 'space-between',
          alignItems: 'center',
          direction: 'ltr',
          '::-webkit-scrollbar': { display: 'none' }
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, overflow: 'auto', flex: 1, '::-webkit-scrollbar': { display: 'none' } }}>
          {BUILDING_FILTERS.map((b) => (
            <Chip
              key={b.value}
              label={b.label}
              onClick={() => handleBuildingChange(b.value)}
              sx={{
                fontWeight: 600,
                px: 1.2,
                borderRadius: '8px',
                transition: 'all 0.2s',
                bgcolor: buildingFilter === b.value ? '#1a1a1a' : '#fff',
                color: buildingFilter === b.value ? '#fff' : '#666',
                border: '1px solid',
                borderColor: buildingFilter === b.value ? '#1a1a1a' : '#e0e0e0',
                fontSize: { xs: '12px', md: '14px' },
                '&:hover': {
                  bgcolor: buildingFilter === b.value ? '#333' : '#f5f5f5',
                  borderColor: buildingFilter === b.value ? '#333' : '#d0d0d0',
                }
              }}
              clickable
            />
          ))}
        </Box>

        {/* View Mode Toggle */}
        <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto', flexShrink: 0 }}>
          <Tooltip title="Grid View">
            <IconButton
              size="small"
              onClick={() => setViewMode('grid')}
              sx={{
                bgcolor: viewMode === 'grid' ? '#1a1a1a' : '#fff',
                color: viewMode === 'grid' ? '#fff' : '#666',
                border: '1px solid',
                borderColor: viewMode === 'grid' ? '#1a1a1a' : '#e0e0e0',
                '&:hover': {
                  bgcolor: viewMode === 'grid' ? '#333' : '#f5f5f5',
                }
              }}
            >
              <ViewWeek fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="List View">
            <IconButton
              size="small"
              onClick={() => setViewMode('list')}
              sx={{
                bgcolor: viewMode === 'list' ? '#1a1a1a' : '#fff',
                color: viewMode === 'list' ? '#fff' : '#666',
                border: '1px solid',
                borderColor: viewMode === 'list' ? '#1a1a1a' : '#e0e0e0',
                '&:hover': {
                  bgcolor: viewMode === 'list' ? '#333' : '#f5f5f5',
                }
              }}
            >
              <ViewAgenda fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Date Filter Chips */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          pb: 1,
          justifyContent: 'flex-start',
          '::-webkit-scrollbar': { display: 'none' }
        }}
      >
        {DATE_FILTERS.map((d) => (
          <Chip
            key={d.value}
            label={d.label}
            onClick={() => handleDateChange(d.value)}
            sx={{
              fontWeight: 600,
              px: 1.2,
              borderRadius: '8px',
              transition: 'all 0.2s',
              bgcolor: dateFilter === d.value ? '#1976d2' : '#fff',
              color: dateFilter === d.value ? '#fff' : '#666',
              border: '1px solid',
              borderColor: dateFilter === d.value ? '#1976d2' : '#e0e0e0',
              fontSize: { xs: '12px', md: '14px' },
              '&:hover': {
                bgcolor: dateFilter === d.value ? '#1565c0' : '#f5f5f5',
                borderColor: dateFilter === d.value ? '#1565c0' : '#d0d0d0',
              }
            }}
            clickable
          />
        ))}
      </Box>

      {/* Grid/List Layout */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="40vh">
          <CircularProgress size={60} thickness={4} sx={{ color: '#1a1a1a' }} />
        </Box>
      ) : (
        <Fade in={!loading}>
          <Box sx={{ width: '100%', direction: 'ltr' }}>
            <Box
              sx={{
                mb: 4,
                display: viewMode === 'grid' ? 'grid' : 'flex',
                flexDirection: viewMode === 'list' ? 'column' : undefined,
                gridTemplateColumns: viewMode === 'grid' ? {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)'
                } : undefined,
                gap: { xs: 1.5, sm: 2, md: 2.5 },
                width: '100%'
              }}
            >
              {events.length === 0 ? (
                <Box sx={{ gridColumn: viewMode === 'grid' ? '1 / -1' : undefined }}>
                  <Box textAlign="center" py={8}>
                    <Typography variant="h6" color="text.secondary">
                      No upcoming events {buildingFilter !== 'All' && `in ${buildingFilter}`}{searchQuery && ` matching "${searchQuery}"`}.
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                      Try checking a different filter or search term!
                    </Typography>
                  </Box>
                </Box>
              ) : (
                events.map((event) => (
                  <Box
                    key={event.id}
                    sx={{
                      width: viewMode === 'list' ? '100%' : undefined,
                      maxHeight: viewMode === 'list' ? '140px' : undefined,
                      direction: 'ltr'
                    }}
                  >
                    <EventCard
                      event={event}
                      onEventUpdated={handleRefreshEvents}
                      isListView={viewMode === 'list'}
                    />
                  </Box>
                ))
              )}
            </Box>

            {/* Pagination */}
            {events.length > 0 && totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={3} sx={{ direction: 'ltr' }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="medium"
                />
              </Box>
            )}
          </Box>
        </Fade>
      )}
    </Container>
  );
}