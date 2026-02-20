
const Api="http://localhost:4000"

export async function fetchEventsPublic({
  building = "All",
  search = "",
  page = 1,
  pageSize = 12,
  date="all"
}) {
  const params = new URLSearchParams({
    filter: building,
    search,
    page,
    pageSize,
    date
  });
  const res = await fetch(`/api/events?${params.toString()}`);

  if (!res.ok) {
    throw new Error("Failed to fetch events");
  }

  return res.json(); // ✅ JSON from Express
}
