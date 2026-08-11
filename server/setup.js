const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const isLinux = os.platform() === 'linux';
const isWindows = os.platform() === 'win32';

const YTDLP_WIN_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
const YTDLP_LINUX_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';

const FFMPEG_WIN_URL = 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip';
const FFMPEG_LINUX_URL = 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz';

console.log('Setting up backend dependencies...');

const binDir = path.join(__dirname, 'bin');
if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir);
}

const ytdlpBin = isWindows ? 'yt-dlp.exe' : 'yt-dlp';
const ytdlpPath = path.join(binDir, ytdlpBin);

if (!fs.existsSync(ytdlpPath)) {
    console.log(`Downloading ${ytdlpBin}...`);
    if (isWindows) {
        execSync(`powershell -Command "Invoke-WebRequest -Uri '${YTDLP_WIN_URL}' -OutFile '${ytdlpPath}'"`, { stdio: 'inherit' });
    } else if (isLinux) {
        execSync(`curl -L ${YTDLP_LINUX_URL} -o ${ytdlpPath}`, { stdio: 'inherit' });
        execSync(`chmod a+rx ${ytdlpPath}`, { stdio: 'inherit' });
    }
    console.log(`${ytdlpBin} downloaded.`);
} else {
    console.log(`${ytdlpBin} already exists.`);
}

const ffmpegBin = isWindows ? 'ffmpeg.exe' : 'ffmpeg';
const ffmpegExePath = path.join(binDir, ffmpegBin);

if (!fs.existsSync(ffmpegExePath)) {
    console.log(`Downloading ${ffmpegBin}...`);
    if (isWindows) {
        const zipPath = path.join(binDir, 'ffmpeg.zip');
        execSync(`powershell -Command "Invoke-WebRequest -Uri '${FFMPEG_WIN_URL}' -OutFile '${zipPath}'"`, { stdio: 'inherit' });
        
        const extractPath = path.join(binDir, 'ffmpeg-extracted');
        execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractPath}' -Force"`, { stdio: 'inherit' });
        
        execSync(`powershell -Command "Get-ChildItem -Path '${extractPath}' -Recurse -Filter 'ffmpeg.exe' | Copy-Item -Destination '${binDir}'"`, { stdio: 'inherit' });
        
        fs.unlinkSync(zipPath);
        fs.rmSync(extractPath, { recursive: true, force: true });
    } else if (isLinux) {
        const tarPath = path.join(binDir, 'ffmpeg.tar.xz');
        execSync(`curl -L ${FFMPEG_LINUX_URL} -o ${tarPath}`, { stdio: 'inherit' });
        
        const extractPath = path.join(binDir, 'ffmpeg-extracted');
        fs.mkdirSync(extractPath, { recursive: true });
        execSync(`tar -xf ${tarPath} -C ${extractPath} --strip-components=1`, { stdio: 'inherit' });
        
        fs.copyFileSync(path.join(extractPath, 'ffmpeg'), ffmpegExePath);
        execSync(`chmod a+rx ${ffmpegExePath}`, { stdio: 'inherit' });
        
        fs.unlinkSync(tarPath);
        fs.rmSync(extractPath, { recursive: true, force: true });
    }
    console.log(`${ffmpegBin} installed.`);
} else {
    console.log(`${ffmpegBin} already exists.`);
}

console.log('Setup complete!');
