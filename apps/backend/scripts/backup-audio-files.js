const audioStorageService = require('../src/services/storage/audioStorageService');

/**
 * Backup Audio Files Script
 * 
 * This script:
 * 1. Backs up external audio files to Supabase storage
 * 2. Updates database records with backed up URLs
 * 3. Cleans up old audio files based on retention policy
 */
async function backupAudioFiles() {
  try {
    console.log('Starting audio backup process...');
    
    // Update database records with backed up audio URLs
    const updatedCount = await audioStorageService.updateDatabaseRecords();
    console.log(`Updated ${updatedCount} database records with backed up audio URLs`);
    
    // Clean up old audio files (90-day retention policy)
    const deletedCount = await audioStorageService.cleanupOldFiles(90);
    console.log(`Cleaned up ${deletedCount} old audio files`);
    
    console.log('Audio backup process completed successfully');
  } catch (error) {
    console.error('Error in audio backup process:', error);
  }
}

// Run the backup process
backupAudioFiles();
