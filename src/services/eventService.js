import { supabase } from "../supabaseClient";

/**
 * Event Service
 * Logic for events with built-in memory caching for report statuses
 */

const reportCache = new Map();

export const eventService = {
  /* ================= HELPERS ================= */
  getDateRange(dateRange) {
    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    switch (dateRange) {
      case "today": return { from: startOfToday, to: endOfToday };
      case "week": {
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return { from: startOfWeek, to: endOfWeek };
      }
      case "month": {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { from: startOfMonth, to: endOfMonth };
      }
      default: return null;
    }
  },

  /* ================= FETCHING ================= */
  fetchEvents: async (filter = "All", dateRange = "all", searchQuery = "", page = 1, pageSize = 12) => {
    const offset = (page - 1) * pageSize;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let query = supabase
      .from("events")
      .select("*", { count: "exact" })
      .in("status", ["active", "under_review"])
      .gte("event_date", today.toISOString())
      .order("event_date", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (filter !== "All") query = query.eq("building", filter);

    const dateBounds = eventService.getDateRange(dateRange);
    if (dateBounds) {
      query = query.gte("event_date", dateBounds.from.toISOString()).lte("event_date", dateBounds.to.toISOString());
    }

    if (searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data, count, error } = await query;
    if (error) throw error;
    return { events: data || [], total: count || 0, totalPages: Math.ceil((count || 0) / pageSize) };
  },

  fetchMyEvents: async (page = 1, pageSize = 12, searchQuery = "") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const offset = (page - 1) * pageSize;
    let query = supabase.from("events").select("*", { count: "exact" }).eq("author_id", user.id).order("created_at", { ascending: false }).range(offset, offset + pageSize - 1);

    if (searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data, count, error } = await query;
    if (error) throw error;
    return { events: data || [], total: count || 0, totalPages: Math.ceil((count || 0) / pageSize) };
  },

  /* ================= REPORTING (CACHED) ================= */
  async reportEvent({ userId, eventId, reason, message }) {
    if (!userId) throw new Error("Authentication required");

    const { error } = await supabase
      .from("event_reports")
      .insert([{ user_id: userId, event_id: eventId, reason, message }]);

    if (error) throw error;
    
    // Update local cache immediately
    reportCache.set(`${userId}-${eventId}`, true);
  },

  async fetchUserReportedIds(userId) {
    if (!userId) return new Set();
    
    const { data, error } = await supabase
      .from("event_reports")
      .select("event_id")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching report batch:", error);
      return new Set();
    }
    
    // Return a Set for O(1) lookup speed
    return new Set(data.map(item => item.event_id));
  },
async hasReported(eventId, userId) {
    if (!userId || !eventId) return false;
    
    const cacheKey = `${userId}-${eventId}`;
    
    // If we already know the answer, return it immediately without fetching
    if (reportCache.has(cacheKey)) {
      return reportCache.get(cacheKey);
    }

    const { data } = await supabase
      .from("event_reports")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    const exists = !!data;
    reportCache.set(cacheKey, exists); // Save to cache
    return exists;
  },

  /* ================= CRUD & STORAGE ================= */
  createEvent: async (eventData) => {
    const { data, error } = await supabase.from("events").insert([eventData]).select().single();
    if (error) throw error;
    return data;
  },

  updateEvent: async (eventId, updates) => {
    const { data, error } = await supabase.from("events").update(updates).eq("id", eventId).select().single();
    if (error) throw error;
    return data;
  },

  getReportedEvents: async () => {
    const { data, error } = await supabase
      .from("events")
      .select(`id, title, description, image_url, building, event_date, report_count, event_reports (*)`)
      .eq("status", "under_review")
      .order("report_count", { ascending: false });
    if (error) throw error;
    return data;
  },

  approveEvent: async (eventId) => {
    const { error } = await supabase.from("events").update({ status: "active", report_count: 0 }).eq("id", eventId);
    if (error) throw error;
  },

  rejectEvent: async (eventId) => {
    const { error } = await supabase.from("events").update({ status: "rejected" }).eq("id", eventId);
    if (error) throw error;
  },

  getStoragePathFromUrl(url) {
    if (!url) return null;
    const parts = url.split("/event-images/");
    return parts[1] || null;
  },

  deleteEventImage: async (url) => {
    const path = eventService.getStoragePathFromUrl(url);
    if (!path) return;
    await supabase.storage.from("event-images").remove([path]);
  },

  uploadEventImage: async (userId, file) => {
    const fileName = `${userId}/${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("event-images").upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from("event-images").getPublicUrl(fileName);
    return publicUrl;
  },

  updateEventWithImage: async (eventId, updates, newImageFile, userId, oldImageUrl) => {
    let imageUrl = oldImageUrl;
    if (newImageFile) {
      imageUrl = await eventService.uploadEventImage(userId, newImageFile);
      if (oldImageUrl) await eventService.deleteEventImage(oldImageUrl).catch(() => {});
    }
    return eventService.updateEvent(eventId, { ...updates, image_url: imageUrl });
  },

  deleteEvent: async (eventId, imageUrl) => {
    if (imageUrl) await eventService.deleteEventImage(imageUrl).catch(() => {});
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) throw error;
  },
};