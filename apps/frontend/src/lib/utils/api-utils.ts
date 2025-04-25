/**
 * API utility functions
 */

import { normalizePhoneNumber } from './phone-utils';

/**
 * Normalize phone numbers in API responses
 * @param data - The data to normalize
 * @returns The normalized data
 */
export function normalizePhoneNumbersInData<T extends Record<string, any>>(data: T): T {
  if (!data) return data;
  
  // Create a copy of the data
  const normalizedData = { ...data };
  
  // Normalize phone numbers
  if ('phone_number' in normalizedData && typeof normalizedData.phone_number === 'string') {
    const normalized = normalizePhoneNumber(normalizedData.phone_number);
    if (normalized) {
      normalizedData.phone_number = normalized;
    }
  }
  
  if ('leadPhone' in normalizedData && typeof normalizedData.leadPhone === 'string') {
    const normalized = normalizePhoneNumber(normalizedData.leadPhone);
    if (normalized) {
      normalizedData.leadPhone = normalized;
    }
  }
  
  if ('phone' in normalizedData && typeof normalizedData.phone === 'string') {
    const normalized = normalizePhoneNumber(normalizedData.phone);
    if (normalized) {
      normalizedData.phone = normalized;
    }
  }
  
  return normalizedData;
}

/**
 * Normalize phone numbers in an array of data
 * @param dataArray - The array of data to normalize
 * @returns The normalized array
 */
export function normalizePhoneNumbersInArray<T extends Record<string, any>>(dataArray: T[]): T[] {
  if (!dataArray || !Array.isArray(dataArray)) return dataArray;
  
  return dataArray.map(item => normalizePhoneNumbersInData(item));
}
