import { supabase } from "../supabaseClient";

/**
 * Event Service
 * Handles all event-related database operations
 */

export const eventService = {
  /* ================= DATE RANGE HELPER ================= */
  getDateRange(dateRange) {
    const now = new Date();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    switch (dateRange) {
      case "today":
        return {
          from: startOfToday,
          to: endOfToday,
        };

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
        const endOfMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );

        return { from: startOfMonth, to: endOfMonth };
      }

      default:
        return null; // "all"
    }
  },

  /* ================= FETCH EVENTS ================= */
  fetchEvents: async (
    filter = "All",
    dateRange = "all",
    searchQuery = "",
    page = 1,
    pageSize = 12
  ) => {
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("events")
      .select("*", { count: "exact" })
      .in("status", ["active", "under_review"])
      .order("event_date", { ascending: true })
      .range(offset, offset + pageSize - 1);

    // 🏢 Building filter
    if (filter !== "All") {
      query = query.eq("building", filter);
    }

    // 📅 Date filter (FIXED)
    const dateBounds = eventService.getDateRange(dateRange);
    if (dateBounds) {
      query = query
        .gte("event_date", dateBounds.from.toISOString())
        .lte("event_date", dateBounds.to.toISOString());
    }

    // 🔍 Search filter
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



  /* ================= CRUD (Create/Update Basic) ================= */
  createEvent: async (eventData) => {
    const { data, error } = await supabase
      .from("events")
      .insert([eventData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateEvent: async (eventId, updates) => {
    const { data, error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", eventId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /* ================= REPORT EVENT ================= */
  reportEvent: async (eventId, reason, message = null) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    if (error) throw error;
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

 

  getStoragePathFromUrl(url) {
    if (!url) return null;
    const parts = url.split("/event-images/");
    return parts[1] || null;
  },

  deleteEventImage: async (url) => {
    console.log("Deleting image at URL:", url);
    const path = eventService.getStoragePathFromUrl(url);
    if (!path) return;
console.log("Deleting image at path:", path);
    const { error,data } = await supabase.storage
      .from("event-images")
      .remove([path]);
console.log("Deleting image at error:", error,"+ data ",data);
    if (error) throw error;
  },

  /* ================= IMAGE UPLOAD ================= */
  uploadEventImage: async (userId, file) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("event-images")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("event-images").getPublicUrl(fileName);

    return publicUrl;
  },


  /* ================= UPDATE WITH IMAGE (FIXED) ================= */
  updateEventWithImage: async (
    eventId,
    updates,
    newImageFile,
    userId,
    oldImageUrl
  ) => {
    let imageUrl = oldImageUrl;

    if (newImageFile) {
      imageUrl = await eventService.uploadEventImage(userId, newImageFile);

      if (oldImageUrl) {
        try {
          await eventService.deleteEventImage(oldImageUrl);
        } catch (err) {
          console.warn("Old image delete failed:", err.message);
        }
      }
    }

    const { data, error } = await supabase
      .from("events")
      .update({ ...updates, image_url: imageUrl })
      .eq("id", eventId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /* ================= DELETE ================= */
  deleteEvent: async (eventId, imageUrl) => {
    if (imageUrl) {
      try {
        await eventService.deleteEventImage(imageUrl);
      } catch (err) {
        console.warn("Image delete failed:", err.message);
      }
    }

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) throw error;
  },
};