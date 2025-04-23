import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/services/supabase'

/**
 * GET /api/properties
 * Search for properties based on location, type, and budget
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const location = searchParams.get('location') || ''
    const type = searchParams.get('type') || ''
    const budgetStr = searchParams.get('budget') || ''
    
    // Parse budget - handle ranges like "1000000-2000000" or single values
    let minBudget = 0
    let maxBudget = Number.MAX_SAFE_INTEGER
    
    if (budgetStr) {
      if (budgetStr.includes('-')) {
        const [min, max] = budgetStr.split('-')
        minBudget = parseInt(min.replace(/[^0-9]/g, '')) || 0
        maxBudget = parseInt(max.replace(/[^0-9]/g, '')) || Number.MAX_SAFE_INTEGER
      } else {
        // If single value, assume it's the max budget
        maxBudget = parseInt(budgetStr.replace(/[^0-9]/g, '')) || Number.MAX_SAFE_INTEGER
      }
    }
    
    console.log('Searching for properties with criteria:', {
      location,
      type,
      minBudget,
      maxBudget
    })
    
    // Build query
    let query = supabase
      .from('properties')
      .select('*')
    
    // Add filters
    if (location) {
      query = query.ilike('location', `%${location}%`)
    }
    
    if (type) {
      query = query.ilike('property_type', `%${type}%`)
    }
    
    // Add budget filter
    query = query.gte('price', minBudget).lte('price', maxBudget)
    
    // Execute query
    const { data: properties, error, count } = await query
    
    if (error) {
      console.error('Error searching properties:', error)
      return NextResponse.json(
        { error: 'Failed to search properties' },
        { status: 500 }
      )
    }
    
    // Check if properties table exists
    if (!properties) {
      // For demo purposes, return mock data if the table doesn't exist
      const mockProperties = generateMockProperties(location, type, minBudget, maxBudget)
      
      return NextResponse.json({
        properties: mockProperties,
        matching_properties: mockProperties.length,
        total: mockProperties.length
      })
    }
    
    return NextResponse.json({
      properties,
      matching_properties: properties.length,
      total: count || properties.length
    })
  } catch (error) {
    console.error('Error in properties API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * Generate mock properties for demo purposes
 */
function generateMockProperties(location: string, type: string, minBudget: number, maxBudget: number) {
  // Default locations in Dubai
  const locations = [
    'Downtown Dubai',
    'Palm Jumeirah',
    'Dubai Marina',
    'Jumeirah Beach Residence',
    'Business Bay',
    'Dubai Hills Estate',
    'Emirates Hills',
    'Jumeirah Golf Estates',
    'Arabian Ranches'
  ]
  
  // Default property types
  const propertyTypes = [
    'Apartment',
    'Villa',
    'Penthouse',
    'Townhouse',
    'Duplex'
  ]
  
  // Filter locations based on search term
  const filteredLocations = location 
    ? locations.filter(loc => loc.toLowerCase().includes(location.toLowerCase()))
    : locations
  
  // Filter property types based on search term
  const filteredTypes = type
    ? propertyTypes.filter(t => t.toLowerCase().includes(type.toLowerCase()))
    : propertyTypes
  
  // Generate 1-5 random properties
  const count = Math.floor(Math.random() * 5) + 1
  const properties = []
  
  for (let i = 0; i < count; i++) {
    const randomLocation = filteredLocations[Math.floor(Math.random() * filteredLocations.length)]
    const randomType = filteredTypes[Math.floor(Math.random() * filteredTypes.length)]
    
    // Generate random price within budget range
    const price = Math.floor(
      Math.random() * (maxBudget - minBudget) + minBudget
    )
    
    // Generate random bedrooms (1-5)
    const bedrooms = Math.floor(Math.random() * 5) + 1
    
    // Generate random bathrooms (1-5)
    const bathrooms = Math.floor(Math.random() * 5) + 1
    
    // Generate random size (800-5000 sq ft)
    const size = Math.floor(Math.random() * 4200) + 800
    
    properties.push({
      id: `prop-${Date.now()}-${i}`,
      property_type: randomType,
      location: randomLocation,
      price,
      bedrooms,
      bathrooms,
      size,
      description: `Beautiful ${bedrooms} bedroom ${randomType.toLowerCase()} in ${randomLocation} with amazing views.`,
      created_at: new Date().toISOString()
    })
  }
  
  return properties
}
