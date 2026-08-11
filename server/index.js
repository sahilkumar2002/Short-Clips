const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
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

const YTDLP_BIN = path.join(__dirname, 'bin', 'yt-dlp.exe');
const FFMPEG_BIN = path.join(__dirname, 'bin', 'ffmpeg.exe');

app.post('/api/process', async (req, res) => {
    const { url, offset = 0 } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        console.log(`Processing video: ${url}`);
        
        // Clean up old clips only on first generation
        if (offset === 0) {
            fs.readdirSync(clipsDir).forEach(file => {
                if (file.endsWith('.mp4') || file.endsWith('.vtt')) {
                    fs.unlinkSync(path.join(clipsDir, file));
                }
            });
        }

        const clips = [];
        
        // 1. Download subtitles first
        console.log("Fetching auto-subtitles...");
        const subsPath = path.join(clipsDir, 'subtitles');
        await new Promise((resolve) => {
            const subProcess = spawn(YTDLP_BIN, [
                url,
                '--write-auto-subs',
                '--sub-format', 'vtt',
                '--sub-langs', 'en',
                '--skip-download',
                '-o', subsPath
            ]);
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

        const downloadPromises = timeRanges.map(range => {
            return new Promise((resolve) => {
                const outputPath = path.join(clipsDir, range.name);
                console.log(`Downloading ${range.name} for range ${range.start}...`);
                
                const process = spawn(YTDLP_BIN, [
                    url,
                    '--ffmpeg-location', FFMPEG_BIN,
                    '--download-sections', range.start,
                    '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best',
                    '-o', outputPath
                ]);

                process.on('close', (code) => {
                    if (code === 0) {
                        // filter subtitles for this clip
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
                        resolve(null);
                    }
                });
            });
        });

        const results = await Promise.all(downloadPromises);
        results.forEach(clip => {
            if (clip) clips.push(clip);
        });

        if (clips.length === 0) {
             return res.status(500).json({ error: 'Failed to generate clips. Make sure the video is long enough.' });
        }

        res.json({ clips });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
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
    
    ffmpegProc.on('close', (code) => {
        if (code === 0) {
            res.json({ downloadUrl: `/clips/${outputName}` });
        } else {
            console.error(`FFmpeg crop failed with code ${code}`);
            res.status(500).json({ error: 'Failed to crop video' });
        }
    });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`Make sure you have run setup.js to download yt-dlp and ffmpeg!`);
});
