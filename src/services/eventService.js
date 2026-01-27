import { supabase } from "../supabaseClient";

/**
 * Event Service
 * Handles all event-related database operations
 * When migrating to AWS DynamoDB, only change code here
 */

export const eventService = {
  /**
   * Fetch all active events with optional building, date range, search filters and pagination
   */
 fetchEvents: async (
  filter = "All",
  dateRange = null,
  searchQuery = "",
  page = 1,
  pageSize = 12
) => {
  try {
    const now = new Date().toISOString();
    const offset = (page - 1) * pageSize;

    // Get start of today to exclude past dates
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayStart = startOfToday.toISOString();

    // normalize filter (IMPORTANT)
    const normalizedFilter = filter?.trim().toLowerCase();

    let query = supabase
      .from("events")
      .select("*", { count: "exact" })
      .eq("status", "active")
      .gte("event_date", todayStart) // Exclude past dates (before today)
      .order("event_date", { ascending: true });

    /* ---------- BUILDING FILTER ---------- */
    if (normalizedFilter !== "all") {
      query = query.eq("building", filter);
    }

    /* ---------- SEARCH FILTER ---------- */
    if (searchQuery.trim()) {
      query = query.or(
        `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
      );
    }

    /* ---------- DATE RANGE FILTER ---------- */
if (dateRange === "today") {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  query = query
    .lte("event_date", endOfToday.toISOString());
}

    else if (dateRange === "week") {
      const weekAhead = new Date();
      weekAhead.setDate(weekAhead.getDate() + 7);

      query = query
        .lte("event_date", weekAhead.toISOString());

    } else if (dateRange === "month") {
      const monthAhead = new Date();
      monthAhead.setDate(monthAhead.getDate() + 30);

      query = query
        .lte("event_date", monthAhead.toISOString());
    }

    /* ---------- PAGINATION ---------- */
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching events:", error);
      return {
        events: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }

    return {
      events: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  } catch (error) {
    console.error("Fetch events error:", error);
    return {
      events: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }
},


  /**
   * Create a new event
   */
  createEvent: async (eventData) => {
    try {
      const {
        title,
        description,
        building,
        event_date,
        image_url,
        author_id,
        author_email,
        is_anonymous,
      } = eventData;

      const { data, error } = await supabase
        .from("events")
        .insert([
          {
            title,
            description,
            building,
            event_date,
            image_url,
            author_id,
            author_email,
            is_anonymous,
          },
        ])
        .select();

      if (error) {
        console.error("Error creating event:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Create event error:", error);
      throw error;
    }
  },

  /**
   * Update an existing event
   */
  updateEvent: async (eventId, updateData) => {
    try {
      const { title, description, building, event_date } = updateData;

      console.log("Updating event with ID:", eventId);
      console.log("Update payload:", {
        title,
        description,
        building,
        event_date,
      });

      const { data, error, status } = await supabase
        .from("events")
        .update({
          title,
          description,
          building,
          event_date,
        })
        .eq("id", eventId)
        .select();

      console.log(
        "Update response - Status:",
        status,
        "Data:",
        data,
        "Error:",
        error
      );

      if (error) {
        console.error("Supabase Update error:", error);
        throw new Error(`Update failed: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error(
          "Update returned no data. You may not have permission to edit this event."
        );
      }

      return data;
    } catch (error) {
      console.error("Update event error:", error);
      throw error;
    }
  },

  /**
   * Delete an event
   */
  deleteEvent: async (eventId) => {
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId)
        .select();

      if (error) {
        console.error("Error deleting event:", error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error("Delete event error:", error);
      throw error;
    }
  },

  /**
   * Report an event
   */

  reportEvent: async (eventId) => {
    const { error } = await supabase.rpc("report_event", {
      event_id_input: eventId,
    });

    if (error) {
      if (error.code === "23505") {
        throw new Error("You have already reported this event.");
      }
      throw error;
    }
  },

  hasReported: async (eventId) => {
    const { data, error } = await supabase.rpc("has_reported_event", {
      event_id_input: eventId,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Upload event image to storage
   */
  uploadEventImage: async (userId, file) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("event-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("event-images").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Upload image error:", error);
      throw error;
    }
  },
};
