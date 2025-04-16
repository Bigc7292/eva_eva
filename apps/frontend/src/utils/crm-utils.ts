/**
 * Utility functions for CRM-related operations
 */

/**
 * Formats a CRM ID with proper padding and prefix
 * @param id The raw CRM ID
 * @returns Formatted CRM ID string
 */
export function formatCrmId(id: string | number): string {
  if (!id) return 'N/A';
  
  const idStr = String(id);
  // Pad with zeros to ensure at least 6 digits
  const paddedId = idStr.padStart(6, '0');
  
  // Add CRM prefix
  return `TL-${paddedId}`;
}

/**
 * Formats a phone number to standard format
 * @param phone The raw phone number
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return 'N/A';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid US phone number
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // Return original if not matching expected format
  return phone;
}

/**
 * Calculates lead score based on various factors
 * @param lead The lead object
 * @returns Score from 0-100
 */
export function calculateLeadScore(lead: any): number {
  if (!lead) return 0;
  
  let score = 0;
  
  // Basic information completeness
  if (lead.name) score += 10;
  if (lead.email) score += 10;
  if (lead.phone) score += 10;
  if (lead.address) score += 5;
  
  // Engagement factors
  if (lead.lastContactDate) {
    // Higher score for recent contact
    const daysSinceContact = Math.floor((Date.now() - new Date(lead.lastContactDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceContact < 7) score += 20;
    else if (daysSinceContact < 30) score += 10;
    else score += 5;
  }
  
  // Interaction history
  if (lead.callCount) score += Math.min(lead.callCount * 5, 15);
  if (lead.emailCount) score += Math.min(lead.emailCount * 3, 15);
  
  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Returns a color based on lead score
 * @param score The lead score (0-100)
 * @returns CSS color class
 */
export function getLeadScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-blue-500';
  if (score >= 40) return 'text-yellow-500';
  if (score >= 20) return 'text-orange-500';
  return 'text-red-500';
}
