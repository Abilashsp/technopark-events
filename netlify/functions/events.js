import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase environment variables");
}

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
      date="all"
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

      const now = new Date();

      if (!date || date === "all") {
  // Upcoming events
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  query = query.gte("event_date", start.toISOString());
}

else if (date === "today") {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  query = query
    .gte("event_date", start.toISOString())
    .lte("event_date", end.toISOString());
}

else if (date === "this_week") {
  const start = new Date();
  const day = start.getDay(); // 0 (Sun) - 6 (Sat)

  // Set to Monday (adjust if you prefer Sunday start)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  query = query
    .gte("event_date", start.toISOString())
    .lte("event_date", end.toISOString());
}

else if (date === "this_month") {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  query = query
    .gte("event_date", start.toISOString())
    .lte("event_date", end.toISOString());
}

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
