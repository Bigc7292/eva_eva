/**
 * Phone number utility functions
 */

/**
 * Normalize a phone number to a standard format with country code
 * @param {string} phoneNumber - The phone number to normalize
 * @returns {string} Normalized phone number
 */
function normalizePhoneNumber(phoneNumber) {
  if (!phoneNumber) return null;
  
  // Remove all non-digit characters except the leading +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // If it already starts with +, return as is
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // If it starts with 00, replace with +
  if (cleaned.startsWith('00')) {
    return '+' + cleaned.substring(2);
  }
  
  // If it's a UAE number starting with 0, add country code
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '+971' + cleaned.substring(1);
  }
  
  // If it's a UAE number without leading 0, add country code
  if (cleaned.length === 9) {
    return '+971' + cleaned;
  }
  
  // If it's a number without country code, assume UAE
  if (cleaned.length <= 10) {
    return '+971' + cleaned;
  }
  
  // If it's a number with country code but without +, add +
  return '+' + cleaned;
}

/**
 * Format a phone number for display
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} Formatted phone number for display
 */
function formatPhoneNumberForDisplay(phoneNumber) {
  if (!phoneNumber) return 'N/A';
  
  // Normalize the phone number first
  const normalized = normalizePhoneNumber(phoneNumber);
  
  // For UAE numbers
  if (normalized.startsWith('+971') && normalized.length === 13) {
    return `+971 ${normalized.substring(4, 6)} ${normalized.substring(6, 9)} ${normalized.substring(9)}`;
  }
  
  // For US numbers
  if (normalized.startsWith('+1') && normalized.length === 12) {
    return `+1 (${normalized.substring(2, 5)}) ${normalized.substring(5, 8)}-${normalized.substring(8)}`;
  }
  
  // For other numbers, just add spaces for readability
  return normalized.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d{3,4})/, '$1 $2 $3 $4');
}

/**
 * Check if two phone numbers are equivalent (normalized to the same format)
 * @param {string} phone1 - First phone number
 * @param {string} phone2 - Second phone number
 * @returns {boolean} True if the phone numbers are equivalent
 */
function arePhoneNumbersEquivalent(phone1, phone2) {
  if (!phone1 || !phone2) return false;
  
  const normalized1 = normalizePhoneNumber(phone1);
  const normalized2 = normalizePhoneNumber(phone2);
  
  return normalized1 === normalized2;
}

module.exports = {
  normalizePhoneNumber,
  formatPhoneNumberForDisplay,
  arePhoneNumbersEquivalent
};
