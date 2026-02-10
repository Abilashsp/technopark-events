
const Api= "http://localhost:4000"

export async function fetchEventsPublic({
  building = "All",
  search = "",
  page = 1,
  pageSize = 12,
}) {
  const params = new URLSearchParams({
    filter: building,
    search,
    page,
    pageSize,
  });

  const res = await fetch(`${Api}/api/events?${params.toString()}`);

  if (!res.ok) {
    throw new Error("Failed to fetch events");
  }

  return res.json(); // ✅ JSON from Express
}
