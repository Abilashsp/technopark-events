import { useState, useEffect, useMemo } from "react";
import { authService } from "../services/authService";
import { eventService } from "../services/eventService";
import { validateEventTime } from "../utils/dateTimeHelpers";
import { BUILDINGS } from "../constants/buildings";

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
        date: eventToEdit.event_date ? new Date(eventToEdit.event_date).toISOString().slice(0, 16) : "",
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

  // --- Handlers ---

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    if (!validateEventTime(date)) setErrorMsg("Event time must be between 8 AM and 6 PM");
    else setErrorMsg("");
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

      // Validation
      if (!formData.title.trim()) throw new Error("Please enter an event title");
      if (!formData.building) throw new Error("Please select a venue");
      if (!formData.date) throw new Error("Please select a date");
      if (!validateEventTime(formData.date)) throw new Error("Time must be 8 AM – 6 PM");
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