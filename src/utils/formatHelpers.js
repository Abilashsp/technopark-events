/**
 * Format Helper Functions
 * Handles string formatting and display transformations
 */

// Truncate text to max length with ellipsis
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

// Get initials from name/email
export const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Format email to display name
export const formatEmailDisplay = (email, isAnonymous = false) => {
  if (isAnonymous) return 'Anonymous';
  const name = email.split('@')[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
};
