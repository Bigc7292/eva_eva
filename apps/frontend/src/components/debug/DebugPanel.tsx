'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { setupDatabase } from '@/lib/database/setup'

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState('')
  const [error, setError] = useState('')

  const handleTestQuery = async () => {
    try {
      setError('')
      setResponse('')
      
      if (!query.trim()) {
        setError('Please enter a query')
        return
      }

      const { data, error: queryError } = await supabase
        .from('calls')
        .select('*')
        .limit(1)

      if (queryError) {
        setError(queryError.message)
        return
      }

      setResponse(JSON.stringify(data, null, 2))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }

  const handleSetupDatabase = async () => {
    try {
      setError('')
      setResponse('')
      await setupDatabase()
      setResponse('Database setup completed successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        Open Debug Panel
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50">
      <div className="absolute inset-0 flex items-center justify-center">
        <Card className="w-full max-w-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Debug Panel</h2>
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Test Query</Label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter SQL query here"
              />
              <Button onClick={handleTestQuery} className="mt-2">
                Run Query
              </Button>
            </div>

            <Button onClick={handleSetupDatabase} className="w-full">
              Setup Database
            </Button>

            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                {error}
              </div>
            )}

            {response && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap">{response}</pre>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
