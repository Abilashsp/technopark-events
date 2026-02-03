import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { eventService } from "../services/eventService";
import { formatDateDisplay } from "../utils/dateTimeHelpers";

export const useEventCard = (event, onEventUpdated) => {
  const { user: currentUser, loading: authLoading } = useAuth();

  // Permissions
  const isOwner = currentUser?.id === event.author_id;
  const isUnderReview = event.status === "under_review";

  // State
  const [reported, setReported] = useState(false);
  const [loading, setLoading] = useState({ actions: true, delete: false });

  // Dialog States
  const [dialogs, setDialogs] = useState({
    report: false,
    login: false,
    delete: false,
    edit: false,
  });

  // Feedback State
  const [feedback, setFeedback] = useState({
    open: false,
    msg: "",
    severity: "success",
  });

  // Check Report Status
  useEffect(() => {
    let mounted = true;
    if (authLoading || !currentUser || isOwner) {
      setLoading((prev) => ({ ...prev, actions: false }));
      return;
    }

    const check = async () => {
      try {
        const hasReported = await eventService.hasReported(event.id);
        if (mounted) setReported(hasReported);
      } catch {
        // fail silently
      } finally {
        if (mounted) setLoading((prev) => ({ ...prev, actions: false }));
      }
    };
    check();
    return () => { mounted = false; };
  }, [currentUser, isOwner, event.id, authLoading]);

  // Helpers
  const toggleDialog = (name, open) => {
    setDialogs((prev) => ({ ...prev, [name]: open }));
  };

  const showFeedback = (msg, severity = "success") => {
    setFeedback({ open: true, msg, severity });
  };

  // Actions
  const handleShare = async (e) => {
    e.stopPropagation();
    const text = `📅 ${event.title}\n📍 ${event.building}\n⏰ ${formatDateDisplay(event.event_date)}\n\n${event.description}`;

    if (navigator.share) {
      await navigator.share({ title: event.title, text });
    } else {
      await navigator.clipboard.writeText(text);
      showFeedback("Copied to clipboard");
    }
  };

  const handleDelete = async () => {
    setLoading((prev) => ({ ...prev, delete: true }));
    try {
      await eventService.deleteEvent(event.id, event.image_url);
      showFeedback("Event deleted");
      toggleDialog("delete", false);
      onEventUpdated?.();
    } catch {
      showFeedback("Delete failed", "error");
    } finally {
      setLoading((prev) => ({ ...prev, delete: false }));
    }
  };

  const handleReport = async (reason, message) => {
    try {
      await eventService.reportEvent(event.id, reason, message);
      setReported(true);
      showFeedback("Event reported");
      toggleDialog("report", false);
    } catch {
      showFeedback("Report failed", "error");
    }
  };

  const handleEditSuccess = () => {
    showFeedback("Event updated");
    toggleDialog("edit", false);
    onEventUpdated?.();
  };

  const triggerAction = (actionType) => (e) => {
    e?.stopPropagation();

    if (actionType === "report" && !currentUser) {
      return toggleDialog("login", true);
    }

    toggleDialog(actionType, true);
  };

  return {
    currentUser,
    isOwner,
    isUnderReview,
    reported,
    loading,
    dialogs,
    feedback,
    setFeedback,
    toggleDialog,
    actions: {
      share: handleShare,
      delete: handleDelete,
      report: handleReport,
      editSuccess: handleEditSuccess,
      openEdit: triggerAction("edit"),
      openDelete: triggerAction("delete"),
      openReport: triggerAction("report"),
    }
  };
};