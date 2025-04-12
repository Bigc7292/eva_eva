// Function to generate a unique CRM ID
export function generateCrmId(type: 'IN' | 'OUT' | 'CB' | 'NI' | 'NA'): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `CRM-${type}-${year}-${random}`
}

// Function to validate CRM ID format
export function isValidCrmId(crmId: string): boolean {
  const pattern = /^CRM-(IN|OUT|CB|NI|NA)-\d{4}-\d{4}$/
  return pattern.test(crmId)
}

// Function to get the type from CRM ID
export function getCrmType(crmId: string): string {
  const types = {
    'IN': 'Inbound',
    'OUT': 'Outbound',
    'CB': 'Callback',
    'NI': 'Not Interested',
    'NA': 'No Answer'
  }
  const match = crmId.match(/^CRM-(IN|OUT|CB|NI|NA)-\d{4}-\d{4}$/)
  return match ? types[match[1]] : 'Unknown'
}

// Function to format CRM ID for display
export function formatCrmId(crmId: string): string {
  return crmId.replace(/^(CRM-[A-Z]{2,3})-(\d{4})-(\d{4})$/, '$1-$2-$3')
} 