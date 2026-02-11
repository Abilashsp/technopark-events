/**
 * DateTime Helper Functions
 * Handles all datetime formatting, validation, and conversion
 */

// Get minimum datetime (now)
export const getMinDateTime = () => {
  const now = new Date();
  return now.toISOString().slice(0, 16);
};

// Get maximum datetime (2 weeks from now)
export const getMaxDateTime = () => {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 14);
  return maxDate.toISOString().slice(0, 16);
};

// Validate event time is within office hours (8 AM - 6 PM)
export const validateEventTime = (dateTime) => {
  if (!dateTime) return true;
  const date = new Date(dateTime);
  const hours = date.getHours();
  return hours >= 8 && hours < 18;
};

// Format ISO string to datetime-local input format (YYYY-MM-DDTHH:mm)
export const formatDateTimeForInput = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Convert datetime-local input to ISO string
export const convertToISO = (dateTimeLocal) => {
  if (!dateTimeLocal) return '';
  const date = new Date(dateTimeLocal);
  return date.toISOString();
};

// Format date for display (e.g., "JAN 24")
export const formatDateDisplay = (isoDate) => {
  const date = new Date(isoDate);
  const month = date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
  const day = date.getDate();
  return `${month} ${day}`;
};

// Format time for display (e.g., "14:30")
export const formatTimeDisplay = (isoDate) => {
  const date = new Date(isoDate);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Get date range for filtering based on filter type
export const getDateRange = (filterType) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (filterType) {
    case 'today':
      return {
        from: today.toISOString(),
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
      };
    case 'week': {
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + 7);
      return {
        from: today.toISOString(),
        to: weekEnd.toISOString()
      };
    }
    case 'month': {
      const monthEnd = new Date(today);
      monthEnd.setDate(today.getDate() + 30);
      return {
        from: today.toISOString(),
        to: monthEnd.toISOString()
      };
    }
    default:
      return null;
  }
};

export const formatEventDateTime = (isoString) => {
  if (!isoString) {
    return { date: "N/A", time: "N/A" };
  }

  const dateObj = new Date(isoString);

  const date = dateObj.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const time = dateObj.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return { date, time };
};
