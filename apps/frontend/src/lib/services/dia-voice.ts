/**
 * Dia Voice Service - Handles integration with Dia-1.6B voice model
 */

const DIA_API_URL = process.env.NEXT_PUBLIC_DIA_API_URL || 'http://localhost:7860';

// Define interfaces for Dia Voice data types
export interface DiaVoiceResponse {
  success: boolean;
  request_id: string;
  output_path: string;
  generation_time: number;
  download_url: string;
}

export interface DiaVoiceError {
  success: false;
  error: string;
}

/**
 * Dia Voice Service for handling text-to-speech generation
 */
export const diaVoiceService = {
  /**
   * Generate speech from text using Dia-1.6B
   * @param text - The text to convert to speech
   * @param seed - Optional seed for reproducibility
   */
  async generateSpeech(text: string, seed?: number): Promise<DiaVoiceResponse> {
    try {
      console.log(`Generating speech with Dia-1.6B for text: ${text.substring(0, 50)}...`);
      
      const response = await fetch(`${DIA_API_URL}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          seed,
          use_torch_compile: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Dia Voice API error response:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Dia Voice generation failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Dia Voice generation successful:', data);
      return data;
    } catch (error) {
      console.error('Error generating speech with Dia-1.6B:', error);
      throw error;
    }
  },

  /**
   * Generate speech with voice cloning using Dia-1.6B
   * @param audioFile - The audio file to clone the voice from
   * @param transcript - The transcript of the audio file
   * @param text - The text to convert to speech with the cloned voice
   * @param seed - Optional seed for reproducibility
   */
  async generateSpeechWithVoiceClone(
    audioFile: File,
    transcript: string,
    text: string,
    seed?: number
  ): Promise<DiaVoiceResponse> {
    try {
      console.log(`Generating speech with voice cloning for text: ${text.substring(0, 50)}...`);
      
      const formData = new FormData();
      formData.append('audio_file', audioFile);
      formData.append('transcript', transcript);
      formData.append('text', text);
      if (seed !== undefined) {
        formData.append('seed', seed.toString());
      }
      formData.append('use_torch_compile', 'true');

      const response = await fetch(`${DIA_API_URL}/voice-clone`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Dia Voice API error response:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Dia Voice cloning failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Dia Voice cloning successful:', data);
      return data;
    } catch (error) {
      console.error('Error generating speech with voice cloning:', error);
      throw error;
    }
  },

  /**
   * Download generated audio file
   * @param requestId - The ID of the generated audio
   */
  async downloadAudio(requestId: string): Promise<Blob> {
    try {
      console.log(`Downloading audio for request ID: ${requestId}`);
      
      const response = await fetch(`${DIA_API_URL}/download/${requestId}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Dia Voice API error response:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Dia Voice audio download failed: ${response.status} - ${errorText}`);
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('Error downloading audio from Dia-1.6B:', error);
      throw error;
    }
  }
};
