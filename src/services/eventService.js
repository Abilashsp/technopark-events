import { supabase } from "../supabaseClient";

/**
 * Event Service
 * Handles all event-related database operations
 */

export const eventService = {
  /* ================= FETCH EVENTS ================= */
  fetchEvents: async (
    filter = "All",
    dateRange = null,
    searchQuery = "",
    page = 1,
    pageSize = 12
  ) => {
    const offset = (page - 1) * pageSize;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    let query = supabase
      .from("events")
      .select("*", { count: "exact" })
      .in("status", ["active", "under_review"])
      .gte("event_date", startOfToday.toISOString())
      .order("event_date", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (filter !== "All") query = query.eq("building", filter);

    if (searchQuery.trim()) {
      query = query.or(
        `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
      );
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      events: data || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },

  /* ================= CRUD ================= */

  uploadEventImage: async (userId, file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('event-images')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  createEvent: async (eventData) => {
    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateEvent: async (eventId, updates) => {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteEvent: async (eventId) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
    return true;
  },

  /* ================= REPORT EVENT ================= */
  reportEvent: async (eventId, reason, message = null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase.rpc("report_event", {
      event_id_input: eventId,
      reason_input: reason,
      message_input: message,
    });

    if (error) {
      if (error.code === "23505") {
        throw new Error("You already reported this event.");
      }
      throw error;
    }
  },



  hasReported: async (eventId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from("event_reports")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle();

    return !!data;
  },

  /* ================= ADMIN ================= */

  getReportedEvents: async () => {
    const { data, error } = await supabase
      .from("events")
      .select(`
      id,
      title,
      description,
      image_url,
      building,
      event_date,
      report_count,
      event_reports (
        id,
        reason,
        message,
        created_at,
        user_id
      )
    `)
      .eq("status", "under_review")
      .order("report_count", { ascending: false });

    if (error) {
      console.error("Fetch reported events error:", error);
      throw error;
    }

    return data;
  },

  approveEvent: async (eventId) => {
    const { error } = await supabase
      .from("events")
      .update({ status: "active", report_count: 0 })
      .eq("id", eventId);

    if (error) throw error;
  },

  rejectEvent: async (eventId) => {
    const { error } = await supabase
      .from("events")
      .update({ status: "rejected" })
      .eq("id", eventId);

    if (error) throw error;
  },
};
