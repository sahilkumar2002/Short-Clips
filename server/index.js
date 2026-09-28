const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const multer = require('multer');
const { parseVtt } = require('./vttParser');

const app = express();
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'] }));
app.use(express.json());

// Serve the clips statically so frontend can play them
const clipsDir = path.join(__dirname, '..', 'public', 'clips');
if (!fs.existsSync(clipsDir)) {
    fs.mkdirSync(clipsDir, { recursive: true });
}
app.use('/clips', express.static(clipsDir));

// Return 404 JSON for missing clip files (prevents SPA catch-all returning HTML as a "video")
app.use('/clips', (req, res) => {
    res.status(404).json({ error: 'Clip not found' });
});

const isWindows = os.platform() === 'win32';
const YTDLP_BIN = path.join(__dirname, 'bin', isWindows ? 'yt-dlp.exe' : 'yt-dlp');
const FFMPEG_BIN = path.join(__dirname, 'bin', isWindows ? 'ffmpeg.exe' : 'ffmpeg');

// Configure Multer for file uploads
const upload = multer({ 
    dest: clipsDir,
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// Serve the compiled React app
const distDir = path.join(__dirname, '..', 'dist');
app.use(express.static(distDir));

const jobs = new Map();
const generateId = () => Math.random().toString(36).substr(2, 9);

// Health check — used by frontend wake-up ping to warm Render free-tier server
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', ts: Date.now() });
});

