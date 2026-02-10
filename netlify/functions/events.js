import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function handler(event) {
  try {
    const params = event.queryStringParameters || {};
    const {
      filter = "All",
      search = "",
      page = 1,
      pageSize = 12,
    } = params;

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

    if (search.trim()) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        events: data || [],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
