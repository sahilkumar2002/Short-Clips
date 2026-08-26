import React, { useState, useRef } from 'react';
import { 
  Video, Loader2, Sparkles, Subtitles, UploadCloud, 
  Home, Library, Calendar, Palette, Wallet, Gift, Code, Settings,
  Globe, ChevronDown, Bell, Crown, MessageSquare, MessageCircle,
  PlayCircle, Link, Copy, X, ArrowRight,
  Scissors, Search, Gamepad2, Edit3, FileText, FileAudio, Type, Activity, Crop, Image as ImageIcon, MoreHorizontal, Edit, Trash2,
  MousePointer2, Download, Send, Youtube, Instagram, Facebook, Linkedin, Twitter, Music, ThumbsUp, ThumbsDown, Forward, LayoutDashboard
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

const ClipCard = ({ clip, index, onEdit, onShare, onFullScreenEdit }) => {
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
    <div className="clip-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{
        aspectRatio: getAspectRatioString(ratio),
        backgroundColor: '#000',
        position: 'relative',
        transition: 'aspect-ratio 0.3s ease'
      }}>
         <CaptionVideo clip={clip} />
      </div>
      <div style={{padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
          <div style={{color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '1.5rem'}}>
            {clip.score}<span style={{fontSize: '0.8rem', color: '#888'}}>/100</span>
          </div>
          <div style={{display: 'flex', gap: '0.5rem'}}>
            <button className="icon-btn-small"><MousePointer2 size={16} /></button>
            <button className="icon-btn-small" onClick={() => onFullScreenEdit(clip)}><Scissors size={16} /></button>
            <button className="icon-btn-small"><Crop size={16} /></button>
            <button className="icon-btn-small" onClick={handleDownload}><Download size={16} /></button>
            <button className="icon-btn-small" onClick={() => onShare(clip)}><Send size={16} /></button>
            <button className="icon-btn-small" onClick={() => onEdit && onEdit(clip)}><MoreHorizontal size={16} /></button>
          </div>
        </div>
        
        <h3 style={{fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600, color: '#e4e4e7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
          {clip.title || `Viral Hook #${index + 1}`}
        </h3>
        <p style={{color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4', flex: 1}}>
          {clip.hook}
        </p>
      </div>
    </div>
  );
}

const ShareModal = ({ onClose }) => {
  const socials = [
    { name: 'YouTube', icon: <Youtube size={28} />, color: '#ff0000' },
    { name: 'TikTok', icon: <Music size={28} />, color: '#000000' },
    { name: 'Instagram', icon: <Instagram size={28} />, color: '#e1306c' },
    { name: 'Facebook', icon: <Facebook size={28} />, color: '#1877f2' },
    { name: 'LinkedIn', icon: <Linkedin size={28} />, color: '#0077b5' },
    { name: 'X/Twitter', icon: <Twitter size={28} />, color: '#1da1f2' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#18181b', padding: '2rem', borderRadius: '12px', border: '1px solid #333', maxWidth: '500px', width: '90%', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
          <X size={20} />
        </button>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff' }}>Add Social Account</h2>
        <p style={{ color: '#a1a1aa', marginBottom: '1.5rem', fontSize: '0.9rem' }}>To create and publish posts, please connect at least one social account.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {socials.map(s => (
            <button key={s.name} style={{
              background: '#09090b', border: '1px solid #27272a', borderRadius: '8px', 
              padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', 
              justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#27272a'}
            onMouseOut={(e) => e.currentTarget.style.background = '#09090b'}
            >
              <div style={{ color: s.color }}>{s.icon}</div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{s.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const VideoEditorView = ({ clip, onClose }) => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#09090b', zIndex: 3000, display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <div style={{ height: '60px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', background: '#18181b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRight size={20} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{clip.title || clip.hook}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button style={{ background: 'transparent', border: '1px solid #333', color: '#fff', padding: '0.4rem 1rem', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }}>Saved</button>
          <button style={{ background: 'transparent', border: '1px solid #333', color: '#fff', padding: '0.4rem 1rem', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }}>Publish</button>
          <button style={{ background: 'var(--accent-green)', border: 'none', color: '#000', padding: '0.4rem 1.5rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Export</button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Sidebar Tools */}
        <div style={{ width: '280px', background: '#18181b', borderRight: '1px solid #27272a', overflowY: 'auto', display: 'flex' }}>
          
          {/* Tool Categories Menu */}
          <div style={{ width: '60px', borderRight: '1px solid #27272a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0', gap: '1.5rem' }}>
             <Sparkles size={20} color="var(--accent-green)" />
             <LayoutDashboard size={20} color="#a1a1aa" />
             <Scissors size={20} color="#a1a1aa" />
             <Type size={20} color="#a1a1aa" />
             <UploadCloud size={20} color="#a1a1aa" />
          </div>

          {/* Tools Panel */}
          <div style={{ flex: 1, padding: '1.5rem 1rem' }}>
            <h3 style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: 600 }}>AI Tools</h3>
            
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase' }}>Sound Good</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#d4d4d8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileAudio size={16}/> Clean Audio</span>
                <div style={{ width: '32px', height: '18px', background: '#3f3f46', borderRadius: '99px' }}></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#d4d4d8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Scissors size={16}/> Remove Filler Words</span>
                <Sparkles size={14} color="#eab308" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#d4d4d8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Crop size={16}/> Remove Silences</span>
                <Sparkles size={14} color="#eab308" />
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase' }}>Look Good</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#d4d4d8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Edit3 size={16}/> Reframe</span>
                <Sparkles size={14} color="#eab308" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#d4d4d8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Type size={16}/> Generate Hook</span>
                <Sparkles size={14} color="#eab308" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#d4d4d8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Gamepad2 size={16}/> Add AI Emojis</span>
                <div style={{ width: '32px', height: '18px', background: 'var(--accent-green)', borderRadius: '99px', position: 'relative' }}><div style={{width: '14px', height: '14px', background: '#000', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px'}}></div></div>
              </div>
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase' }}>Generate Media</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#d4d4d8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Video size={16}/> AI Video</span>
                <Sparkles size={14} color="#eab308" />
              </div>
            </div>
          </div>
        </div>

        {/* Center Preview Canvas */}
        <div style={{ flex: 1, background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          
          <div style={{ width: '360px', height: '640px', background: '#000', borderRadius: '16px', border: '1px solid #27272a', position: 'relative', overflow: 'hidden' }}>
             {/* Fake video overlay */}
             <div style={{ position: 'absolute', inset: 0 }}>
                <CaptionVideo clip={clip} />
             </div>
             
             {/* Shorts UI Overlay */}
             <div style={{ position: 'absolute', right: '1rem', bottom: '5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', zIndex: 30 }}>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                 <ThumbsUp size={24} color="#fff" />
                 <span style={{ color: '#fff', fontSize: '0.7rem' }}>Like</span>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                 <ThumbsDown size={24} color="#fff" />
                 <span style={{ color: '#fff', fontSize: '0.7rem' }}>Dislike</span>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                 <MessageSquare size={24} color="#fff" />
                 <span style={{ color: '#fff', fontSize: '0.7rem' }}>12</span>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                 <Forward size={24} color="#fff" />
                 <span style={{ color: '#fff', fontSize: '0.7rem' }}>Share</span>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                 <Copy size={24} color="#fff" />
                 <span style={{ color: '#fff', fontSize: '0.7rem' }}>Remix</span>
               </div>
             </div>

             <div style={{ position: 'absolute', left: '1rem', bottom: '2rem', zIndex: 30, right: '4rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                 <div style={{ width: '32px', height: '32px', background: '#333', borderRadius: '50%' }}></div>
                 <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>@ChannelName</span>
                 <button style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', fontWeight: 'bold' }}>Subscribe</button>
               </div>
               <p style={{ color: '#fff', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{clip.hook}</p>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <Music size={14} color="#fff" />
                 <span style={{ color: '#fff', fontSize: '0.75rem' }}>Original Sound - Creator</span>
               </div>
             </div>
          </div>

          <div style={{ position: 'absolute', bottom: '1.5rem', display: 'flex', gap: '1rem' }}>
            <div style={{ background: '#18181b', border: '1px solid #27272a', padding: '0.4rem 0.8rem', borderRadius: '8px', color: '#a1a1aa', fontSize: '0.8rem' }}>📱 9:16</div>
            <div style={{ background: '#18181b', border: '1px solid #27272a', padding: '0.4rem 0.8rem', borderRadius: '8px', color: '#a1a1aa', fontSize: '0.8rem' }}>Current Layout: Full</div>
            <div style={{ background: '#18181b', border: '1px solid #27272a', padding: '0.4rem 0.8rem', borderRadius: '8px', color: '#fff', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Youtube size={14} color="#ff0000"/> YouTube Shorts</div>
          </div>
        </div>

      </div>

      {/* Bottom Timeline */}
      <div style={{ height: '80px', background: '#09090b', borderTop: '1px solid #27272a', padding: '0 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><PlayCircle size={24} /></button>
        <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>00:00:00 / {clip.duration || '00:01:00'}</span>
        <div style={{ flex: 1, height: '4px', background: '#27272a', borderRadius: '2px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '30%', background: 'var(--accent-green)', borderRadius: '2px' }}></div>
          <div style={{ position: 'absolute', left: '30%', top: '-4px', width: '12px', height: '12px', background: '#fff', borderRadius: '50%', cursor: 'pointer', transform: 'translateX(-50%)' }}></div>
        </div>
      </div>
    </div>
  );
};

const LibraryView = ({ clips, onDelete, onEdit, onShare, onFullScreenEdit }) => {
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
        {clips.length === 0 && <div style={{color: '#888', marginTop: '2rem'}}>No clips in your library yet. Generate some first!</div>}
        {clips.map((proj, idx) => (
          <ClipCard 
            key={proj.id} 
            clip={proj} 
            index={idx}
            onEdit={onEdit} 
            onShare={onShare}
            onFullScreenEdit={onFullScreenEdit}
          />
        ))}
      </div>
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [step, setStep] = useState(0); 
  const [clips, setClips] = useState([]);
  const [error, setError] = useState('');
  
  const [libraryClips, setLibraryClips] = useState(() => {
    const saved = localStorage.getItem('opusLibrary');
    return saved ? JSON.parse(saved) : [];
  });
  const [editingClip, setEditingClip] = useState(null);
  const [sharingClip, setSharingClip] = useState(null);
  const [editingFullScreenClip, setEditingFullScreenClip] = useState(null);

  React.useEffect(() => {
    localStorage.setItem('opusLibrary', JSON.stringify(libraryClips));
  }, [libraryClips]);

  const handleDeleteLibraryClip = (id) => {
    setLibraryClips(prev => prev.filter(c => c.id !== id));
  };

  const handleEditLibraryClip = (clip) => {
    setEditingClip({ ...clip });
  };

  const saveEdit = () => {
    const updatedClip = { ...editingClip };
    if (updatedClip.subtitles && updatedClip.subtitles.length > 0) {
      updatedClip.subtitles[0].text = updatedClip.hook;
    }
    
    setLibraryClips(prev => prev.map(c => c.id === updatedClip.id ? updatedClip : c));
    setClips(prev => prev.map(c => c.id === updatedClip.id ? updatedClip : c));
    setEditingClip(null);
  };

  const fileInputRef = useRef(null);
  const urlInputRef = useRef(null);

  const pollStatus = async (jobId, onComplete) => {
    try {
      const response = await fetch(`/api/status/${jobId}`);
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      
      if (data.status === 'completed') {
        const enrichedClips = data.clips.map(c => ({
          ...c,
          id: c.id || Math.random().toString(36).substring(2, 9),
          title: c.title || 'Viral Clip',
          thumbnail: c.thumbnail || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
          isNew: true,
          date: new Date().toLocaleDateString(),
          source: videoUrl ? (videoUrl.includes('Selected:') ? 'Local Upload' : videoUrl) : 'Unknown Source',
        }));
        onComplete(enrichedClips);
        setLibraryClips(prev => {
          // Merge new clips to library without duplicating if they already exist
          const existingIds = new Set(prev.map(p => p.url));
          const toAdd = enrichedClips.filter(c => !existingIds.has(c.url));
          return [...toAdd, ...prev];
        });
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

  const handleProcess = async (toolName = 'AI Clipping') => {
    if (selectedFile) {
      setStep(1);
      setIsProcessing(true);
      setError('');

      const formData = new FormData();
      formData.append('video', selectedFile);
      // Optional: pass toolName to backend if needed in the future
      // formData.append('tool', toolName); 

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
      return;
    }

    if (videoUrl) {
      setStep(1);
      setIsProcessing(true);
      setError('');
      
      try {
        const response = await fetch('/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: videoUrl, offset: 0, tool: toolName })
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
      return;
    }

    setError('Please paste a video link or upload a file first');
    urlInputRef.current?.focus();
  };

  const handleGetClips = () => handleProcess('AI Clipping');

  const handleCreateMore = async () => {
    setIsGeneratingMore(true);
    // Add logic to generate more clips if needed
    // For now we'll just simulate a delay or re-run the process
    setTimeout(() => {
      setIsGeneratingMore(false);
    }, 2000);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setSelectedFile(file);
    setVideoUrl(`Selected: ${file.name}`);
  };

  return (
    <div className="app-layout">
      
      {editingFullScreenClip && (
        <VideoEditorView 
          clip={editingFullScreenClip} 
          onClose={() => setEditingFullScreenClip(null)} 
        />
      )}

      {sharingClip && (
        <ShareModal onClose={() => setSharingClip(null)} />
      )}

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
            {activeTab === 'library' && (
              <div className="animate-slide-up">
                <LibraryView 
                  clips={libraryClips} 
                  onDelete={handleDeleteLibraryClip} 
                  onEdit={handleEditLibraryClip} 
                  onShare={setSharingClip}
                  onFullScreenEdit={setEditingFullScreenClip}
                />
              </div>
            )}
            {activeTab === 'home' && (
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
                      onChange={(e) => {
                        setVideoUrl(e.target.value);
                        if (selectedFile) setSelectedFile(null); // Clear selected file if they start typing a URL
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleProcess('AI Clipping')}
                    />
                    <button className="btn-arrow" onClick={() => handleProcess('AI Clipping')}>
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
                  <div className="tool-card" onClick={() => handleProcess('AI Clipping')}>
                    <Scissors size={32} />
                    <span className="tool-card-title">AI Clipping</span>
                  </div>
                  <div className="tool-card tool-card-highlighted" onClick={() => handleProcess('Find Moments')}>
                    <Search size={32} color="var(--accent-green)" />
                    <span className="tool-card-title">Find Moments</span>
                  </div>
                  <div className="tool-card" onClick={() => handleProcess('Game Clipping')}>
                    <span className="tool-badge">New</span>
                    <Gamepad2 size={32} />
                    <span className="tool-card-title">Game Clipping</span>
                  </div>
                  <div className="tool-card" onClick={() => handleProcess('AI Video')}>
                    <Video size={32} />
                    <span className="tool-card-title">AI Video</span>
                  </div>
                  
                  <div className="tool-card" onClick={() => handleProcess('Video Editor')}>
                    <span className="tool-badge">New</span>
                    <Edit3 size={32} />
                    <span className="tool-card-title">Video Editor</span>
                  </div>
                  <div className="tool-card" onClick={() => handleProcess('Video Summary')}>
                    <FileText size={32} />
                    <span className="tool-card-title">Video Summary</span>
                  </div>
                  <div className="tool-card" onClick={() => handleProcess('Video Transcripts')}>
                    <span className="tool-badge free">Free</span>
                    <FileAudio size={32} />
                    <span className="tool-card-title">Video Transcripts</span>
                  </div>
                  <div className="tool-card" onClick={() => handleProcess('AI Subtitles')}>
                    <span className="tool-badge free">Free</span>
                    <Type size={32} />
                    <span className="tool-card-title">AI Subtitles</span>
                  </div>
                  
                  <div className="tool-card" onClick={() => handleProcess('Speech Enhancer')}>
                    <span className="tool-badge">New</span>
                    <Activity size={32} />
                    <span className="tool-card-title">Speech Enhancer</span>
                  </div>
                  <div className="tool-card" onClick={() => handleProcess('AI Reframe')}>
                    <span className="tool-badge free">Free</span>
                    <Crop size={32} />
                    <span className="tool-card-title">AI Reframe</span>
                  </div>
                  <div className="tool-card" onClick={() => handleProcess('AI Thumbnail')}>
                    <span className="tool-badge">New</span>
                    <ImageIcon size={32} />
                    <span className="tool-card-title">AI Thumbnail</span>
                  </div>
                  <div className="tool-card" onClick={() => handleProcess('AI Hook')}>
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
                      <ClipCard key={index} clip={clip} index={index} onEdit={handleEditLibraryClip} />
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

      {editingClip && (
        <div className="modal-overlay">
          <div className="modal-content" style={{background: '#18181b', padding: '2rem', borderRadius: '12px', border: '1px solid #333', maxWidth: '500px', width: '90%', color: '#fff'}}>
            <h2 style={{marginBottom: '1.5rem', fontSize: '1.5rem'}}>Edit Video Clip</h2>
            
            <div style={{marginBottom: '1rem'}}>
              <label style={{display: 'block', marginBottom: '0.5rem', color: '#a1a1aa'}}>Thumbnail Image (URL or Local File)</label>
              <div style={{display: 'flex', gap: '0.5rem'}}>
                <input 
                  type="text" 
                  value={editingClip.thumbnail} 
                  onChange={e => setEditingClip({...editingClip, thumbnail: e.target.value})}
                  style={{flex: 1, padding: '0.75rem', background: '#09090b', border: '1px solid #333', borderRadius: '8px', color: '#fff'}}
                  placeholder="https://example.com/image.jpg"
                />
                <input 
                  type="file" 
                  accept="image/*"
                  id="thumbnail-upload"
                  style={{display: 'none'}}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setEditingClip({...editingClip, thumbnail: reader.result});
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <label 
                  htmlFor="thumbnail-upload" 
                  style={{background: 'var(--panel-bg)', border: '1px solid #333', borderRadius: '8px', padding: '0 1rem', display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#fff'}}
                >
                  <UploadCloud size={18} />
                </label>
              </div>
            </div>
            
            <div style={{marginBottom: '1rem'}}>
              <label style={{display: 'block', marginBottom: '0.5rem', color: '#a1a1aa'}}>Short Title</label>
              <input 
                type="text" 
                value={editingClip.title} 
                onChange={e => setEditingClip({...editingClip, title: e.target.value})}
                style={{width: '100%', padding: '0.75rem', background: '#09090b', border: '1px solid #333', borderRadius: '8px', color: '#fff'}}
                placeholder="My Viral Hook"
              />
            </div>
            
            <div style={{marginBottom: '1.5rem'}}>
              <label style={{display: 'block', marginBottom: '0.5rem', color: '#a1a1aa'}}>Main Hook Text (Animated Caption)</label>
              <textarea 
                value={editingClip.hook} 
                onChange={e => setEditingClip({...editingClip, hook: e.target.value})}
                style={{width: '100%', padding: '0.75rem', background: '#09090b', border: '1px solid #333', borderRadius: '8px', color: '#fff', minHeight: '100px'}}
                placeholder="The undeniable truth about..."
              />
            </div>
            
            <div style={{display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
              <button 
                onClick={() => setEditingClip(null)} 
                style={{padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid #333', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 600}}
              >
                Cancel
              </button>
              <button 
                onClick={saveEdit} 
                style={{padding: '0.75rem 1.5rem', background: 'var(--accent-green)', border: 'none', borderRadius: '8px', color: '#000', cursor: 'pointer', fontWeight: 600}}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
