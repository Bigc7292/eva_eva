import { NextRequest, NextResponse } from 'next/server';
import { diaVoiceService } from '@/lib/services/dia-voice';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { pipeline } from 'stream';
import { promisify } from 'util';
import fetch from 'node-fetch';

// Promisify the pipeline function
const streamPipeline = promisify(pipeline);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Generate speech from text using Dia-1.6B
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { text, seed, voiceClone } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const filename = `${uuidv4()}.mp3`;
    const filePath = path.join(uploadsDir, filename);
    const publicUrl = `/uploads/${filename}`;

    // Generate speech with Dia-1.6B
    const result = await diaVoiceService.generateSpeech(text, seed);

    // Download the audio file
    const audioResponse = await fetch(`${process.env.NEXT_PUBLIC_DIA_API_URL}/download/${result.request_id}`);
    
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status} ${audioResponse.statusText}`);
    }
    
    // Save the audio file
    const fileStream = fs.createWriteStream(filePath);
    await streamPipeline(audioResponse.body, fileStream);

    // Store the audio file information in Supabase
    const { data, error } = await supabase
      .from('dia_voice_audios')
      .insert([
        {
          id: result.request_id,
          text,
          seed,
          file_path: publicUrl,
          generation_time: result.generation_time
        }
      ])
      .select();

    if (error) {
      console.error('Error storing audio in Supabase:', error);
    }

    return NextResponse.json({
      success: true,
      request_id: result.request_id,
      file_url: publicUrl,
      generation_time: result.generation_time
    });
  } catch (error) {
    console.error('Error generating speech:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Handle voice cloning with Dia-1.6B
 */
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio_file') as File;
    const transcript = formData.get('transcript') as string;
    const text = formData.get('text') as string;
    const seedValue = formData.get('seed') as string;
    const seed = seedValue ? parseInt(seedValue, 10) : undefined;

    if (!audioFile || !transcript || !text) {
      return NextResponse.json(
        { error: 'Audio file, transcript, and text are required' },
        { status: 400 }
      );
    }

    // Convert File to node-fetch compatible File
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const tempFilePath = path.join(os.tmpdir(), `${uuidv4()}.mp3`);
    fs.writeFileSync(tempFilePath, buffer);

    // Create a File object from the buffer
    const nodeFile = new File([buffer], audioFile.name, { type: audioFile.type });

    // Generate a unique filename for the output
    const filename = `${uuidv4()}.mp3`;
    const filePath = path.join(uploadsDir, filename);
    const publicUrl = `/uploads/${filename}`;

    // Generate speech with voice cloning
    const result = await diaVoiceService.generateSpeechWithVoiceClone(
      nodeFile,
      transcript,
      text,
      seed
    );

    // Download the audio file
    const audioResponse = await fetch(`${process.env.NEXT_PUBLIC_DIA_API_URL}/download/${result.request_id}`);
    
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status} ${audioResponse.statusText}`);
    }
    
    // Save the audio file
    const fileStream = fs.createWriteStream(filePath);
    await streamPipeline(audioResponse.body, fileStream);

    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);

    // Store the audio file information in Supabase
    const { data, error } = await supabase
      .from('dia_voice_audios')
      .insert([
        {
          id: result.request_id,
          text,
          transcript,
          seed,
          file_path: publicUrl,
          generation_time: result.generation_time,
          is_voice_clone: true
        }
      ])
      .select();

    if (error) {
      console.error('Error storing audio in Supabase:', error);
    }

    return NextResponse.json({
      success: true,
      request_id: result.request_id,
      file_url: publicUrl,
      generation_time: result.generation_time
    });
  } catch (error) {
    console.error('Error generating speech with voice cloning:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
