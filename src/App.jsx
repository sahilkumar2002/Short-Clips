import React, { useState, useRef } from 'react';
import { 
  Video, Loader2, Sparkles, Subtitles, UploadCloud, 
  Home, Library, Calendar, Palette, Wallet, Gift, Code, Settings,
  Globe, ChevronDown, Bell, Crown, MessageSquare, MessageCircle,
  PlayCircle, Link, Copy, X, ArrowRight,
  Scissors, Search, Gamepad2, Edit3, FileText, FileAudio, Type, Activity, Crop, Image as ImageIcon, MoreHorizontal
} from 'lucide-react';
import './index.css';

const CaptionVideo = ({ clip }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [showSubtitles, setShowSubtitles] = useState(true);
  
  const subtitles = clip.subtitles && clip.subtitles.length > 0 ? clip.subtitles : [];

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
        src={(clip.url.startsWith('http') ? clip.url : (window.location.hostname === 'localhost' ? `http://localhost:3001${clip.url}` : clip.url)) + '#t=0.001'} 
        controls
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
      ></video>
      <button 
        onClick={() => setShowSubtitles(!showSubtitles)}
        style={{
          position: 'absolute', top: '10px', right: '10px', zIndex: 20,
          background: 'rgba(0,0,0,0.6)', color: showSubtitles ? 'var(--accent-green)' : '#fff',
          border: showSubtitles ? '1px solid var(--accent-green)' : '1px solid #fff',
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
    <div className="clip-card">
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
            color: 'var(--accent-green)', border: '1px solid var(--accent-green)'
         }}>{clip.score} Score</div>
         <CaptionVideo clip={clip} />
      </div>
      <div style={{padding: '1.5rem'}}>
        <h3 style={{fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 600}}>Viral Hook #{index + 1}</h3>
        <p style={{color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem'}}>
          "{clip.hook}"
        </p>
        
        <div style={{display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap'}}>
          {ratios.map(r => (
            <button 
              key={r}
              onClick={() => setRatio(r)}
              style={{
                background: ratio === r ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)',
                color: ratio === r ? '#000' : '#fff',
                border: 'none', borderRadius: '4px', padding: '0.3rem 0.6rem',
                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold'
              }}
            >
              {r}
            </button>
          ))}
        </div>

        <button 
          style={{width: '100%', background: 'var(--sidebar-bg)', color: '#fff', border: '1px solid var(--border-color)', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center'}}
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? <><Loader2 size={16} className="spin" style={{marginRight:'8px'}} /> Processing...</> : `Download (${ratio})`}
        </button>
      </div>
    </div>
  );
}

const LibraryView = () => {
  const projects = [
    {
      id: 1,
      thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      isNew: true,
      expiresIn: '30 days',
      duration: '00:12:13',
      title: 'Demo Project',
      source: 'YouTube • Neal Brennan',
      category: 'AI Clipping'
    },
    {
      id: 2,
      thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      isNew: true,
      expiresIn: '30 days',
      duration: '00:12:53',
      title: 'Demo Project',
      source: 'Twitch',
      category: 'Game Clipping'
    },
    {
      id: 3,
      thumbnail: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      isNew: true,
      expiresIn: '30 days',
      duration: '00:09:42',
      title: 'Demo Project',
      source: 'YouTube • CrashCourse',
      category: 'Video Summary'
    }
  ];

  return (
    <div style={{ padding: '0 2rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="library-nav">
        <div className="library-nav-item active">Video</div>
        <div className="library-nav-item">Favorite</div>
        <div className="library-nav-item">Edited</div>
        <div className="library-nav-item">Exported</div>
      </div>

      <div className="library-search-container">
        <div className="library-search-dropdown">
          All <ChevronDown size={14} />
        </div>
        <div className="library-search-input">
          <input type="text" placeholder="Search library..." />
          <Search size={18} color="var(--text-secondary)" />
        </div>
      </div>

      <div className="library-date-sep">2026-08-25</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {projects.map(proj => (
          <div key={proj.id} className="project-card">
            <div className="project-thumbnail-wrapper">
              <img src={proj.thumbnail} alt={proj.title} />
              {proj.isNew && <div className="project-badge-new">new</div>}
              <div className="project-overlay-bottom">
                <div className="project-expires">Expires in {proj.expiresIn}</div>
                <div className="project-duration">{proj.duration}</div>
              </div>
            </div>
            <div className="project-info">
              <div className="project-title">{proj.title}</div>
              <div className="project-source">{proj.source}</div>
              <div className="project-footer">
                <div className="project-category">{proj.category}</div>
                <MoreHorizontal className="project-menu-btn" size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [videoUrl, setVideoUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [step, setStep] = useState(0); 
  const [clips, setClips] = useState([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const urlInputRef = useRef(null);

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
        setTimeout(() => pollStatus(jobId, onComplete), 3000);
      }
    } catch (err) {
      setTimeout(() => pollStatus(jobId, onComplete), 3000);
    }
  };

  const handleGetClips = async () => {
    if (!videoUrl && !fileInputRef.current?.files?.length) {
      setError('Please paste a video link or upload a file');
      urlInputRef.current?.focus();
      return;
    }
    setStep(1);
    setIsProcessing(true);
    setError('');
    
    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl, offset: 0 })
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

    setStep(1);
    setIsProcessing(true);
    setError('');

    const formData = new FormData();
    formData.append('video', file);

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
    <div className="app-layout">
      
      {/* Banner (matching screenshot) */}
      <div className="top-banner">
        <span className="banner-timer">71 : 55 : 07</span>
        Limited-Time Offer: Get <span className="banner-link">65% OFF</span> and unlock premium access now!
        <button className="btn-secondary" style={{padding: '0.2rem 1rem', borderColor: 'var(--accent-green)', color: 'var(--accent-green)'}}>Upgrade</button>
        <X className="banner-close" size={16} />
      </div>

      <div className="main-body">
        {/* Left Sidebar */}
        <div className="sidebar">
          <div className={`sidebar-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <Home />
            <span>Home</span>
          </div>
          <div className={`sidebar-item ${activeTab === 'library' ? 'active' : ''}`} onClick={() => setActiveTab('library')}>
            <Library />
            <span>Library</span>
          </div>
          <div className="sidebar-item">
            <Calendar />
            <span>Scheduler</span>
          </div>
          <div className="sidebar-item">
            <Palette />
            <span>Brand Kit</span>
          </div>
          <div className="sidebar-item">
            <Wallet />
            <span>Pricing</span>
          </div>
          <div className="sidebar-item">
            <Gift />
            <span>Rewards</span>
          </div>
          <div className="sidebar-item has-badge">
            <Code />
            <span>API</span>
            <span className="badge-new">New</span>
          </div>
          <div className="sidebar-item" style={{marginTop: 'auto'}}>
            <Settings />
            <span>Settings</span>
          </div>
        </div>

        <div className="main-wrapper">
          {/* Topbar */}
          <div className="topbar">
            <div className="topbar-left">
              <div style={{background: 'var(--accent-green)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Video size={20} color="#000" fill="#000" />
              </div>
              WayinVideo
            </div>
            
            <div className="topbar-center">
              <div className="topbar-center-item" style={{position: 'relative'}}>
                <Sparkles size={16} /> Skills
                <span className="badge-new" style={{top: '-12px', right: '-10px'}}>New</span>
              </div>
              <div className="topbar-center-item">
                <Globe size={16} /> English <ChevronDown size={14} />
              </div>
              <div className="topbar-center-item">
                Tools <ChevronDown size={14} />
              </div>
              <div className="topbar-center-item" style={{position: 'relative'}}>
                API
                <span className="badge-new" style={{top: '-12px', right: '-10px'}}>New</span>
              </div>
              <div className="topbar-center-item">
                <MessageSquare size={16} /> Discord
              </div>
            </div>

            <div className="topbar-right">
              <div className="icon-btn"><Bell size={18} /></div>
              <div className="icon-btn" style={{background: '#333'}}>S</div>
              <button className="btn-upgrade">
                <Crown size={16} fill="#000" /> 65% OFF Upgrade
              </button>
            </div>
          </div>

          {/* Main Scrollable Content */}
          <div className="main-scroll-area">
            {activeTab === 'library' ? (
              <div className="animate-slide-up">
                <LibraryView />
              </div>
            ) : (
              <>
                {step === 0 && (
                  <div className="animate-slide-up" style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                
                <h1 className="hero-title">
                  <span className="gradient-text">Discover, Create, Share</span>
                </h1>
                <h2 className="hero-subtitle">
                  Cherish Every Moment
                </h2>
                
                {error && (
                  <div style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid #ef4444' }}>
                    {error}
                  </div>
                )}

                <div className="search-wrapper">
                  <div className="search-input-container">
                    <input 
                      ref={urlInputRef}
                      type="text" 
                      placeholder="Paste a video link or upload to generate AI subtitles" 
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGetClips()}
                    />
                    <button className="btn-arrow" onClick={handleGetClips}>
                      <ArrowRight size={24} />
                    </button>
                  </div>

                  <div className="action-pills">
                    <div className="pill-btn" onClick={() => fileInputRef.current?.click()}>
                      <UploadCloud size={16} /> Upload
                    </div>
                    <div className="pill-btn">
                      <PlayCircle size={16} /> YouTube Video Link
                    </div>
                    <div className="pill-btn">
                      <Link size={16} /> Other Links
                    </div>
                    <div className="pill-btn">
                      <Copy size={16} /> Bulk Import
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept="video/mp4,video/x-m4v,video/*" 
                      style={{ display: 'none' }} 
                    />
                  </div>
                </div>

                {/* Tools Grid matching screenshot */}
                <div className="tools-grid">
                  <div className="tool-card" onClick={handleGetClips}>
                    <Scissors size={32} />
                    <span className="tool-card-title">AI Clipping</span>
                  </div>
                  <div className="tool-card tool-card-highlighted">
                    <Search size={32} color="var(--accent-green)" />
                    <span className="tool-card-title">Find Moments</span>
                  </div>
                  <div className="tool-card">
                    <span className="tool-badge">New</span>
                    <Gamepad2 size={32} />
                    <span className="tool-card-title">Game Clipping</span>
                  </div>
                  <div className="tool-card">
                    <Video size={32} />
                    <span className="tool-card-title">AI Video</span>
                  </div>
                  
                  <div className="tool-card">
                    <span className="tool-badge">New</span>
                    <Edit3 size={32} />
                    <span className="tool-card-title">Video Editor</span>
                  </div>
                  <div className="tool-card">
                    <FileText size={32} />
                    <span className="tool-card-title">Video Summary</span>
                  </div>
                  <div className="tool-card">
                    <span className="tool-badge free">Free</span>
                    <FileAudio size={32} />
                    <span className="tool-card-title">Video Transcripts</span>
                  </div>
                  <div className="tool-card">
                    <span className="tool-badge free">Free</span>
                    <Type size={32} />
                    <span className="tool-card-title">AI Subtitles</span>
                  </div>
                  
                  <div className="tool-card">
                    <span className="tool-badge">New</span>
                    <Activity size={32} />
                    <span className="tool-card-title">Speech Enhancer</span>
                  </div>
                  <div className="tool-card">
                    <span className="tool-badge free">Free</span>
                    <Crop size={32} />
                    <span className="tool-card-title">AI Reframe</span>
                  </div>
                  <div className="tool-card">
                    <span className="tool-badge">New</span>
                    <ImageIcon size={32} />
                    <span className="tool-card-title">AI Thumbnail</span>
                  </div>
                  <div className="tool-card">
                    <Sparkles size={32} />
                    <span className="tool-card-title">AI Hook</span>
                  </div>
                </div>

              </div>
            )}

            {step === 1 && (
              <div className="animate-slide-up flex flex-col items-center" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '4rem'}}>
                <div style={{
                  width: '80px', height: '80px', 
                  borderRadius: '50%', 
                  background: 'rgba(30, 215, 96, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '2rem'
                }}>
                  <Loader2 size={40} className="text-white" style={{animation: 'spin 2s linear infinite', color: 'var(--accent-green)'}} />
                </div>
                <h2 style={{fontSize: '2rem', marginBottom: '1rem', color: '#fff'}}>Analyzing Video...</h2>
                <p style={{color: 'var(--text-secondary)'}}>
                  Our AI is finding the most viral hooks and generating subtitles.
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="animate-slide-up" style={{width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '2rem'}}>
                 <h2 style={{fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'left', color: '#fff'}}>Your Viral Clips</h2>
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem'}}>
                    {clips.map((clip, index) => (
                      <ClipCard key={index} clip={clip} index={index} />
                    ))}
                 </div>
                 {videoUrl && (
                   <div style={{marginTop: '3rem', display: 'flex', justifyContent: 'center'}}>
                     <button className="btn-secondary" style={{padding: '0.8rem 2rem', background: 'var(--panel-bg)'}} onClick={handleCreateMore} disabled={isGeneratingMore}>
                       {isGeneratingMore ? <><Loader2 size={18} className="spin" style={{display:'inline', marginRight:'8px'}} /> Generating...</> : "Create more clips"}
                     </button>
                   </div>
                 )}
              </div>
            )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Floating Chat Bubble */}
      <div className="chat-bubble">
        <MessageCircle size={24} color="#fff" />
      </div>
    </div>
  );
}

export default App;
