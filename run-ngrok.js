/**
 * Simple script to run ngrok directly
 */
const { spawn } = require('child_process');
const PORT = 3004;

console.log(`Starting ngrok on port ${PORT}...`);
console.log('If this is your first time using ngrok, you may need to authenticate:');
console.log('  ngrok authtoken YOUR_AUTH_TOKEN');
console.log('You can get your auth token at https://dashboard.ngrok.com/get-started/your-authtoken');

// Run ngrok in the foreground so the user can see the URL
const ngrok = spawn('ngrok', ['http', PORT.toString()], { 
  stdio: 'inherit',
  shell: true
});

ngrok.on('error', (error) => {
  console.error('Error starting ngrok:', error.message);
  
  if (error.code === 'ENOENT') {
    console.error('\nngrok is not installed or not in your PATH.');
    console.error('Please install ngrok using one of these methods:');
    console.error('  npm install -g ngrok');
    console.error('  or download from https://ngrok.com/download');
  }
});

// Keep the process running
process.on('SIGINT', () => {
  console.log('Stopping ngrok...');
  ngrok.kill();
  process.exit();
});
