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
  // Empty arrays for accounts and campaigns - will be populated from database in the future
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])

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
    // This would connect to the actual social media API in a real implementation
    alert(`This would connect to the ${newAccountPlatform} API in a real implementation.`)
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
                    <label htmlFor="platform-select" className="text-sm font-medium mb-1 block">Platform</label>
                    <select
                      id="platform-select"
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

            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground text-center mb-4">
                Social media leads will be displayed here when connected to your social media accounts.
              </p>
              <p className="text-sm text-muted-foreground text-center">
                Connect your social media accounts to start collecting leads.
              </p>
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
