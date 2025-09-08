'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { phoneProfilesService, PhoneNumberProfile } from '@/services/phone-profiles'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Phone, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  TrendingUp, 
  TrendingDown,
  MessageSquare,
  Filter,
  MoreHorizontal,
  PhoneCall,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format, formatDistanceToNow } from 'date-fns'

export default function PhoneProfilesPage() {
  const [profiles, setProfiles] = useState<PhoneNumberProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState('all')
  const [todaysCallbacks, setTodaysCallbacks] = useState<PhoneNumberProfile[]>([])
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load all profiles
      const { profiles: allProfiles } = await phoneProfilesService.getPhoneProfiles(1, 100)
      setProfiles(allProfiles)

      // Load today's callbacks
      const callbacks = await phoneProfilesService.getTodaysCallbacks()
      setTodaysCallbacks(callbacks)
    } catch (error) {
      console.error('Error loading phone profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      loadData()
      return
    }

    try {
      setLoading(true)
      const searchResults = await phoneProfilesService.searchPhoneProfiles(query)
      setProfiles(searchResults)
    } catch (error) {
      console.error('Error searching profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterProfilesByTab = (profiles: PhoneNumberProfile[]) => {
    switch (selectedTab) {
      case 'high-interest':
        return profiles.filter(p => p.interest_level === 'high')
      case 'callbacks':
        return profiles.filter(p => p.callback_scheduled)
      case 'recent':
        return profiles.filter(p => {
          if (!p.last_call_date) return false
          const lastCall = new Date(p.last_call_date)
          const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          return lastCall > threeDaysAgo
        })
      default:
        return profiles
    }
  }

  const getInterestLevelColor = (level?: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAnswerRate = (profile: PhoneNumberProfile) => {
    if (profile.total_calls === 0) return 0
    return Math.round((profile.answered_calls / profile.total_calls) * 100)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const filteredProfiles = filterProfilesByTab(profiles)

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="mt-2">Loading phone profiles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Phone Number Profiles</h2>
        <Button onClick={() => router.push('/phone-profiles/analytics')}>
          <TrendingUp className="mr-2 h-4 w-4" />
          View Analytics
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles.length}</div>
            <p className="text-xs text-muted-foreground">
              Active phone numbers tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Interest</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profiles.filter(p => p.interest_level === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Highly interested prospects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Callbacks</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profiles.filter(p => p.callback_scheduled).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {todaysCallbacks.length} due today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Answer Rate</CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profiles.length > 0 ? Math.round(
                profiles.reduce((sum, p) => sum + getAnswerRate(p), 0) / profiles.length
              ) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all profiles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by phone, name, or lead ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              handleSearch(e.target.value)
            }}
            className="pl-8"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All Profiles</TabsTrigger>
          <TabsTrigger value="high-interest">High Interest</TabsTrigger>
          <TabsTrigger value="callbacks">Callbacks</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          <div className="grid gap-4">
            {filteredProfiles.length === 0 ? (
              <Card className="p-6 text-center">
                <h3 className="text-lg font-semibold mb-2">No profiles found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search terms.' : 'No phone profiles match the current filter.'}
                </p>
              </Card>
            ) : (
              filteredProfiles.map((profile) => (
                <Card key={profile.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Phone className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold">{profile.phone_number}</h3>
                            {profile.interest_level && (
                              <Badge className={getInterestLevelColor(profile.interest_level)}>
                                {profile.interest_level} interest
                              </Badge>
                            )}
                            {profile.callback_scheduled && (
                              <Badge variant="outline">
                                <Calendar className="mr-1 h-3 w-3" />
                                Callback due
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            {profile.contact_name && (
                              <div className="flex items-center">
                                <User className="mr-1 h-3 w-3" />
                                {profile.contact_name}
                              </div>
                            )}
                            {profile.lead_id && (
                              <div className="flex items-center">
                                ID: {profile.lead_id}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        {/* Call Statistics */}
                        <div className="text-center">
                          <div className="text-lg font-semibold">{profile.total_calls}</div>
                          <div className="text-xs text-muted-foreground">Total Calls</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">{profile.answered_calls}</div>
                          <div className="text-xs text-muted-foreground">Answered</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-semibold">{getAnswerRate(profile)}%</div>
                          <div className="text-xs text-muted-foreground">Answer Rate</div>
                        </div>

                        {/* Average Duration */}
                        {profile.average_duration > 0 && (
                          <div className="text-center">
                            <div className="text-lg font-semibold">{formatDuration(Math.round(profile.average_duration))}</div>
                            <div className="text-xs text-muted-foreground">Avg Duration</div>
                          </div>
                        )}

                        {/* Last Call */}
                        {profile.last_call_date && (
                          <div className="text-center max-w-24">
                            <div className="text-sm font-medium">
                              {formatDistanceToNow(new Date(profile.last_call_date), { addSuffix: true })}
                            </div>
                            <div className="text-xs text-muted-foreground">Last Call</div>
                            {profile.last_call_outcome && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {profile.last_call_outcome}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/phone-profiles/${profile.phone_number}`)}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Call Now
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Schedule Callback
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Add Notes
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Additional Info */}
                    {(profile.notes || profile.callback_date) && (
                      <div className="mt-4 pt-4 border-t">
                        {profile.notes && (
                          <p className="text-sm text-muted-foreground mb-2">{profile.notes}</p>
                        )}
                        {profile.callback_date && (
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-1 h-3 w-3 text-orange-500" />
                            <span className="text-orange-600">
                              Callback scheduled for {format(new Date(profile.callback_date), 'PPP p')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}