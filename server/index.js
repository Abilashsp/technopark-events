import dotenv from "dotenv";
dotenv.config(); // 👈 MUST be first line

import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());

// ✅ Correct way in Node.js
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("❌ Missing Supabase environment variables");
}

console.log("✅ Supabase URL loaded:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

app.get("/api/events", async (req, res) => {
  try {
    const {
      filter = "All",
      search = "",
      page = 1,
      pageSize = 12,
    } = req.query;

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

    res.json({
      events: data,
      total: count,
      totalPages: Math.ceil(count / pageSize),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`✅ Local API running on http://localhost:${PORT}`)
);
