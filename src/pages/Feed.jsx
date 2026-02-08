import React, { useEffect, useState, useCallback } from 'react';
import {
  Container,
  Box,
  CircularProgress,
  Typography,
  Fade,
  Button,
  Pagination,
  IconButton,
  Tooltip,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ViewAgenda,
  ViewWeek,
  EventBusy,
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';

import EventCard from '../components/EventCard';
import { eventService } from '../services/eventService';
import { PAGE_SIZE } from '../constants/dateFilters';

import HeroSection from '../components/HeroSection';
import FilterBar from '../components/FilterBar';
import { useRefresh } from '../contexts/RefreshContext';

/**
 * Feed Component
 * @param {string} mode - 'public' for discovery or 'my-events' for management
 */
export default function Feed({ mode = 'public' }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshKey, triggerRefresh } = useRefresh();

  const isMyEventsMode = mode === 'my-events';

  // --- STATE ---
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState('grid');

  // URL params logic preserved
  const buildingFilter = searchParams.get('building') || 'All';
  const dateFilter = searchParams.get('date') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Local state for inputs (used in FilterBar)
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localBuilding, setLocalBuilding] = useState(buildingFilter);
  const [localDate, setLocalDate] = useState(dateFilter);

  // Synchronize local state if URL changes (e.g., browser back button)
  useEffect(() => {
    setLocalSearch(searchQuery);
    setLocalBuilding(buildingFilter);
    setLocalDate(dateFilter);
  }, [searchQuery, buildingFilter, dateFilter]);

  /* ---------------- FETCH LOGIC ---------------- */
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      let result;
      if (isMyEventsMode) {
        // Management View: Only user events, ignore building/date filters
        result = await eventService.fetchMyEvents(
          currentPage,
          PAGE_SIZE,
          searchQuery
        );
      } else {
        // Discovery View: All active events with filters
        result = await eventService.fetchEvents(
          buildingFilter,
          dateFilter === 'all' ? null : dateFilter,
          searchQuery,
          currentPage,
          PAGE_SIZE
        );
      }
      setEvents(result.events || []);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch events", error);
    } finally {
      setLoading(false);
    }
  }, [buildingFilter, dateFilter, searchQuery, currentPage, refreshKey, isMyEventsMode]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  /* ---------------- HANDLERS ---------------- */
  const handleTriggerSearch = () => {
    const params = new URLSearchParams(searchParams);
    params.set('building', localBuilding);
    params.set('date', localDate);
    if (localSearch.trim()) params.set('search', localSearch);
    else params.delete('search');
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (_, value) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', value.toString());
    setSearchParams(params);
    // Scroll to top of content area
    window.scrollTo({ top: isMyEventsMode ? 0 : 450, behavior: 'smooth' });
  };

  const handleRefreshEvents = useCallback(() => {
    triggerRefresh(); 
  }, [triggerRefresh]);

  /* ---------------- UI ---------------- */
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>

      {/* ================= CONDITIONAL HEADER ================= */}
      {!isMyEventsMode ? (
        <HeroSection isMobile={isMobile}>
          <FilterBar
            isMobile={isMobile}
            localSearch={localSearch}
            setLocalSearch={setLocalSearch}
            handleTriggerSearch={handleTriggerSearch}
            localBuilding={localBuilding}
            setLocalBuilding={setLocalBuilding}
            localDate={localDate}
            setLocalDate={setLocalDate}
          />
        </HeroSection>
      ) : (
        <Box sx={{ 
          pt: { xs: 10, sm: 12 }, 
          pb: 6, 
          textAlign: 'center', 
          bgcolor: 'white', 
          borderBottom: '1px solid #eef2f6' 
        }}>
          <Typography variant="h4" fontWeight={900} color="primary">My Events</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Manage and track the events you have posted
          </Typography>
        </Box>
      )}

      <Container maxWidth="lg" sx={{ pb: 8, mt: isMyEventsMode ? 4 : 0 }}>

        {/* VIEW TOGGLE */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Stack direction="row" spacing={1} sx={{ bgcolor: '#fff', p: 0.5, borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <Tooltip title="Grid View">
              <IconButton
                onClick={() => setViewMode('grid')}
                size="small"
                sx={{
                  bgcolor: viewMode === 'grid' ? '#ebf2fa' : 'transparent',
                  color: viewMode === 'grid' ? 'primary.main' : 'text.secondary',
                  borderRadius: 1.5
                }}
              >
                <ViewWeek fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="List View">
              <IconButton
                onClick={() => setViewMode('list')}
                size="small"
                sx={{
                  bgcolor: viewMode === 'list' ? '#ebf2fa' : 'transparent',
                  color: viewMode === 'list' ? 'primary.main' : 'text.secondary',
                  borderRadius: 1.5
                }}
              >
                <ViewAgenda fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* DATA LOAD */}
        {loading ? (
          <Box display="flex" justifyContent="center" height="40vh" alignItems="center">
            <CircularProgress size={50} thickness={4} />
          </Box>
        ) : (
          <Fade in>
            <Box>
              <Box
                sx={{
                  display: viewMode === 'grid' ? 'grid' : 'flex',
                  flexDirection: viewMode === 'list' ? 'column' : undefined,
                  gridTemplateColumns: viewMode === 'grid'
                    ? { xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(3,1fr)', lg: 'repeat(4,1fr)' }
                    : undefined,
                  gap: 3
                }}
              >
                {events.length === 0 ? (
                  <Box textAlign="center" py={10} gridColumn="1 / -1">
                    <EventBusy sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      {isMyEventsMode 
                        ? "You haven't posted any events yet." 
                        : "No events found matching your criteria."}
                    </Typography>
                    {!isMyEventsMode && (
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setLocalSearch('');
                          setLocalBuilding('All');
                          setLocalDate('all');
                          setSearchParams({}); // Clear URL
                        }}
                        sx={{ mt: 2 }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </Box>
                ) : (
                  events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      isListView={viewMode === 'list'}
                      onEventUpdated={handleRefreshEvents}
                    />
                  ))
                )}
              </Box>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={8}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size={isMobile ? "medium" : "large"}
                    shape="rounded"
                  />
                </Box>
              )}
            </Box>
          </Fade>
        )}
      </Container>
    </Box>
  );
}