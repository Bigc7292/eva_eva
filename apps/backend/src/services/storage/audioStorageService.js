const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://stexfwbuwyyfmkmxcftv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZXhmd2J1d3l5Zm1rbXhjZnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjIwNzIsImV4cCI6MjA2MDAzODA3Mn0.0eEPS7CkQQVItLfMQd0z7p6XSLZaCDp4XhYzxIkopvc';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Storage bucket name
const AUDIO_BUCKET = 'call-recordings';

/**
 * Audio Storage Service
 * Manages audio file storage, backup, and optimization
 */
class AudioStorageService {
  /**
   * Initialize the audio storage service
   */
  constructor() {
    this.ensureBucketExists();
  }

  /**
   * Ensure the storage bucket exists
   */
  async ensureBucketExists() {
    try {
      // Check if bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets.some(bucket => bucket.name === AUDIO_BUCKET);

      if (!bucketExists) {
        // Create bucket if it doesn't exist
        const { error } = await supabase.storage.createBucket(AUDIO_BUCKET, {
          public: false,
          fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
          allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
        });

        if (error) {
          console.error('Error creating storage bucket:', error);
        } else {
          console.log(`Created storage bucket: ${AUDIO_BUCKET}`);
        }
      }
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
    }
  }

  /**
   * Download an audio file from a URL and store it in Supabase
   * @param {string} url - The URL of the audio file
   * @param {string} callId - The ID of the call
   * @returns {Promise<string|null>} The URL of the stored file or null if failed
   */
  async backupAudioFromUrl(url, callId) {
    try {
      if (!url) {
        console.warn('No URL provided for audio backup');
        return null;
      }

      console.log(`Backing up audio from URL: ${url}`);

      // Download the file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`);
      }

      // Get file extension from content-type or URL
      let fileExtension = '.mp3';
      const contentType = response.headers.get('content-type');
      if (contentType) {
        if (contentType.includes('audio/wav')) fileExtension = '.wav';
        else if (contentType.includes('audio/ogg')) fileExtension = '.ogg';
      } else if (url.includes('.wav')) fileExtension = '.wav';
      else if (url.includes('.ogg')) fileExtension = '.ogg';

      // Create a temporary file
      const tempDir = path.join(__dirname, '../../../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFilePath = path.join(tempDir, `${callId}${fileExtension}`);
      
      // Save the file
      await pipeline(
        response.body,
        fs.createWriteStream(tempFilePath)
      );

      // Upload to Supabase
      const fileName = `${callId}${fileExtension}`;
      const { error: uploadError } = await supabase.storage
        .from(AUDIO_BUCKET)
        .upload(fileName, fs.createReadStream(tempFilePath), {
          contentType: contentType || 'audio/mpeg',
          cacheControl: '3600'
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(AUDIO_BUCKET)
        .getPublicUrl(fileName);

      // Clean up temp file
      fs.unlinkSync(tempFilePath);

      console.log(`Audio backed up successfully: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      console.error('Error backing up audio:', error);
      return null;
    }
  }

  /**
   * Get a signed URL for a stored audio file
   * @param {string} callId - The ID of the call
   * @returns {Promise<string|null>} The signed URL or null if failed
   */
  async getSignedUrl(callId) {
    try {
      // Try different extensions
      const extensions = ['.mp3', '.wav', '.ogg'];
      
      for (const ext of extensions) {
        const fileName = `${callId}${ext}`;
        
        // Check if file exists
        const { data: fileExists } = await supabase.storage
          .from(AUDIO_BUCKET)
          .list('', {
            search: fileName
          });
          
        if (fileExists && fileExists.length > 0) {
          // Get signed URL
          const { data, error } = await supabase.storage
            .from(AUDIO_BUCKET)
            .createSignedUrl(fileName, 3600); // 1 hour expiry
            
          if (error) {
            throw error;
          }
          
          return data.signedUrl;
        }
      }
      
      console.warn(`No audio file found for call ${callId}`);
      return null;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  }

  /**
   * Clean up old audio files based on retention policy
   * @param {number} retentionDays - Number of days to retain files (default: 90)
   * @returns {Promise<number>} Number of files deleted
   */
  async cleanupOldFiles(retentionDays = 90) {
    try {
      console.log(`Cleaning up audio files older than ${retentionDays} days`);
      
      // Get all files
      const { data: files, error } = await supabase.storage
        .from(AUDIO_BUCKET)
        .list();
        
      if (error) {
        throw error;
      }
      
      if (!files || files.length === 0) {
        console.log('No files to clean up');
        return 0;
      }
      
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      // Filter files older than cutoff
      const oldFiles = files.filter(file => {
        const fileDate = new Date(file.created_at);
        return fileDate < cutoffDate;
      });
      
      if (oldFiles.length === 0) {
        console.log('No old files to delete');
        return 0;
      }
      
      // Delete old files
      const filesToDelete = oldFiles.map(file => file.name);
      const { error: deleteError } = await supabase.storage
        .from(AUDIO_BUCKET)
        .remove(filesToDelete);
        
      if (deleteError) {
        throw deleteError;
      }
      
      console.log(`Deleted ${filesToDelete.length} old audio files`);
      return filesToDelete.length;
    } catch (error) {
      console.error('Error cleaning up old files:', error);
      return 0;
    }
  }

  /**
   * Update database records with backed up audio URLs
   * @returns {Promise<number>} Number of records updated
   */
  async updateDatabaseRecords() {
    try {
      console.log('Updating database records with backed up audio URLs');
      
      // Get calls with external recording URLs but no backed up URLs
      const { data: calls, error } = await supabase
        .from('calls')
        .select('call_id, recording_url')
        .not('recording_url', 'is', null)
        .is('audio_url', null);
        
      if (error) {
        throw error;
      }
      
      if (!calls || calls.length === 0) {
        console.log('No calls to update');
        return 0;
      }
      
      console.log(`Found ${calls.length} calls to update`);
      
      // Process each call
      let updatedCount = 0;
      for (const call of calls) {
        // Backup the audio
        const backedUpUrl = await this.backupAudioFromUrl(call.recording_url, call.call_id);
        
        if (backedUpUrl) {
          // Update the database record
          const { error: updateError } = await supabase
            .from('calls')
            .update({ audio_url: backedUpUrl })
            .eq('call_id', call.call_id);
            
          if (updateError) {
            console.error(`Error updating call ${call.call_id}:`, updateError);
          } else {
            updatedCount++;
          }
        }
      }
      
      console.log(`Updated ${updatedCount} call records`);
      return updatedCount;
    } catch (error) {
      console.error('Error updating database records:', error);
      return 0;
    }
  }
}

module.exports = new AudioStorageService();
