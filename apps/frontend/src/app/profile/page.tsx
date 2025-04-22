'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ProfilePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to leads page if no specific profile is selected
    router.push('/leads')
  }, [router])

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please select a contact to view their profile.</p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/leads')}
            className="mt-4"
          >
            Go to Contacts
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
