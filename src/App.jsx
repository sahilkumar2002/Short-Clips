import React, { useState, useRef, useEffect } from 'react';
import { Video, Loader2, Sparkles, Wand2, Subtitles, CheckCircle2, Clock, Lock, Upload } from 'lucide-react';
import './index.css';

const CaptionVideo = ({ clip }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [showSubtitles, setShowSubtitles] = useState(true);
  
  // Use real auto-generated subtitles from backend
  const subtitles = clip.subtitles && clip.subtitles.length > 0 ? clip.subtitles : [];

  // Helper to highlight random words for the "Opus" look
  const highlightText = (text) => {
    const words = text.split(' ');
    if (words.length > 2) {
      const idx = Math.floor(Math.random() * words.length);
      words[idx] = `<span class='highlight'>${words[idx]}</span>`;
    }
    return words.join(' ');
  };

  const currentSub = subtitles.find(s => currentTime >= s.start && currentTime < s.end);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <video 
        src={clip.url.startsWith('http') ? clip.url : (window.location.hostname === 'localhost' ? `http://localhost:3001${clip.url}` : clip.url)} 
        controls
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
      ></video>
      <button 
        onClick={() => setShowSubtitles(!showSubtitles)}
        style={{
          position: 'absolute', top: '10px', right: '10px', zIndex: 20,
          background: 'rgba(0,0,0,0.6)', color: showSubtitles ? '#4ADE80' : '#fff',
          border: showSubtitles ? '1px solid #4ADE80' : '1px solid #fff',
          borderRadius: '8px', padding: '0.4rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
        title="Toggle Subtitles"
      >
        <Subtitles size={20} />
      </button>
      {showSubtitles && currentSub && (
        <div 
          key={currentSub.text} 
          className="animated-caption" 
          dangerouslySetInnerHTML={{ __html: highlightText(currentSub.text) }} 
        />
      )}
    </div>
  );
}

const ClipCard = ({ clip, index }) => {
  const ratios = ['9:16', '16:9', '4:3', '1:1', '3:4'];
  const [ratio, setRatio] = useState('9:16');
  const [isDownloading, setIsDownloading] = useState(false);

  const getAspectRatioString = (r) => r.replace(':', '/');

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clipUrl: clip.url, ratio })
      });
      const data = await response.json();
      if (data.downloadUrl) {
         const a = document.createElement('a');
         a.href = data.downloadUrl;
         a.download = `clip_${index + 1}_${ratio.replace(':','x')}.mp4`;
         a.click();
      } else {
         alert(data.error || 'Download failed');
      }
    } catch (e) {
       alert('Failed to connect to download server.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--panel-bg)',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid var(--border-color)',
      textAlign: 'left'
    }}>
      <div style={{
        aspectRatio: getAspectRatioString(ratio),
        backgroundColor: '#000',
        position: 'relative',
        transition: 'aspect-ratio 0.3s ease'
      }}>
         <div style={{
            position: 'absolute', top: '1rem', left: '1rem', zIndex: 10,
            background: 'rgba(0,0,0,0.6)', padding: '0.2rem 0.6rem',
            borderRadius: '999px', fontSize: '0.8rem', fontWeight: 'bold',
            color: '#4ADE80', border: '1px solid #4ADE80'
         }}>{clip.score} Score</div>
         <CaptionVideo clip={clip} />
      </div>
      <div style={{padding: '1.5rem'}}>
        <h3 style={{fontSize: '1.2rem', marginBottom: '0.5rem'}}>Viral Hook #{index + 1}</h3>
        <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem'}}>
          "{clip.hook}"
        </p>
        
        <div style={{display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap'}}>
          {ratios.map(r => (
            <button 
              key={r}
              onClick={() => setRatio(r)}
              style={{
                background: ratio === r ? '#4ADE80' : 'rgba(255,255,255,0.1)',
                color: ratio === r ? '#000' : '#fff',
                border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold'
              }}
            >
              {r}
            </button>
          ))}
        </div>

        <button 
          className="btn btn-secondary" 
          style={{width: '100%'}} 
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? <><Loader2 size={16} className="spin" style={{display:'inline', marginRight:'8px'}} /> Processing Crop...</> : `Download HD (${ratio})`}
        </button>
      </div>
    </div>
  );
}

