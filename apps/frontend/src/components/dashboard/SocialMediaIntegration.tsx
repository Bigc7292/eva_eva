'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Facebook, Instagram, Twitter, Linkedin, MessageCircle, Plus, Check, ExternalLink } from 'lucide-react'

interface SocialAccount {
  id: string
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin'
  name: string
  status: 'connected' | 'pending' | 'error'
  metrics?: {
    followers: number
    engagement: number
    leads: number
  }
}

interface Campaign {
  id: string
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin'
  name: string
  status: 'active' | 'scheduled' | 'completed' | 'paused'
  budget: string
  leads: number
  conversion: number
  startDate: string
  endDate?: string
}

export function SocialMediaIntegration() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([
    {
      id: '1',
      platform: 'facebook',
      name: 'Eva Real Estate',
      status: 'connected',
      metrics: {
        followers: 12500,
        engagement: 3.2,
        leads: 145
      }
    },
    {
      id: '2',
      platform: 'instagram',
      name: 'Eva Real Estate Dubai',
      status: 'connected',
      metrics: {
        followers: 8700,
        engagement: 4.7,
        leads: 98
      }
    },
    {
      id: '3',
      platform: 'linkedin',
      name: 'Eva Real Estate Professional',
      status: 'connected',
      metrics: {
        followers: 5200,
        engagement: 2.1,
        leads: 76
      }
    }
  ])
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      platform: 'facebook',
      name: 'Dubai Marina Properties Q3',
      status: 'active',
      budget: '$2,500',
      leads: 87,
      conversion: 4.2,
      startDate: '2023-07-15',
      endDate: '2023-09-30'
    },
    {
      id: '2',
      platform: 'instagram',
      name: 'Luxury Apartments Promotion',
      status: 'active',
      budget: '$1,800',
      leads: 64,
      conversion: 3.8,
      startDate: '2023-08-01',
      endDate: '2023-10-15'
    },
    {
      id: '3',
      platform: 'linkedin',
      name: 'Investment Properties Webinar',
      status: 'scheduled',
      budget: '$1,200',
      leads: 0,
      conversion: 0,
      startDate: '2023-09-15',
      endDate: '2023-11-15'
    },
    {
      id: '4',
      platform: 'facebook',
      name: 'Palm Jumeirah Exclusive Listings',
      status: 'completed',
      budget: '$3,000',
      leads: 112,
      conversion: 5.3,
      startDate: '2023-05-01',
      endDate: '2023-07-31'
    }
  ])
  
  const [newAccountPlatform, setNewAccountPlatform] = useState<string>('facebook')
  const [showConnectForm, setShowConnectForm] = useState(false)
  
  const getPlatformIcon = (platform: string, className = 'h-5 w-5') => {
    switch (platform) {
      case 'facebook':
        return <Facebook className={className} />
      case 'instagram':
        return <Instagram className={className} />
      case 'twitter':
        return <Twitter className={className} />
      case 'linkedin':
        return <Linkedin className={className} />
      default:
        return <MessageCircle className={className} />
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  const handleConnectAccount = () => {
    // Simulate connecting a new account
    const newAccount: SocialAccount = {
      id: `${accounts.length + 1}`,
      platform: newAccountPlatform as any,
      name: `Eva Real Estate ${newAccountPlatform.charAt(0).toUpperCase() + newAccountPlatform.slice(1)}`,
      status: 'connected',
      metrics: {
        followers: Math.floor(Math.random() * 5000) + 1000,
        engagement: parseFloat((Math.random() * 5).toFixed(1)),
        leads: Math.floor(Math.random() * 50) + 10
      }
    }
    
    setAccounts([...accounts, newAccount])
    setShowConnectForm(false)
  }
  
  const handleContactLead = (campaignId: string) => {
    // Simulate contacting a lead
    alert(`Contacting leads from campaign ${campaignId}. This would open the messaging interface in a real implementation.`)
  }
  
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Social Media Integration</h3>
      
      <Tabs defaultValue="accounts">
        <TabsList className="mb-4">
          <TabsTrigger value="accounts">Connected Accounts</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="leads">Social Leads</TabsTrigger>
        </TabsList>
        
        <TabsContent value="accounts">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Connected Social Accounts</h4>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowConnectForm(!showConnectForm)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Connect Account
              </Button>
            </div>
            
            {showConnectForm && (
              <div className="bg-muted p-4 rounded-lg">
                <h5 className="font-medium mb-3">Connect a New Account</h5>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Platform</label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={newAccountPlatform}
                      onChange={(e) => setNewAccountPlatform(e.target.value)}
                    >
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="twitter">Twitter</option>
                      <option value="linkedin">LinkedIn</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowConnectForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleConnectAccount}
                    >
                      Connect
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid gap-4 md:grid-cols-2">
              {accounts.map((account) => (
                <div key={account.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(account.platform)}
                      <div>
                        <h5 className="font-medium">{account.name}</h5>
                        <p className="text-xs text-muted-foreground">{account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(account.status)}`}>
                      {account.status === 'connected' && <Check className="h-3 w-3 inline mr-1" />}
                      {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                    </div>
                  </div>
                  
                  {account.metrics && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-muted p-2 rounded-lg">
                        <p className="text-lg font-bold">{account.metrics.followers.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Followers</p>
                      </div>
                      <div className="bg-muted p-2 rounded-lg">
                        <p className="text-lg font-bold">{account.metrics.engagement}%</p>
                        <p className="text-xs text-muted-foreground">Engagement</p>
                      </div>
                      <div className="bg-muted p-2 rounded-lg">
                        <p className="text-lg font-bold">{account.metrics.leads}</p>
                        <p className="text-xs text-muted-foreground">Leads</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 flex justify-end">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Profile
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="campaigns">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Social Media Campaigns</h4>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Campaign
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-2 text-sm font-medium">Campaign</th>
                    <th className="text-left p-2 text-sm font-medium">Platform</th>
                    <th className="text-left p-2 text-sm font-medium">Status</th>
                    <th className="text-left p-2 text-sm font-medium">Budget</th>
                    <th className="text-left p-2 text-sm font-medium">Leads</th>
                    <th className="text-left p-2 text-sm font-medium">Conversion</th>
                    <th className="text-left p-2 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(campaign.startDate).toLocaleDateString()} - 
                            {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Ongoing'}
                          </p>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          {getPlatformIcon(campaign.platform, 'h-4 w-4')}
                          <span className="text-sm">{campaign.platform.charAt(0).toUpperCase() + campaign.platform.slice(1)}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-2">{campaign.budget}</td>
                      <td className="p-2">{campaign.leads}</td>
                      <td className="p-2">{campaign.conversion}%</td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleContactLead(campaign.id)}
                            disabled={campaign.leads === 0}
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Contact Leads
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="leads">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Social Media Leads</h4>
              <div className="flex gap-2">
                <Input placeholder="Search leads..." className="max-w-xs" />
                <Button variant="outline" size="sm">Filter</Button>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, index) => {
                const platforms = ['facebook', 'instagram', 'linkedin', 'twitter']
                const platform = platforms[Math.floor(Math.random() * platforms.length)]
                const name = ['John Smith', 'Sarah Johnson', 'Mohammed Al Fayed', 'Emma Wilson', 'Raj Patel', 'Anna Lee'][Math.floor(Math.random() * 6)]
                const interest = ['Luxury Apartments', 'Investment Properties', 'Commercial Spaces', 'Villas', 'Off-plan Projects'][Math.floor(Math.random() * 5)]
                const date = new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toLocaleDateString()
                
                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(platform)}
                        <div>
                          <h5 className="font-medium">{name}</h5>
                          <p className="text-xs text-muted-foreground">Via {platform.charAt(0).toUpperCase() + platform.slice(1)}</p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">{date}</div>
                    </div>
                    
                    <p className="text-sm mb-3">Interested in {interest} in Dubai.</p>
                    
                    <div className="flex justify-between">
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Message
                      </Button>
                      <Button variant="outline" size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        Add to CRM
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="flex justify-center mt-4">
              <Button variant="outline">Load More</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
