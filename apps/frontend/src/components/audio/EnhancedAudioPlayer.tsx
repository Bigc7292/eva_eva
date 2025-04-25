'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Download,
  Waveform
} from 'lucide-react'

interface EnhancedAudioPlayerProps {
  audioUrl: string
  transcript?: string
  showTranscript?: boolean
  showWaveform?: boolean
  showDownload?: boolean
  title?: string
  onPlaybackComplete?: () => void
}

export function EnhancedAudioPlayer({ 
  audioUrl, 
  transcript, 
  showTranscript = true,
  showWaveform = true,
  showDownload = true,
  title,
  onPlaybackComplete
}: EnhancedAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLoaded, setIsLoaded] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const waveformRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  // Load audio metadata
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoaded(true)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [audioUrl])

  // Handle playback
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      if (onPlaybackComplete) {
        onPlaybackComplete()
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [onPlaybackComplete])

  // Draw waveform (simplified version)
  useEffect(() => {
    if (!showWaveform || !isLoaded || !waveformRef.current) return
    
    const canvas = waveformRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw a simple waveform visualization
    const barCount = 100
    const barWidth = canvas.width / barCount
    const barGap = 2
    const barHeightMultiplier = canvas.height / 2
    
    ctx.fillStyle = 'rgba(99, 102, 241, 0.8)'
    
    for (let i = 0; i < barCount; i++) {
      // Generate a pseudo-random height based on position
      const height = Math.sin(i * 0.2) * 0.5 + 0.5
      const x = i * (barWidth + barGap)
      const barHeight = height * barHeightMultiplier
      
      // Draw bar
      ctx.fillRect(
        x, 
        canvas.height / 2 - barHeight / 2, 
        barWidth, 
        barHeight
      )
    }
    
    // Draw playback position indicator
    if (duration > 0) {
      const playbackPosition = (currentTime / duration) * canvas.width
      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)'
      ctx.fillRect(0, 0, playbackPosition, canvas.height)
    }
  }, [isLoaded, showWaveform, currentTime, duration])

  // Toggle play/pause
  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    
    setIsPlaying(!isPlaying)
  }

  // Seek to position
  const seek = (time: number) => {
    const audio = audioRef.current
    if (!audio) return
    
    audio.currentTime = time
    setCurrentTime(time)
  }

  // Skip forward/backward
  const skip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    
    const newTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds))
    seek(newTime)
  }

  // Toggle mute
  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    
    audio.muted = !isMuted
    setIsMuted(!isMuted)
  }

  // Change volume
  const changeVolume = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return
    
    const newVolume = value[0]
    audio.volume = newVolume
    setVolume(newVolume)
    
    if (newVolume === 0) {
      setIsMuted(true)
      audio.muted = true
    } else if (isMuted) {
      setIsMuted(false)
      audio.muted = false
    }
  }

  // Change playback rate
  const changePlaybackRate = (rate: number) => {
    const audio = audioRef.current
    if (!audio) return
    
    audio.playbackRate = rate
    setPlaybackRate(rate)
  }

  // Format time (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        {title && (
          <div className="text-lg font-medium mb-2">{title}</div>
        )}
        
        {/* Waveform visualization */}
        {showWaveform && (
          <div className="relative w-full h-16 bg-muted rounded-md overflow-hidden">
            <canvas 
              ref={waveformRef} 
              className="w-full h-full"
              width={500}
              height={64}
            />
            <div 
              className="absolute top-0 left-0 w-full h-full cursor-pointer"
              onClick={(e) => {
                if (!audioRef.current) return
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                const percentage = x / rect.width
                seek(percentage * duration)
              }}
            />
          </div>
        )}
        
        {/* Time slider */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration}
            step={0.1}
            onValueChange={(value) => seek(value[0])}
            aria-label="Seek time"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        {/* Playback controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(-10)}
              aria-label="Skip back 10 seconds"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              variant="default"
              size="icon"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="h-10 w-10 rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(10)}
              aria-label="Skip forward 10 seconds"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            
            <div className="w-24">
              <Slider
                value={[isMuted ? 0 : volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={changeVolume}
                aria-label="Volume"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={playbackRate}
              onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
              className="bg-muted text-xs rounded px-2 py-1"
              aria-label="Playback speed"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
            
            {showDownload && (
              <Button
                variant="outline"
                size="icon"
                asChild
              >
                <a 
                  href={audioUrl} 
                  download 
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Download audio"
                >
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
      
      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        preload="metadata"
      />
      
      {/* Transcript */}
      {showTranscript && transcript && (
        <CardFooter className="flex flex-col border-t p-4">
          <div className="w-full">
            <h4 className="font-medium mb-2">Transcript</h4>
            <div className="bg-muted p-3 rounded-md max-h-48 overflow-y-auto">
              <p className="text-sm whitespace-pre-line">{transcript}</p>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