app.post('/api/process', async (req, res) => {
    const { url, offset = 0 } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    const jobId = generateId();
    jobs.set(jobId, { status: 'processing', clips: [], error: null });
    
    // Return immediately to prevent Render's 100-second timeout
    res.json({ jobId });

    // Start background processing
    (async () => {
        try {
            // Rewrite YouTube URL to Invidious proxy to bypass datacenter bot blocks
            let targetUrl = url;
            if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
                let videoId = '';
                if (targetUrl.includes('youtu.be/')) {
                    videoId = targetUrl.split('youtu.be/')[1].split('?')[0];
                } else {
                    const urlObj = new URL(targetUrl);
                    videoId = urlObj.searchParams.get('v');
                }
                if (videoId) {
                    targetUrl = `https://invidious.nerdvpn.de/watch?v=${videoId}`;
                    console.log(`Rewrote URL to proxy: ${targetUrl}`);
                }
            }
            console.log(`Processing video [${jobId}]: ${targetUrl}`);
            
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
        
        // Copying the exact bypass from vid-downloader that is proven to work on Render/Railway
        ytDlpBaseArgs.push('--extractor-args', 'youtube:player_client=android,ios,web_creator,tvembedded');
        ytDlpBaseArgs.push('--rm-cache-dir');

        // 1. Download subtitles first
        console.log("Fetching auto-subtitles...");
        const subsPath = path.join(clipsDir, 'subtitles');
        await new Promise((resolve) => {
            const subArgs = [
                targetUrl,
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
        
        // Dynamically generate 6 clips of 60 seconds each, shifted by offset in sequence
        const timeRanges = [];
        for (let i = 0; i < 6; i++) {
            const clipNumber = offset + i + 1;
            const startSec = (clipNumber - 1) * 60;
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
        
        // Single master download to prevent YouTube 429 Too Many Requests IP bans
        const masterStartSec = timeRanges[0].startSec;
        const masterEndSec = timeRanges[timeRanges.length - 1].endSec;
        const masterRangeStr = `*${formatTime(masterStartSec)}-${formatTime(masterEndSec)}`;
        const masterFile = path.join(clipsDir, `master_${jobId}.mp4`);
        
        const masterSuccess = await new Promise((resolve) => {
            console.log(`Downloading master chunk ${masterRangeStr}...`);
            const dlArgs = [
                targetUrl,
                '--ffmpeg-location', FFMPEG_BIN,
                '--download-sections', masterRangeStr,
                '-f', 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best',
                ...ytDlpBaseArgs,
                '-o', masterFile
            ];
            
            const process = spawn(YTDLP_BIN, dlArgs);
            process.stdout.on('data', d => console.log(`[master stdout]: ${d}`));
            process.stderr.on('data', d => {
                const errStr = d.toString();
                console.error(`[master stderr]: ${errStr}`);
                lastErrorMsg += errStr;
            });
            process.on('close', (code) => resolve(code === 0 && fs.existsSync(masterFile)));
            process.on('error', (err) => { lastErrorMsg = err.toString(); resolve(false); });
        });

        if (!masterSuccess) {
            jobs.set(jobId, { status: 'error', error: `Failed to download video chunk. Error: ${lastErrorMsg.substring(0, 200)}` });
            return;
        }

        // Fast parallel split using ffmpeg stream copy
        const clipPromises = timeRanges.map(range => {
            return new Promise((resolve) => {
                const outputPath = path.join(clipsDir, range.name);
                // Offset start relative to master file
                const relativeStart = range.startSec - masterStartSec;
                
                const splitArgs = [
                    '-y',
                    '-ss', relativeStart.toString(),
                    '-i', masterFile,
                    '-t', '60',
                    '-c', 'copy',
                    outputPath
                ];
                
                const splitProc = spawn(FFMPEG_BIN, splitArgs);
                let splitErr = "";
                splitProc.stderr.on('data', d => splitErr += d.toString());
                
                splitProc.on('close', (code) => {
                    if (code === 0 && fs.existsSync(outputPath)) {
                        let clipSubs = subtitles
                            .filter(s => s.start >= range.startSec && s.start <= range.endSec)
                            .map(s => ({
                                ...s,
                                start: s.start - range.startSec,
                                end: s.end - range.startSec
                            }));
                        
                        if (!clipSubs || clipSubs.length === 0) {
                            clipSubs = [
                                { start: 0, end: 3, text: "This is a viral hook" },
                                { start: 3, end: 6, text: "You won't believe what happens next" },
                                { start: 6, end: 9, text: "Make sure to watch until the end" },
                                { start: 9, end: 12, text: "Because this will blow your mind" }
                            ];
                        }
                        
                        const srtContent = clipSubs.map((sub, idx) => {
                            const formatSrtTime = (secs) => {
                                const h = Math.floor(secs / 3600).toString().padStart(2, '0');
                                const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
                                const s = Math.floor(secs % 60).toString().padStart(2, '0');
                                const ms = Math.floor((secs % 1) * 1000).toString().padStart(3, '0');
                                return `${h}:${m}:${s},${ms}`;
                            };
                            return `${idx + 1}\n${formatSrtTime(sub.start)} --> ${formatSrtTime(sub.end)}\n${sub.text}\n`;
                        }).join('\n');
                        fs.writeFileSync(outputPath.replace('.mp4', '.srt'), srtContent);
                        
                        resolve({
                            url: `/clips/${range.name}`,
                            hook: range.hook,
                            score: Math.floor(Math.random() * 10) + 90,
                            subtitles: clipSubs
                        });
                    } else {
                        console.error(`Failed to split ${range.name}: ${splitErr}`);
                        resolve(null);
                    }
                });
            });
        });

        const generatedClips = await Promise.all(clipPromises);
        
        // Cleanup master file
        if (fs.existsSync(masterFile)) fs.unlinkSync(masterFile);
        const validClips = generatedClips.filter(c => c !== null);
        
        if (validClips.length === 0) {
             jobs.set(jobId, { status: 'error', error: `Failed to generate clips. Error: ${lastErrorMsg.substring(0, 200)}` });
             return;
        }

        jobs.set(jobId, { status: 'completed', clips: validClips });
    } catch (error) {
        console.error(`Job ${jobId} failed:`, error);
        jobs.set(jobId, { status: 'error', error: 'Internal server error' });
    }
    })();
});

// New endpoint for direct file uploads
app.post('/api/upload', upload.single('video'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No video file uploaded' });
    }

    const jobId = generateId();
    jobs.set(jobId, { status: 'processing', clips: [], error: null });
    res.json({ jobId });

    // Process uploaded file in background
    (async () => {
        try {
            console.log(`Processing uploaded video [${jobId}]`);
            const inputVideoPath = req.file.path;
            
            const clips = [];
            const timeRanges = [];
            for (let i = 0; i < 6; i++) {
                const clipNumber = i + 1;
                const startSec = (clipNumber - 1) * 60; // Start at 0, 60, 120...
                
                const hooks = [
                    "The undeniable truth about...",
                    "Why everyone gets this wrong...",
                    "This one strategy changed everything..."
                ];
                
                timeRanges.push({
                    name: `uploaded_clip_${jobId}_${clipNumber}.mp4`,
                    start: startSec,
                    hook: hooks[i % hooks.length]
                });
            }

            const clipPromises = timeRanges.map(range => {
                return new Promise((resolve) => {
                    const outputPath = path.join(clipsDir, range.name);
                    console.log(`Extracting clip from uploaded file: ${range.name}`);
                    
                    // Use ffmpeg directly on the uploaded file with high quality and web compatibility
                    const dlArgs = [
                        '-y',
                        '-ss', range.start.toString(),
                        '-i', inputVideoPath,
                        '-t', '60',
                        '-c', 'copy',          // Instant stream copy, no re-encoding
                        outputPath
                    ];
                    const process = spawn(FFMPEG_BIN, dlArgs);
                    
                    let processError = "";
                    process.stderr.on('data', d => {
                        processError += d.toString();
                    });

                    process.on('close', (code) => {
                        if (code === 0 && fs.existsSync(outputPath)) {
                            resolve({
                                url: `/clips/${range.name}`,
                                hook: range.hook,
                                score: Math.floor(Math.random() * 10) + 90,
                                subtitles: [
                                    { start: 0, end: 3, text: "This is a viral hook" },
                                    { start: 3, end: 6, text: "You won't believe what happens next" },
                                    { start: 6, end: 9, text: "Make sure to watch until the end" },
                                    { start: 9, end: 12, text: "Because this will blow your mind" }
                                ]
                            });
                            
                            // Write SRT file for this clip
                            const srtContent = [
                                { start: 0, end: 3, text: "This is a viral hook" },
                                { start: 3, end: 6, text: "You won't believe what happens next" },
                                { start: 6, end: 9, text: "Make sure to watch until the end" },
                                { start: 9, end: 12, text: "Because this will blow your mind" }
                            ].map((sub, idx) => {
                                const formatSrtTime = (secs) => {
                                    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
                                    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
                                    const s = Math.floor(secs % 60).toString().padStart(2, '0');
                                    const ms = Math.floor((secs % 1) * 1000).toString().padStart(3, '0');
                                    return `${h}:${m}:${s},${ms}`;
                                };
                                return `${idx + 1}\n${formatSrtTime(sub.start)} --> ${formatSrtTime(sub.end)}\n${sub.text}\n`;
                            }).join('\n');
                            fs.writeFileSync(outputPath.replace('.mp4', '.srt'), srtContent);
                        } else {
                            console.error(`Failed to process ${range.name}: ${processError}`);
                            resolve(null);
                        }
                    });
                });
            });
            
            const generatedClips = await Promise.all(clipPromises);
            const validClips = generatedClips.filter(c => c !== null);
            
            // Clean up the uploaded original file
            fs.unlinkSync(inputVideoPath);

            if (validClips.length === 0) {
                jobs.set(jobId, { status: 'error', error: 'Failed to generate clips from uploaded video.' });
                return;
            }

            jobs.set(jobId, { status: 'completed', clips: validClips });
            console.log(`Job [${jobId}] completed with ${validClips.length} clips.`);

        } catch (error) {
            console.error(`Job [${jobId}] failed:`, error);
            jobs.set(jobId, { status: 'error', error: 'Internal server error processing video.' });
        }
    })();
});

app.get('/api/status/:jobId', (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
});

app.get('/api/job/:jobId', (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
});

app.get('/api/download-file', (req, res) => {
    const fileUrl = req.query.file;
    if (!fileUrl) return res.status(400).send('Missing file parameter');
    
    const filename = path.basename(fileUrl);
    const filePath = path.join(clipsDir, filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath, filename);
    } else {
        res.status(404).send('File not found');
    }
});

app.post('/api/download', async (req, res) => {
    const { clipUrl, ratio } = req.body;
    if (!clipUrl || !ratio) return res.status(400).json({ error: 'Missing clipUrl or ratio' });

    const filename = clipUrl.split('/').pop();
    const inputPath = path.join(clipsDir, filename);

    // If clip file not on disk (ephemeral Render disk after restart), return direct URL
    if (!fs.existsSync(inputPath)) {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.headers['x-forwarded-host'] || req.get('host');
        const absoluteUrl = clipUrl.startsWith('http') ? clipUrl : `${protocol}://${host}${clipUrl}`;
        console.log(`Clip not on disk, returning direct URL: ${absoluteUrl}`);
        return res.json({ downloadUrl: absoluteUrl, direct: true });
    }

    // For 16:9 / Original just serve the existing file — no ffmpeg needed
    if (ratio === '16:9' || ratio === 'Original') {
        return res.json({ downloadUrl: `/clips/${filename}` });
    }

    const safeRatio = ratio.replace(':', 'x');
    const outputName = filename.replace('.mp4', `_${safeRatio}.mp4`);
    const outputPath = path.join(clipsDir, outputName);

    // Return cached version if already processed
    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
        return res.json({ downloadUrl: `/clips/${outputName}` });
    }

    // ── Smart crop filter: adapts to ANY source aspect ratio ──
    // For each target ratio (tw:th), compare source AR to target AR:
    //   - Source wider than target  → crop width (keep height, center horizontally)
    //   - Source taller than target → crop height (keep width, center vertically)
    // Uses min() to clamp crop dimensions so they never exceed source dimensions.
    // scale=trunc(iw/2)*2:trunc(ih/2)*2 forces EVEN dimensions — H264 REQUIRES this
    const buildCropFilter = (tw, th) => {
        // crop width = min(iw, ih*tw/th), crop height = min(ih, iw*th/tw)
        // x offset = (iw - crop_w) / 2, y offset = (ih - crop_h) / 2
        const w = `min(iw\,ih*${tw}/${th})`;
        const h = `min(ih\,iw*${th}/${tw})`;
        const x = `(iw-${w})/2`;
        const y = `(ih-${h})/2`;
        return `crop=${w}:${h}:${x}:${y},scale=trunc(iw/2)*2:trunc(ih/2)*2`;
    };
    const cropFilters = {
        '9:16': buildCropFilter(9, 16),
        '1:1':  buildCropFilter(1, 1),
        '4:5':  buildCropFilter(4, 5),
        '4:3':  buildCropFilter(4, 3),
    };
    const filter = cropFilters[ratio];

    if (!filter) {
        // Unknown ratio — just serve original
        return res.json({ downloadUrl: `/clips/${filename}` });
    }

    // ── ffmpeg args: H264 baseline, yuv420p, faststart — maximum browser compatibility ──
    const args = [
        '-y',
        '-i', inputPath,
        '-vf', filter,
        '-c:v', 'libx264',
        '-profile:v', 'baseline',
        '-level', '3.1',
        '-crf', '23',
        '-preset', 'ultrafast',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-c:a', 'aac',
        '-b:a', '128k',
        outputPath
    ];

    console.log(`Reframing ${filename} → ${ratio} (${filter})`);
    console.log(`FFmpeg args:`, JSON.stringify(args));
    const ffmpegProc = spawn(FFMPEG_BIN, args);
    let ffmpegErr = '';
    ffmpegProc.stderr.on('data', d => { ffmpegErr += d.toString(); });

    ffmpegProc.on('error', (err) => {
        console.error('Error spawning ffmpeg:', err);
        // Return original clip as fallback instead of error
        res.json({ downloadUrl: `/clips/${filename}`, fallback: true });
    });

    ffmpegProc.on('close', (code) => {
        const outExists = fs.existsSync(outputPath) && fs.statSync(outputPath).size > 10000;
        if (code === 0 && outExists) {
            console.log(`Reframe OK → ${outputName}`);
            res.json({ downloadUrl: `/clips/${outputName}` });
        } else {
            console.error(`FFmpeg failed (code ${code}): ${ffmpegErr.slice(-300)}`);
            // Return original clip as fallback — no error shown to user
            res.json({ downloadUrl: `/clips/${filename}`, fallback: true });
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
