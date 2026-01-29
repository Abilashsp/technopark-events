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
  Paper,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ViewAgenda,
  ViewWeek,
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';

import EventCard from '../components/EventCard';
import { eventService } from '../services/eventService';
import { PAGE_SIZE } from '../constants/dateFilters';

import HeroSection from '../components/HeroSection';
import FilterBar from '../components/FilterBar';


export default function Feed() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();

  // --- STATE ---
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState('grid');

  console.log(events)

  // Local state for inputs
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');
  const [localBuilding, setLocalBuilding] = useState(searchParams.get('building') || 'All');
  const [localDate, setLocalDate] = useState(searchParams.get('date') || 'all');

  // URL params
  const buildingFilter = searchParams.get('building') || 'All';
  const dateFilter = searchParams.get('date') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  /* ---------------- FETCH EVENTS ---------------- */
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await eventService.fetchEvents(
        buildingFilter,
        dateFilter === 'all' ? null : dateFilter,
        searchQuery,
        currentPage,
        PAGE_SIZE
      );
      setEvents(result.events || []);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch events", error);
    } finally {
      setLoading(false);
    }
  }, [buildingFilter, dateFilter, searchQuery, currentPage]);

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
    window.scrollTo({ top: 450, behavior: 'smooth' });
  };

  const handleRefreshEvents = useCallback(() => {
    fetchEvents();
  }, [fetchEvents]);

  /* ---------------- UI ---------------- */
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa', mt: 0, pt: 0 }}>

      {/* ================= HERO SECTION ================= */}
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

      {/* ================= MAIN CONTENT GRID ================= */}
      <Container maxWidth="lg" sx={{ pb: 8 }}>

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

        {/* LOADING STATE */}
        {loading ? (
          <Box display="flex" justifyContent="center" height="40vh" alignItems="center">
            <CircularProgress size={50} thickness={4} />
          </Box>
        ) : (
          <Fade in>
            <Box>
              {/* CARDS GRID */}
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
                  <Box textAlign="center" py={8} gridColumn="1 / -1">
                    <Typography variant="h6" color="text.secondary">
                      No events found matching your criteria.
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setLocalSearch('');
                        setLocalBuilding('All');
                        setLocalDate('all');
                        handleTriggerSearch();
                      }}
                      sx={{ mt: 2 }}
                    >
                      Clear Filters
                    </Button>
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
                    showFirstButton
                    showLastButton
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