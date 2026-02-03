import { useState, useEffect, useMemo } from "react";
import { authService } from "../services/authService";
import { eventService } from "../services/eventService";
import { validateEventTime } from "../utils/dateTimeHelpers";
import { BUILDINGS } from "../constants/buildings";

const formatToLocalISO = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const offsetMs = date.getTimezoneOffset() * 60000; 
  const localDate = new Date(date.getTime() - offsetMs);
  return localDate.toISOString().slice(0, 16); 
};

export const useEventForm = (open, eventToEdit, onSuccess, onClose) => {
  const isEditMode = Boolean(eventToEdit?.id);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  // Initial State
  const initialData = useMemo(() => ({
    title: "",
    description: "",
    building: BUILDINGS[0],
    date: "",
    image: null,
  }), []);

  const [formData, setFormData] = useState(initialData);

  // Initialize Form
  useEffect(() => {
    if (!open) return;
    
    if (isEditMode) {
      setFormData({
        title: eventToEdit.title || "",
        description: eventToEdit.description || "",
        building: eventToEdit.building || BUILDINGS[0],
        date: formatToLocalISO(eventToEdit.event_date),
        image: null,
      });
      setImagePreview(eventToEdit.image_url || null);
    } else {
      setFormData(initialData);
      setImagePreview(null);
    }
    setErrorMsg("");
    setLoading(false);
  }, [open, isEditMode, eventToEdit, initialData]);

  // --- HELPER: Date Validation Logic ---
  const checkDateValidity = (dateStr) => {
    if (!dateStr) return "Please select a date";
    
    const selectedDate = new Date(dateStr);
    const now = new Date();

    // 1. Check if date is in the past
    if (selectedDate < now) {
      return "Event time cannot be in the past";
    }

    // 2. Check 8 AM - 6 PM range
    if (!validateEventTime(dateStr)) {
      return "Event time must be between 8 AM and 6 PM";
    }

    return null; // No error
  };

  // --- Handlers ---

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    const error = checkDateValidity(date);
    
    if (error) setErrorMsg(error);
    else setErrorMsg(""); // Clear error if valid

    setFormData((prev) => ({ ...prev, date }));
  };

  const handleTemplateClick = (template) => {
    setFormData((prev) => ({ ...prev, description: template }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setErrorMsg("Image must be under 5MB");

    setFormData((prev) => ({ ...prev, image: file }));
    setErrorMsg("");
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (e) => {
    e?.stopPropagation();
    setFormData((prev) => ({ ...prev, image: null }));
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      // --- VALIDATION ---
      if (!formData.title.trim()) throw new Error("Please enter an event title");
      if (!formData.building) throw new Error("Please select a venue");
      
      // Strict Date Validation on Submit
      const dateError = checkDateValidity(formData.date);
      if (dateError) throw new Error(dateError);

      if (!isEditMode && !formData.image) throw new Error("Please upload a cover image");
      if (isEditMode && !formData.image && !imagePreview) throw new Error("Event must have an image");

      const user = await authService.getCurrentUser();
      if (!user) throw new Error("Login required");

      const payload = {
        title: formData.title,
        description: formData.description,
        building: formData.building,
        event_date: new Date(formData.date).toISOString(),
      };

      if (isEditMode) {
        await eventService.updateEventWithImage(
          eventToEdit.id,
          payload,
          formData.image,
          user.id,
          eventToEdit.image_url
        );
      } else {
        const imageUrl = await eventService.uploadEventImage(user.id, formData.image);
        await eventService.createEvent({
          ...payload,
          image_url: imageUrl,
          author_id: user.id,
          author_email: user.email,
        });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Dirty Check
  const isDirty = useMemo(() => {
    if (!open) return false;
    if (isEditMode) {
      return (
        formData.title !== eventToEdit.title ||
        formData.description !== eventToEdit.description ||
        formData.building !== eventToEdit.building ||
        // Loose comparison for date to avoid minor ISO diffs
        new Date(formData.date).getTime() !== new Date(formatToLocalISO(eventToEdit.event_date)).getTime() ||
        formData.image !== null
      );
    }
    return formData.title || formData.description || formData.date || formData.image;
  }, [formData, eventToEdit, isEditMode, open]);

  return {
    formData,
    loading,
    errorMsg,
    imagePreview,
    isEditMode,
    isDirty,
    handlers: {
      handleChange,
      handleDateChange,
      handleTemplateClick,
      handleImageChange,
      handleRemoveImage,
      handleSubmit,
    }
  };
};