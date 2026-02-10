import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Container,
  Box,
  CircularProgress,
  Typography,
  Fade,
  Pagination,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { EventBusy } from "@mui/icons-material";
import { useSearchParams } from "react-router-dom";

import EventCard from "../components/EventCard";
import HeroSection from "../components/HeroSection";
import FilterBar from "../components/FilterBar";

import { PAGE_SIZE } from "../constants/dateFilters";
import { fetchEventsPublic } from "../api/eventsApi";
import { eventService } from "../services/eventService";
import { useRefresh } from "../contexts/RefreshContext";
import { useAuth } from "../contexts/AuthContext";

export default function Feed({ mode = "public" }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshKey, triggerRefresh } = useRefresh();
  const { user } = useAuth();

  const isMyEventsMode = mode === "my-events";

  const [reportedEventIds, setReportedEventIds] = useState(new Set());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const buildingFilter = searchParams.get("building") || "All";
  const dateFilter = searchParams.get("date") || "all";
  const searchQuery = searchParams.get("search") || "";
  const currentPage = Number(searchParams.get("page") || 1);

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localBuilding, setLocalBuilding] = useState(buildingFilter);
  const [localDate, setLocalDate] = useState(dateFilter);

  // Sync local filters with URL
  useEffect(() => {
    setLocalSearch(searchQuery);
    setLocalBuilding(buildingFilter);
    setLocalDate(dateFilter);
  }, [searchQuery, buildingFilter, dateFilter]);

  /* ======================================================
      CONSOLIDATED DATA FETCHING (Fixes 6x Fetch Spam)
  ====================================================== */
  useEffect(() => {
    let isMounted = true;

    const loadAllData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Events
        let result;
        if (isMyEventsMode) {
          if (!user?.id) return;
          result = await eventService.fetchMyEvents(currentPage, PAGE_SIZE, searchQuery);
        } else {
          result = await fetchEventsPublic({
            building: buildingFilter,
            date: dateFilter,
            search: searchQuery,
            page: currentPage,
            pageSize: PAGE_SIZE,
          });
        }

        // 2. Fetch Report Statuses (Batch)
        let idSet = new Set();
        if (user?.id) {
          const ids = await eventService.fetchUserReportedIds(user.id);
          idSet = new Set(ids);
        }

        if (isMounted) {
          setEvents(result?.events || []);
          setTotalPages(result?.totalPages || 1);
          setReportedEventIds(idSet);
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAllData();

    return () => { isMounted = false; };
  }, [
    user?.id, 
    refreshKey, 
    buildingFilter, 
    dateFilter, 
    searchQuery, 
    currentPage, 
    isMyEventsMode
  ]); // Single effect tracks all triggers

  /* ======================================================
      PREVENT REFRESH SPAM
  ====================================================== */
  const refreshLock = useRef(false);

  const handleRefreshEvents = useCallback(() => {
    if (refreshLock.current) return;
    refreshLock.current = true;
    triggerRefresh();
    setTimeout(() => { refreshLock.current = false; }, 500);
  }, [triggerRefresh]);

  /* ======================================================
      UI HANDLERS
  ====================================================== */
  const handleTriggerSearch = () => {
    const params = new URLSearchParams();
    params.set("building", localBuilding);
    params.set("date", localDate);
    if (localSearch.trim()) params.set("search", localSearch);
    params.set("page", "1");
    setSearchParams(params);
  };

  const handlePageChange = (_, value) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", value.toString());
    setSearchParams(params);
    window.scrollTo({ top: isMyEventsMode ? 0 : 450, behavior: "smooth" });
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8f9fa" }}>
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
        <Box sx={{ pt: 10, pb: 6, textAlign: "center", bgcolor: "white" }}>
          <Typography variant="h4" fontWeight={900}>My Events</Typography>
        </Box>
      )}

      <Container maxWidth="lg" sx={{ pb: 8 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" height="40vh">
            <CircularProgress />
          </Box>
        ) : (
          <Fade in>
            <Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2,1fr)",
                    md: "repeat(3,1fr)",
                    lg: "repeat(4,1fr)",
                  },
                  gap: 3,
                }}
              >
                {events.length === 0 ? (
                  <Box textAlign="center" py={10} gridColumn="1 / -1">
                    <EventBusy sx={{ fontSize: 60 }} />
                    <Typography>No events found</Typography>
                  </Box>
                ) : (
                  events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEventUpdated={handleRefreshEvents}
                      initialReported={reportedEventIds.has(event.id)}
                    />
                  ))
                )}
              </Box>

              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={6}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
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