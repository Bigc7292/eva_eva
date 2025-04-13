'use client'

import { useEffect, useState } from 'react'
import { initDatabase } from '@/lib/init-database'
import { databaseService } from '@/services/database'
import { simpleLogger } from '@/components/debug/SimpleLogger'

export function DatabaseInitializer() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const startTime = performance.now()
    simpleLogger.info('DatabaseInitializer: Starting database initialization')

    try {
      // Initialize the database service
      simpleLogger.info('DatabaseInitializer: Initializing database service')
      databaseService.initialize()
      simpleLogger.info('DatabaseInitializer: Database service initialized')

      // Check if the database is already initialized
      simpleLogger.info('DatabaseInitializer: Checking if database is already initialized')
      const leads = databaseService.getLeads()
      simpleLogger.info('DatabaseInitializer: Retrieved leads', { count: leads.length })

      if (leads.length === 0) {
        // Initialize the database with sample data
        simpleLogger.info('DatabaseInitializer: Database empty, initializing with sample data')
        const result = initDatabase()
        simpleLogger.info('DatabaseInitializer: Database initialized with sample data', {
          leads: result.leads.length,
          calls: result.calls.length
        })
      } else {
        simpleLogger.info('DatabaseInitializer: Database already initialized', {
          leadsCount: leads.length
        })
      }

      setInitialized(true)
      const endTime = performance.now()
      simpleLogger.info('DatabaseInitializer: Initialization complete', {
        duration: `${(endTime - startTime).toFixed(2)}ms`
      })
    } catch (error) {
      simpleLogger.error('DatabaseInitializer: Error initializing database', {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }, [])

  // This component doesn't render anything visible
  return null
}
