import { format } from "date-fns"

export const formatDate = (dateStr: string | Date) => {
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return format(date, 'MM/dd/yyyy, hh:mm:ss a');
  } catch (error) {
    return dateStr;
  }
};

// Format for date only
export const formatDateOnly = (dateStr: string | Date) => {
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return format(date, 'MM/dd/yyyy');
  } catch (error) {
    return dateStr;
  }
};

// Format for time only
export const formatTimeOnly = (dateStr: string | Date) => {
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return format(date, 'hh:mm:ss a');
  } catch (error) {
    return dateStr;
  }
};

// Format for calendar display
export const formatCalendarDate = (dateStr: string | Date) => {
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return format(date, 'MMMM d, yyyy');
  } catch (error) {
    return dateStr;
  }
};

// Format for time display in calendar
export const formatCalendarTime = (dateStr: string | Date) => {
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return format(date, 'h:mm a');
  } catch (error) {
    return dateStr;
  }
};