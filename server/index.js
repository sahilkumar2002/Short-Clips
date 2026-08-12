const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { parseVtt } = require('./vttParser');

const app = express();
app.use(cors());
app.use(express.json());

// Serve the clips statically so frontend can play them
const clipsDir = path.join(__dirname, '..', 'public', 'clips');
if (!fs.existsSync(clipsDir)) {
    fs.mkdirSync(clipsDir, { recursive: true });
}
app.use('/clips', express.static(clipsDir));

const isWindows = os.platform() === 'win32';
const YTDLP_BIN = path.join(__dirname, 'bin', isWindows ? 'yt-dlp.exe' : 'yt-dlp');
const FFMPEG_BIN = path.join(__dirname, 'bin', isWindows ? 'ffmpeg.exe' : 'ffmpeg');

// Serve the compiled React app
const distDir = path.join(__dirname, '..', 'dist');
app.use(express.static(distDir));

const jobs = new Map();
const generateId = () => Math.random().toString(36).substr(2, 9);

app.post('/api/process', async (req, res) => {
    const { url, offset = 0, accessCode } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    if (offset === 0) {
        const expectedCode = process.env.ACCESS_CODE || 'opus2026';
        if (!accessCode || accessCode !== expectedCode) {
            return res.status(401).json({ error: 'Invalid access code.' });
        }
    }

    const jobId = generateId();
    jobs.set(jobId, { status: 'processing', clips: [], error: null });
    
    // Return immediately to prevent Render's 100-second timeout
    res.json({ jobId });

    // Start background processing
    (async () => {
        try {
            console.log(`Processing video [${jobId}]: ${url}`);
            
            // Clean up old clips only on first generation
        if (offset === 0) {
            fs.readdirSync(clipsDir).forEach(file => {
                if (file.endsWith('.mp4') || file.endsWith('.vtt')) {
                    fs.unlinkSync(path.join(clipsDir, file));
                }
            });
        }

        const clips = [];
        
        // Add bypass args or cookies
        const cookiesPath = path.join(__dirname, '..', 'cookies.txt');
        const ytDlpBaseArgs = [];
        
        if (fs.existsSync(cookiesPath)) {
            // console.log("Using cookies.txt for authentication.");
            // ytDlpBaseArgs.push('--cookies', cookiesPath);
            console.log("Ignoring cookies.txt as it may be flagged by YouTube.");
        }
        
        // Force iOS client to avoid HLS streams and bypass the latest bot block
        ytDlpBaseArgs.push('--extractor-args', 'youtube:player_client=ios,web');
        ytDlpBaseArgs.push('--rm-cache-dir');

        // 1. Download subtitles first
        console.log("Fetching auto-subtitles...");
        const subsPath = path.join(clipsDir, 'subtitles');
        await new Promise((resolve) => {
            const subArgs = [
                url,
                '--write-auto-subs',
                '--sub-format', 'vtt',
                '--sub-langs', 'en',
                '--skip-download',
                ...ytDlpBaseArgs,
                '-o', subsPath
            ];
            const subProcess = spawn(YTDLP_BIN, subArgs);
            subProcess.stdout.on('data', d => console.log(`[subs stdout]: ${d}`));
            subProcess.stderr.on('data', d => console.error(`[subs stderr]: ${d}`));
            subProcess.on('error', (err) => {
                console.error('Error spawning yt-dlp for subtitles:', err);
                resolve();
            });
            subProcess.on('close', resolve);
        });
        
        let subtitles = [];
        const subFile = path.join(clipsDir, 'subtitles.en.vtt');
        if (fs.existsSync(subFile)) {
            subtitles = parseVtt(subFile);
            console.log(`Parsed ${subtitles.length} subtitle lines.`);
        } else {
            console.log("No English auto-subtitles found.");
        }
        
        // Dynamically generate 3 clips of 60 seconds each, shifted by offset
        const timeRanges = [];
        for (let i = 0; i < 3; i++) {
            const clipNumber = offset + i + 1;
            const startSec = 10 + ((clipNumber - 1) * 90);
            const endSec = startSec + 60;
            
            const formatTime = (secs) => {
                const m = Math.floor(secs / 60).toString().padStart(2, '0');
                const s = (secs % 60).toString().padStart(2, '0');
                return `00:${m}:${s}`;
            };
            
            const hooks = [
                "The undeniable truth about...",
                "Why everyone gets this wrong...",
                "This one strategy changed everything...",
                "I couldn't believe this worked...",
                "The secret no one tells you...",
                "How to instantly improve your..."
            ];
            
            timeRanges.push({
                start: `*${formatTime(startSec)}-${formatTime(endSec)}`,
                startSec,
                endSec,
                name: `clip_${clipNumber}.mp4`,
                hook: hooks[(clipNumber - 1) % hooks.length]
            });
        }

        let lastErrorMsg = "";
        
        // Run sequentially to prevent out-of-memory crashes on free-tier servers
        for (const range of timeRanges) {
            const clip = await new Promise((resolve) => {
                const outputPath = path.join(clipsDir, range.name);
                console.log(`Downloading ${range.name} for range ${range.start}...`);
                
                const dlArgs = [
                    url,
                    '--ffmpeg-location', FFMPEG_BIN,
                    '--download-sections', range.start,
                    '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                    ...ytDlpBaseArgs,
                    '-o', outputPath
                ];
                const process = spawn(YTDLP_BIN, dlArgs);
                
                let processError = "";
                process.stdout.on('data', d => console.log(`[${range.name} stdout]: ${d}`));
                process.stderr.on('data', d => {
                    const errStr = d.toString();
                    console.error(`[${range.name} stderr]: ${errStr}`);
                    processError += errStr;
                });

                process.on('error', (err) => {
                    console.error('Error spawning yt-dlp for download:', err);
                    lastErrorMsg = err.toString();
                    resolve(null);
                });

                process.on('close', (code) => {
                    if (code === 0) {
                        const clipSubs = subtitles
                            .filter(s => s.start >= range.startSec && s.start <= range.endSec)
                            .map(s => ({
                                start: s.start - range.startSec,
                                end: s.end - range.startSec,
                                text: s.text
                            }));
                            
                        resolve({
                            url: `/clips/${range.name}`,
                            hook: range.hook,
                            score: Math.floor(Math.random() * 10) + 90,
                            subtitles: clipSubs
                        });
                    } else {
                        console.log(`Failed to process ${range.name}`);
                        if (processError && !lastErrorMsg) lastErrorMsg = processError;
                        resolve(null);
                    }
                });
            });
            
            if (clip) {
                clips.push(clip);
            }
        }

        if (clips.length === 0) {
             jobs.set(jobId, { status: 'error', error: `Failed to generate clips. Error: ${lastErrorMsg.substring(0, 200)}` });
             return;
        }

        jobs.set(jobId, { status: 'completed', clips });
    } catch (error) {
        console.error(`Job ${jobId} failed:`, error);
        jobs.set(jobId, { status: 'error', error: 'Internal server error' });
    }
    })();
});

