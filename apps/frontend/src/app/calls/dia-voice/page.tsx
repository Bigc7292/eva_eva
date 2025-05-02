'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Phone, Upload, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DiaVoicePage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [script, setScript] = useState('[S1] Hello, this is a test call from Dia-1.6B voice model. I am calling to confirm our appointment tomorrow. Please let me know if you need to reschedule. Thank you and have a great day!');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCallLoading, setIsCallLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleGenerateVoice = async () => {
    try {
      setIsGenerating(true);
      
      const response = await fetch('/api/dia-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: script,
          seed: 42 // Use a consistent seed for voice stability
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate voice: ${response.status}`);
      }
      
      const data = await response.json();
      setAudioUrl(data.file_url);
      toast.success('Voice generated successfully!');
    } catch (error) {
      console.error('Error generating voice:', error);
      toast.error('Failed to generate voice');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleVoiceClone = async () => {
    if (!audioFile) {
      toast.error('Please upload an audio file');
      return;
    }
    
    if (!transcript) {
      toast.error('Please provide a transcript for the audio');
      return;
    }
    
    try {
      setIsGenerating(true);
      
      const formData = new FormData();
      formData.append('audio_file', audioFile);
      formData.append('transcript', transcript);
      formData.append('text', script);
      
      const response = await fetch('/api/dia-voice', {
        method: 'PUT',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Failed to clone voice: ${response.status}`);
      }
      
      const data = await response.json();
      setAudioUrl(data.file_url);
      toast.success('Voice cloned successfully!');
    } catch (error) {
      console.error('Error cloning voice:', error);
      toast.error('Failed to clone voice');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };
  
  const handleMakeCall = async () => {
    if (!phoneNumber) {
      toast.error('Please enter a phone number');
      return;
    }
    
    try {
      setIsCallLoading(true);
      
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          customScript: script,
          metadata: {
            source: 'dia-voice-test',
            useDiaVoice: true
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to initiate call: ${response.status}`);
      }
      
      const data = await response.json();
      toast.success(`Call initiated successfully! Call ID: ${data.id}`);
    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error('Failed to initiate call');
    } finally {
      setIsCallLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Dia-1.6B Voice Integration</h1>
      
      <Tabs defaultValue="generate">
        <TabsList className="mb-4">
          <TabsTrigger value="generate">Generate Voice</TabsTrigger>
          <TabsTrigger value="clone">Voice Cloning</TabsTrigger>
          <TabsTrigger value="call">Make Call</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Generate Voice with Dia-1.6B</CardTitle>
              <CardDescription>
                Enter a script to generate voice using the Dia-1.6B model. Use [S1] and [S2] tags to indicate different speakers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="script">Script</Label>
                  <Textarea
                    id="script"
                    placeholder="[S1] Hello, this is a test..."
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    rows={6}
                  />
                </div>
                
                {audioUrl && (
                  <div className="space-y-2">
                    <Label>Generated Audio</Label>
                    <audio controls className="w-full" src={audioUrl} />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGenerateVoice} 
                disabled={isGenerating || !script}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Volume2 className="mr-2 h-4 w-4" />
                    Generate Voice
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="clone">
          <Card>
            <CardHeader>
              <CardTitle>Voice Cloning with Dia-1.6B</CardTitle>
              <CardDescription>
                Upload an audio file and provide its transcript to clone the voice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="audio-file">Audio File</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="audio-file"
                      type="file"
                      accept="audio/*"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {audioFile ? audioFile.name : 'Upload Audio File'}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="transcript">Transcript of Audio</Label>
                  <Textarea
                    id="transcript"
                    placeholder="[S1] Exact transcript of the uploaded audio..."
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clone-script">Script to Generate</Label>
                  <Textarea
                    id="clone-script"
                    placeholder="[S1] Text to be spoken in the cloned voice..."
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    rows={4}
                  />
                </div>
                
                {audioUrl && (
                  <div className="space-y-2">
                    <Label>Generated Audio with Cloned Voice</Label>
                    <audio controls className="w-full" src={audioUrl} />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleVoiceClone} 
                disabled={isGenerating || !script || !audioFile || !transcript}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cloning Voice...
                  </>
                ) : (
                  <>
                    <Volume2 className="mr-2 h-4 w-4" />
                    Clone Voice
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="call">
          <Card>
            <CardHeader>
              <CardTitle>Make Call with Dia-1.6B Voice</CardTitle>
              <CardDescription>
                Make an outbound call using the Dia-1.6B voice model.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone-number">Phone Number</Label>
                  <Input
                    id="phone-number"
                    placeholder="+971565401583"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="call-script">Script</Label>
                  <Textarea
                    id="call-script"
                    placeholder="[S1] Hello, this is a test call..."
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    rows={6}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleMakeCall} 
                disabled={isCallLoading || !phoneNumber || !script}
                className="w-full"
              >
                {isCallLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initiating Call...
                  </>
                ) : (
                  <>
                    <Phone className="mr-2 h-4 w-4" />
                    Make Call
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