function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [step, setStep] = useState(0); // 0: input, 1: processing, 2: result
  const [error, setError] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const fileInputRef = useRef(null);

  const [clips, setClips] = useState([]);

  const pollStatus = async (jobId, onComplete) => {
    try {
      const response = await fetch(`/api/status/${jobId}`);
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      
      if (data.status === 'completed') {
        onComplete(data.clips);
      } else if (data.status === 'error') {
        setError(data.error || 'An error occurred during processing.');
        setStep(0);
        setIsProcessing(false);
        setIsGeneratingMore(false);
      } else {
        // still processing
        setTimeout(() => pollStatus(jobId, onComplete), 3000);
      }
    } catch (err) {
      // If network fails, keep trying (server might be rebooting or unreachable briefly)
      setTimeout(() => pollStatus(jobId, onComplete), 3000);
    }
  };

  const handleGetClips = async () => {
    if (!videoUrl) return;
    if (!accessCode) {
      setError('Please enter the access code to use this generator.');
      return;
    }
    setStep(1);
    setIsProcessing(true);
    setError('');
    
    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl, offset: 0, accessCode })
      });
      
      const data = await response.json();
      if (data.jobId) {
        pollStatus(data.jobId, (newClips) => {
          setClips(newClips);
          setStep(2);
          setIsProcessing(false);
        });
      } else {
        setError(data.error || 'Failed to start processing job');
        setStep(0);
        setIsProcessing(false);
      }
    } catch (err) {
      setError('Failed to connect to backend server. Make sure it is running.');
      setStep(0);
      setIsProcessing(false);
    }
  };

  const handleCreateMore = async () => {
    setIsGeneratingMore(true);
    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl, offset: clips.length })
      });
      
      const data = await response.json();
      if (data.jobId) {
        pollStatus(data.jobId, (newClips) => {
          setClips(prev => [...prev, ...newClips]);
          setIsGeneratingMore(false);
        });
      } else {
        alert(data.error || 'Failed to start processing job');
        setIsGeneratingMore(false);
      }
    } catch (err) {
      alert('Failed to connect to backend server.');
      setIsGeneratingMore(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!accessCode) {
      setError('Please enter the access code before uploading.');
      return;
    }

    setStep(1);
    setIsProcessing(true);
    setError('');

    const formData = new FormData();
    formData.append('video', file);
    formData.append('accessCode', accessCode);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (data.jobId) {
        pollStatus(data.jobId, (newClips) => {
          setClips(newClips);
          setStep(2);
          setIsProcessing(false);
        });
      } else {
        setError(data.error || 'Failed to upload video');
        setStep(0);
        setIsProcessing(false);
      }
    } catch (err) {
      setError('Failed to connect to backend server for upload.');
      setStep(0);
      setIsProcessing(false);
    }
  };

  return (
    <div className="app-container">
      <nav className="top-nav">
        <div className="logo flex items-center gap-2">
          <Sparkles className="text-white" size={24} />
          <span>ClipGenius</span>
        </div>
        <div className="nav-actions">
          <button className="btn btn-secondary mr-4" style={{border: 'none'}}>Pricing</button>
          <button className="btn btn-secondary mr-4" style={{border: 'none'}}>Login</button>
          <button className="btn btn-primary" style={{padding: '0.5rem 1rem', fontSize: '0.9rem'}}>Sign up</button>
        </div>
      </nav>

      <main className="main-content">
        {step === 0 && (
          <div className="animate-slide-up" style={{maxWidth: '800px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <h1>1 long video, 10 viral clips.</h1>
            <p className="subtitle">
              Create 10 viral clips from 1 long video in minutes, 10x faster.
            </p>
            
            {error && (
              <div style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid #ef4444' }}>
                {error}
              </div>
            )}
            
            <div className="input-container" style={{ marginBottom: '1rem', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              <Lock className="input-icon" size={20} style={{ marginLeft: '10px' }} />
              <input 
                type="password" 
                placeholder="Enter Access Code..." 
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'white', padding: '10px', width: '100%', outline: 'none' }}
              />
            </div>

            <div className="input-container">
              <Video className="input-icon" size={24} />
              <input 
                type="text" 
                placeholder="Drop a video link..." 
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGetClips()}
              />
              <button className="btn btn-primary" onClick={handleGetClips}>
                <Wand2 size={18} /> Get free clips
              </button>
            </div>

            <div className="mt-8 text-sm text-secondary" style={{marginTop: '1.5rem', color: 'var(--text-secondary)'}}>
              or <span onClick={() => fileInputRef.current?.click()} style={{textDecoration: 'underline', cursor: 'pointer', color: 'white'}}>Upload local file</span>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="video/mp4,video/x-m4v,video/*" 
                style={{ display: 'none' }} 
              />
            </div>

            {/* Removed platform icons as lucide-react lacks them */}
          </div>
        )}

        {step === 1 && (
          <div className="animate-slide-up flex flex-col items-center" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{
              width: '80px', height: '80px', 
              borderRadius: '50%', 
              background: 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '2rem'
            }}>
              <Loader2 size={40} className="text-white" style={{animation: 'spin 2s linear infinite'}} />
            </div>
            <h2 style={{fontSize: '2rem', marginBottom: '1rem'}}>Analyzing Video...</h2>
            <p className="subtitle" style={{marginBottom: '0'}}>
              Our AI is finding the most viral hooks and generating subtitles.
            </p>
            <p style={{color: '#666', marginTop: '0.5rem'}}>This usually takes about a minute.</p>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up" style={{width: '100%', maxWidth: '1000px'}}>
             <h2 style={{fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'left'}}>Your Viral Clips</h2>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem'}}>
                {clips.map((clip, index) => (
                  <ClipCard key={index} clip={clip} index={index} />
                ))}
             </div>
             <div style={{marginTop: '3rem'}}>
               <button className="btn btn-secondary" onClick={handleCreateMore} disabled={isGeneratingMore}>
                 {isGeneratingMore ? <><Loader2 size={18} className="spin" style={{display:'inline', marginRight:'8px'}} /> Generating...</> : "Create more clips"}
               </button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
