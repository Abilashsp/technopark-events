/**
 * Custom Hook: useEventForm
 * Manages event form state and validation
 */

import { useState } from 'react';
import { validateEventTime } from '../utils/dateTimeHelpers';

export const useEventForm = (initialState = {}) => {
  const [formData, setFormData] = useState(initialState);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    if (!validateEventTime(newDate)) {
      setErrorMsg('Event time must be between 8 AM and 6 PM');
      return;
    }
    setErrorMsg('');
    setFormData(prev => ({ ...prev, date: newDate }));
  };

  const validateForm = () => {
    if (!formData.title?.trim()) {
      setErrorMsg('Please enter event title');
      return false;
    }
    if (!formData.building?.trim()) {
      setErrorMsg('Please select a building');
      return false;
    }
    if (!formData.date) {
      setErrorMsg('Please select event date and time');
      return false;
    }
    if (!validateEventTime(formData.date)) {
      setErrorMsg('Event time must be between 8 AM and 6 PM');
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setFormData(initialState);
    setErrorMsg('');
  };

  return {
    formData,
    setFormData,
    errorMsg,
    setErrorMsg,
    handleChange,
    handleDateChange,
    validateForm,
    resetForm
  };
};
