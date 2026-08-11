const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const YTDLP_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
const FFMPEG_URL = 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip';

console.log('Setting up backend dependencies...');

// Create bins directory
const binDir = path.join(__dirname, 'bin');
if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir);
}

// Download yt-dlp.exe
const ytdlpPath = path.join(binDir, 'yt-dlp.exe');
if (!fs.existsSync(ytdlpPath)) {
    console.log('Downloading yt-dlp.exe...');
    execSync(`powershell -Command "Invoke-WebRequest -Uri '${YTDLP_URL}' -OutFile '${ytdlpPath}'"`, { stdio: 'inherit' });
    console.log('yt-dlp.exe downloaded.');
} else {
    console.log('yt-dlp.exe already exists.');
}

// Download and extract ffmpeg
const ffmpegExePath = path.join(binDir, 'ffmpeg.exe');
if (!fs.existsSync(ffmpegExePath)) {
    console.log('Downloading ffmpeg...');
    const zipPath = path.join(binDir, 'ffmpeg.zip');
    execSync(`powershell -Command "Invoke-WebRequest -Uri '${FFMPEG_URL}' -OutFile '${zipPath}'"`, { stdio: 'inherit' });
    
    console.log('Extracting ffmpeg...');
    const extractPath = path.join(binDir, 'ffmpeg-extracted');
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractPath}' -Force"`, { stdio: 'inherit' });
    
    // Move ffmpeg.exe to bin dir
    // The zip contains a folder like ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe
    execSync(`powershell -Command "Get-ChildItem -Path '${extractPath}' -Recurse -Filter 'ffmpeg.exe' | Copy-Item -Destination '${binDir}'"`, { stdio: 'inherit' });
    
    // Cleanup
    fs.unlinkSync(zipPath);
    fs.rmSync(extractPath, { recursive: true, force: true });
    
    console.log('ffmpeg installed.');
} else {
    console.log('ffmpeg already exists.');
}

console.log('Setup complete!');