app.get('/api/status/:jobId', (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
});

app.post('/api/download', async (req, res) => {
    const { clipUrl, ratio } = req.body;
    if (!clipUrl || !ratio) return res.status(400).json({ error: 'Missing clipUrl or ratio' });

    const filename = clipUrl.split('/').pop();
    const inputPath = path.join(clipsDir, filename);
    if (!fs.existsSync(inputPath)) return res.status(404).json({ error: 'Clip not found' });

    const safeRatio = ratio.replace(':', 'x');
    const outputName = filename.replace('.mp4', `_${safeRatio}.mp4`);
    const outputPath = path.join(clipsDir, outputName);

    // Return immediately if already processed
    if (fs.existsSync(outputPath)) {
        return res.json({ downloadUrl: `/clips/${outputName}` });
    }

    let filter = '';
    if (ratio === '9:16') filter = 'crop=ih*9/16:ih';
    else if (ratio === '1:1') filter = 'crop=ih:ih';
    else if (ratio === '4:3') filter = 'crop=ih*4/3:ih';
    else if (ratio === '3:4') filter = 'crop=ih*3/4:ih';

    const args = ['-y', '-i', inputPath];

    if (filter) {
        args.push('-vf', filter, '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'copy');
    } else {
        // 16:9 is original, just copy
        args.push('-c', 'copy');
    }
    args.push(outputPath);

    console.log(`Cropping ${filename} to ${ratio}...`);
    const ffmpegProc = spawn(FFMPEG_BIN, args);
    ffmpegProc.stdout.on('data', d => console.log(`[ffmpeg stdout]: ${d}`));
    ffmpegProc.stderr.on('data', d => console.error(`[ffmpeg stderr]: ${d}`));
    
    ffmpegProc.on('error', (err) => {
        console.error('Error spawning ffmpeg:', err);
        res.status(500).json({ error: 'Failed to start ffmpeg' });
    });
    
    ffmpegProc.on('close', (code) => {
        if (code === 0) {
            res.json({ downloadUrl: `/clips/${outputName}` });
        } else {
            console.error(`FFmpeg crop failed with code ${code}`);
            res.status(500).json({ error: 'Failed to crop video' });
        }
    });
});

// Fallback to React app
app.use((req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`Make sure you have run setup.js to download yt-dlp and ffmpeg!`);
});
