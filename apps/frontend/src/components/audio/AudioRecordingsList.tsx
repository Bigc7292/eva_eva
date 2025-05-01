'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Music,
  Download,
  Play,
  Pause,
  FileText,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock
} from 'lucide-react'

interface Recording {
  id: string
  call_id: string
  timestamp: string
  duration: number
  url: string
  call_type: string
  call_status: string
  transcript?: string | null
  summary?: string | null
}

interface AudioRecordingsListProps {
  contactId: string
}

export function AudioRecordingsList({ contactId }: AudioRecordingsListProps) {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRecordings() {
      try {
        setLoading(true)
        setError(null)

        // Use a timeout to prevent infinite loading if the API is down
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out')), 5000)
        })

        // Create the fetch promise
        const fetchPromise = fetch(`/api/contacts/${contactId}/recordings`)

        // Race the fetch against the timeout
        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response

        if (!response.ok) {
          // If we get a 500 error, just show empty recordings instead of an error
          if (response.status === 500) {
            console.warn('Recordings API returned 500, showing empty recordings instead')
            setRecordings([])
            return
          }
          throw new Error(`Failed to fetch recordings: ${response.status}`)
        }

        const data = await response.json()

        if (data.success && Array.isArray(data.recordings)) {
          setRecordings(data.recordings)
        } else {
          // If we get an invalid format, just show empty recordings
          console.warn('Invalid recordings format, showing empty recordings instead')
          setRecordings([])
        }
      } catch (err) {
        console.error('Error fetching recordings:', err)
        // Instead of showing an error, just show empty recordings
        setRecordings([])
      } finally {
        setLoading(false)
      }
    }

    if (contactId) {
      fetchRecordings()
    }
  }, [contactId])

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const togglePlay = (recordingId: string, audioElement: HTMLAudioElement) => {
    if (currentlyPlaying === recordingId) {
      audioElement.pause()
      setCurrentlyPlaying(null)
    } else {
      // Pause any currently playing audio
      if (currentlyPlaying) {
        const currentAudio = document.getElementById(`audio-${currentlyPlaying}`) as HTMLAudioElement
        if (currentAudio) {
          currentAudio.pause()
        }
      }

      audioElement.play()
      setCurrentlyPlaying(recordingId)
    }
  }

  const handleAudioEnded = () => {
    setCurrentlyPlaying(null)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audio Recordings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audio Recordings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-center">
            Error loading recordings: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recordings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audio Recordings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-6">
            No audio recordings available for this contact
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Audio Recordings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recordings.map((recording) => (
            <div key={recording.id} className="border-b pb-4 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Music className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{recording.call_type} Call</span>
                  <Badge variant="outline">{recording.call_status}</Badge>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{formatDate(recording.timestamp)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm mb-3">
                <div className="flex items-center">
                  <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                  <span>{formatDuration(recording.duration)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-2">
                <audio
                  id={`audio-${recording.id}`}
                  src={recording.url}
                  onEnded={handleAudioEnded}
                  className="hidden"
                >
                  <track kind="captions" src="" label="English captions" />
                  Your browser does not support the audio element.
                </audio>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePlay(recording.id, document.getElementById(`audio-${recording.id}`) as HTMLAudioElement)}
                  className="h-8 w-8 p-0"
                >
                  {currentlyPlaying === recording.id ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${currentlyPlaying === recording.id ? 'bg-blue-500 animate-pulse w-full' : 'bg-blue-200 w-0'}`}
                  />
                </div>
                <a
                  href={recording.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-xs text-primary hover:underline"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </a>
              </div>

              {recording.transcript && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Transcript</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedTranscript(expandedTranscript === recording.id ? null : recording.id)}
                      className="h-6 px-2 text-xs"
                    >
                      {expandedTranscript === recording.id ? (
                        <>
                          <ChevronUp className="h-3 w-3 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3 mr-1" />
                          Show
                        </>
                      )}
                    </Button>
                  </div>
                  {expandedTranscript === recording.id && (
                    <div className="bg-muted p-3 rounded-md max-h-60 overflow-y-auto">
                      <pre className="text-xs whitespace-pre-line font-sans">{recording.transcript}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
