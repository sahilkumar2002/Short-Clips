import React, { useState, useRef } from 'react';
import { 
  Video, Loader2, Sparkles, Subtitles, UploadCloud, 
  Home, Library, Calendar, Palette, Wallet, Gift, Code, Settings,
  Globe, ChevronDown, Bell, Crown, MessageSquare, MessageCircle,
  PlayCircle, Link, Copy, X, ArrowRight,
  Scissors, Search, Gamepad2, Edit3, FileText, FileAudio, Type, Activity, Crop, Image as ImageIcon, MoreHorizontal, Edit, Trash2,
  MousePointer2, Download, Send, Music, ThumbsUp, ThumbsDown, Forward, LayoutDashboard, Briefcase, Users,
  Menu, Undo, Redo, Cloud, Eye, Volume2, Maximize, ZoomIn, Mic, Grid, Layers, Monitor,
  Smartphone, RectangleHorizontal, Square, Tablet, Maximize2, Ghost,
  AlignLeft, Diamond
} from 'lucide-react';
import './index.css';

const CaptionVideo = ({ clip, layout = 'Full' }) => {
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
  const videoSrc = (clip.url.startsWith('http') ? clip.url : (window.location.hostname === 'localhost' ? `http://localhost:3001${clip.url}` : clip.url)) + '#t=0.001';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {layout === 'Gameplay A' || layout === 'Split' ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 0.35, position: 'relative' }}>
            <video 
              src={videoSrc}
              style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%'}}
              muted
            ></video>
          </div>
          <div style={{ flex: 0.65, position: 'relative', borderTop: '2px solid #000' }}>
            <video 
              src={videoSrc}
              controls
              style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 80%'}}
              onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
            ></video>
          </div>
        </div>
      ) : (
        <video 
          src={videoSrc}
          controls
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
          onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
        ></video>
      )}
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

const ClipCard = ({ clip, index, onEdit, onShare, onFullScreenEdit, onDelete }) => {
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
         try {
           const fileRes = await fetch(data.downloadUrl);
           const blob = await fileRes.blob();
           const url = window.URL.createObjectURL(blob);
           const a = document.createElement('a');
           a.style.display = 'none';
           a.href = url;
           a.download = `clip_${index + 1}_${ratio.replace(':','x')}.mp4`;
           document.body.appendChild(a);
           a.click();
           window.URL.revokeObjectURL(url);
           document.body.removeChild(a);
         } catch (err) {
           const a = document.createElement('a');
           a.href = data.downloadUrl;
           a.download = `clip_${index + 1}_${ratio.replace(':','x')}.mp4`;
           a.click();
         }
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
            <button className="icon-btn-small" onClick={() => onFullScreenEdit && onFullScreenEdit(clip)}><Scissors size={16} /></button>
            <button className="icon-btn-small"><Crop size={16} /></button>
            <button className="icon-btn-small" onClick={handleDownload}><Download size={16} /></button>
            <button className="icon-btn-small" onClick={() => onShare && onShare(clip)}><Send size={16} /></button>
            <button className="icon-btn-small" onClick={() => onDelete && onDelete(clip.id)} style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
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
    { name: 'YouTube', icon: <PlayCircle size={28} />, color: '#ff0000' },
    { name: 'TikTok', icon: <Music size={28} />, color: '#000000' },
    { name: 'Instagram', icon: <ImageIcon size={28} />, color: '#e1306c' },
    { name: 'Facebook', icon: <Users size={28} />, color: '#1877f2' },
    { name: 'LinkedIn', icon: <Briefcase size={28} />, color: '#0077b5' },
    { name: 'X/Twitter', icon: <MessageSquare size={28} />, color: '#1da1f2' }
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
  const [activeTab, setActiveTab] = useState('AI Tools');
  const [reframeOpen, setReframeOpen] = useState(false);
  const [activeRatio, setActiveRatio] = useState('9:16');
  
  const [activeLayout, setActiveLayout] = useState('Full');
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false);

  const layoutOptions = [
    { name: 'Auto', icon: <Sparkles size={14} /> },
    { name: 'Full', icon: <Maximize size={14} /> },
    { name: 'Fit', icon: <Square size={14} /> },
    { name: 'Split', icon: <Grid size={14} /> },
    { name: 'Trio', icon: <Layers size={14} /> },
    { name: 'Grid', icon: <LayoutDashboard size={14} /> },
    { name: 'PiP', icon: <Monitor size={14} /> },
    { name: 'Screen First', icon: <Monitor size={14} /> },
    { name: 'Gameplay A', icon: <Smartphone size={14} /> },
    { name: 'Gameplay B', icon: <Smartphone size={14} /> }
  ];

  const ratioDimensions = {
    '9:16': { w: 280, h: 498 },
    '16:9': { w: 498, h: 280 },
    '1:1': { w: 400, h: 400 },
    '4:5': { w: 398, h: 498 },
    'Original': { w: 498, h: 280 }
  };

  const currentDims = ratioDimensions[activeRatio];

  const handleSelectRatio = (ratio) => {
    setActiveRatio(ratio);
    setReframeOpen(false);
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clipUrl: clip.url, ratio: activeRatio })
      });
      const data = await response.json();
      if (data.downloadUrl) {
         try {
           const fileRes = await fetch(data.downloadUrl);
           const blob = await fileRes.blob();
           const url = window.URL.createObjectURL(blob);
           const a = document.createElement('a');
           a.style.display = 'none';
           a.href = url;
           a.download = `exported_clip_${activeRatio.replace(':','x')}.mp4`;
           document.body.appendChild(a);
           a.click();
           window.URL.revokeObjectURL(url);
           document.body.removeChild(a);
         } catch (err) {
           const a = document.createElement('a');
           a.href = data.downloadUrl;
           a.download = `exported_clip_${activeRatio.replace(':','x')}.mp4`;
           a.click();
         }
      } else {
         alert(data.error || 'Export failed');
      }
    } catch (e) {
       alert('Failed to connect to export server.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#09090b', zIndex: 3000, display: 'flex', flexDirection: 'column' }}>
      <div style={{ width: '100%', height: '4px', background: '#9333ea' }}></div>
      {/* Top Navbar */}
      <div style={{ height: '56px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', background: '#18181b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Menu size={20} />
          </button>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <span style={{ color: '#fff', fontWeight: 500, fontSize: '0.9rem' }}>{clip.title || clip.hook}</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', color: '#52525b', marginRight: '1rem' }}>
            <Undo size={18} style={{ cursor: 'pointer' }} />
            <Redo size={18} style={{ cursor: 'pointer' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fff', fontSize: '0.8rem', fontWeight: 600, marginRight: '1rem' }}>
            <Cloud size={16} /> Saved
          </div>
          <button style={{ background: '#27272a', border: 'none', color: '#fff', padding: '0.4rem 1.2rem', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Publish</button>
          <button onClick={handleExport} disabled={isExporting} style={{ background: '#86efac', border: 'none', color: '#000', padding: '0.4rem 1.2rem', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', opacity: isExporting ? 0.7 : 1 }}>
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Sidebar Tools Menu */}
        <div style={{ width: '70px', background: '#18181b', borderRight: '1px solid #27272a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0', gap: '1.2rem', overflowY: 'auto' }}>
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', color: '#fff', cursor: 'pointer', background: '#27272a', width: '90%', padding: '0.5rem 0', borderRadius: '8px' }}>
             <Sparkles size={18} />
             <span style={{ fontSize: '0.65rem' }}>AI Tools</span>
           </div>
        {/* Left vertical menu */}
        <div style={{ width: '70px', background: '#09090b', borderRight: '1px solid #27272a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 0', gap: '1.5rem' }}>
          <div onClick={() => setActiveTab('AI Tools')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', color: activeTab === 'AI Tools' ? '#fff' : '#a1a1aa', cursor: 'pointer', background: activeTab === 'AI Tools' ? '#27272a' : 'transparent', padding: '0.5rem', borderRadius: '8px', width: '80%' }}>
            <Sparkles size={18} />
            <span style={{ fontSize: '0.65rem' }}>AI Tools</span>
          </div>
          <div onClick={() => setActiveTab('Brand Kit')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', color: activeTab === 'Brand Kit' ? '#fff' : '#a1a1aa', cursor: 'pointer', background: activeTab === 'Brand Kit' ? '#27272a' : 'transparent', padding: '0.5rem', borderRadius: '8px', width: '80%' }}>
            <Palette size={18} />
            <span style={{ fontSize: '0.65rem' }}>Brand Kit</span>
          </div>
          <div onClick={() => setActiveTab('Trim')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', color: activeTab === 'Trim' ? '#fff' : '#a1a1aa', cursor: 'pointer', background: activeTab === 'Trim' ? '#27272a' : 'transparent', padding: '0.5rem', borderRadius: '8px', width: '80%' }}>
            <Scissors size={18} />
            <span style={{ fontSize: '0.65rem' }}>Trim</span>
          </div>
          <div onClick={() => setActiveTab('Reframe')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', color: activeTab === 'Reframe' ? '#fff' : '#a1a1aa', cursor: 'pointer', background: activeTab === 'Reframe' ? '#27272a' : 'transparent', padding: '0.5rem', borderRadius: '8px', width: '80%' }}>
            <Crop size={18} />
            <span style={{ fontSize: '0.65rem' }}>Reframe</span>
          </div>
          <div onClick={() => setActiveTab('Subtitles')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', color: activeTab === 'Subtitles' ? '#fff' : '#a1a1aa', cursor: 'pointer', background: activeTab === 'Subtitles' ? '#27272a' : 'transparent', padding: '0.5rem', borderRadius: '8px', width: '80%' }}>
            <Subtitles size={18} />
            <span style={{ fontSize: '0.65rem' }}>Subtitles</span>
          </div>
          <div onClick={() => setActiveTab('Upload')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', color: activeTab === 'Upload' ? '#fff' : '#a1a1aa', cursor: 'pointer', background: activeTab === 'Upload' ? '#27272a' : 'transparent', padding: '0.5rem', borderRadius: '8px', width: '80%' }}>
            <UploadCloud size={18} />
            <span style={{ fontSize: '0.65rem' }}>Upload</span>
          </div>
          <div onClick={() => setActiveTab('Elements')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', color: activeTab === 'Elements' ? '#fff' : '#a1a1aa', cursor: 'pointer', background: activeTab === 'Elements' ? '#27272a' : 'transparent', padding: '0.5rem', borderRadius: '8px', width: '80%' }}>
            <Grid size={18} />
            <span style={{ fontSize: '0.65rem' }}>Elements</span>
          </div>
          <div onClick={() => setActiveTab('B-roll')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', color: activeTab === 'B-roll' ? '#fff' : '#a1a1aa', cursor: 'pointer', background: activeTab === 'B-roll' ? '#27272a' : 'transparent', padding: '0.5rem', borderRadius: '8px', width: '80%' }}>
            <Video size={18} />
            <span style={{ fontSize: '0.65rem' }}>B-roll</span>
          </div>
        </div>

        {/* Tools Panel */}
        <div style={{ width: '280px', background: '#121212', borderRight: '1px solid #27272a', padding: '1.5rem 1rem', overflowY: 'auto', position: 'relative' }}>
          <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '2rem', fontWeight: 600 }}>{activeTab}</h3>
          
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: '#e4e4e7', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Scissors size={16} color="#a1a1aa"/> Remove Filler Words <span style={{ color: '#52525b', fontSize: '0.7rem', border: '1px solid #52525b', borderRadius: '50%', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>i</span>
              </span>
              <Sparkles size={14} color="#eab308" />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: '#e4e4e7', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Crop size={16} color="#a1a1aa"/> Remove Silences <span style={{ color: '#52525b', fontSize: '0.7rem', border: '1px solid #52525b', borderRadius: '50%', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>i</span>
              </span>
              <Sparkles size={14} color="#eab308" />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase' }}>Look Good</div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', position: 'relative' }}>
              <span style={{ color: '#e4e4e7', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={16} color="#a1a1aa"/> Reframe <span style={{ color: '#52525b', fontSize: '0.7rem', border: '1px solid #52525b', borderRadius: '50%', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>i</span>
              </span>
              <div 
                onClick={() => setActiveTab('Reframe')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#18181b', border: '1px solid #27272a', padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', color: '#e4e4e7', fontSize: '0.8rem' }}
              >
                {activeRatio === '9:16' && <Smartphone size={14}/>}
                {activeRatio === '16:9' && <RectangleHorizontal size={14}/>}
                {activeRatio === '1:1' && <Square size={14}/>}
                {activeRatio === '4:5' && <Tablet size={14}/>}
                {activeRatio === 'Original' && <Maximize2 size={14}/>}
                {activeRatio} <ChevronDown size={14} color="#a1a1aa" />
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: '#e4e4e7', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Type size={16} color="#a1a1aa"/> Generate Hook <span style={{ color: '#52525b', fontSize: '0.7rem', border: '1px solid #52525b', borderRadius: '50%', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>i</span>
              </span>
              <Sparkles size={14} color="#eab308" />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: '#e4e4e7', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Gamepad2 size={16} color="#a1a1aa"/> Add AI Emojis <span style={{ color: '#52525b', fontSize: '0.7rem', border: '1px solid #52525b', borderRadius: '50%', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>i</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={14} color="#eab308" />
                <div style={{ width: '32px', height: '18px', background: '#86efac', borderRadius: '99px', position: 'relative' }}><div style={{width: '14px', height: '14px', background: '#000', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px'}}></div></div>
              </div>
            </div>

            <div style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 600, marginTop: '2rem', marginBottom: '1rem', textTransform: 'none' }}>Generate Media</div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: '#e4e4e7', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Video size={16} color="#a1a1aa"/> AI Video <span style={{ color: '#52525b', fontSize: '0.7rem', border: '1px solid #52525b', borderRadius: '50%', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>i</span>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: '#e4e4e7', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Music size={16} color="#a1a1aa"/> AI Music <span style={{ color: '#52525b', fontSize: '0.7rem', border: '1px solid #52525b', borderRadius: '50%', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>i</span>
              </span>
              <Diamond size={14} color="#eab308" fill="#eab308" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: '#e4e4e7', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Volume2 size={16} color="#a1a1aa"/> AI Sound Effect <span style={{ color: '#52525b', fontSize: '0.7rem', border: '1px solid #52525b', borderRadius: '50%', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>i</span>
              </span>
              <Diamond size={14} color="#eab308" fill="#eab308" />
            </div>

            <div style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 600, marginTop: '2rem', marginBottom: '1rem', textTransform: 'none' }}>Publish</div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: '#e4e4e7', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ImageIcon size={16} color="#a1a1aa"/> Generate Thumbnail <span style={{ color: '#52525b', fontSize: '0.7rem', border: '1px solid #52525b', borderRadius: '50%', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>i</span>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: '#e4e4e7', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Type size={16} color="#a1a1aa"/> Generate Title <span style={{ color: '#52525b', fontSize: '0.7rem', border: '1px solid #52525b', borderRadius: '50%', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>i</span>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: '#e4e4e7', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlignLeft size={16} color="#a1a1aa"/> Generate Description <span style={{ color: '#52525b', fontSize: '0.7rem', border: '1px solid #52525b', borderRadius: '50%', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>i</span>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: '#e4e4e7', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Globe size={16} color="#a1a1aa"/> Translate <span style={{ color: '#52525b', fontSize: '0.7rem', border: '1px solid #52525b', borderRadius: '50%', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>i</span>
              </span>
            </div>
           </div>
           )}

           {activeTab === 'Reframe' && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               {/* Ratio Dropdown */}
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                 <span style={{ color: '#e4e4e7', fontSize: '0.85rem', fontWeight: 500 }}>Ratio</span>
                 <div style={{ position: 'relative' }}>
                   <div onClick={() => setReframeOpen(!reframeOpen)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#18181b', border: '1px solid #27272a', padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', color: '#e4e4e7', fontSize: '0.8rem', width: '120px', justifyContent: 'space-between' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       {activeRatio === '9:16' && <Smartphone size={14}/>}
                       {activeRatio === '16:9' && <RectangleHorizontal size={14}/>}
                       {activeRatio === '1:1' && <Square size={14}/>}
                       {activeRatio === '4:5' && <Tablet size={14}/>}
                       {activeRatio === 'Original' && <Maximize2 size={14}/>}
                       {activeRatio}
                     </div>
                     <ChevronDown size={14} color="#a1a1aa" />
                   </div>
                   {reframeOpen && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '0.5rem', zIndex: 50, marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div onClick={() => handleSelectRatio('9:16')} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', borderRadius: '6px', background: activeRatio === '9:16' ? '#27272a' : 'transparent', cursor: 'pointer', color: '#e4e4e7', fontSize: '0.85rem', gap: '0.5rem' }}>
                          <Smartphone size={16}/> 9:16
                        </div>
                        <div onClick={() => handleSelectRatio('16:9')} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', borderRadius: '6px', background: activeRatio === '16:9' ? '#27272a' : 'transparent', cursor: 'pointer', color: '#e4e4e7', fontSize: '0.85rem', gap: '0.5rem' }}>
                          <RectangleHorizontal size={16}/> 16:9
                        </div>
                        <div onClick={() => handleSelectRatio('1:1')} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', borderRadius: '6px', background: activeRatio === '1:1' ? '#27272a' : 'transparent', cursor: 'pointer', color: '#e4e4e7', fontSize: '0.85rem', gap: '0.5rem' }}>
                          <Square size={16}/> 1:1
                        </div>
                        <div onClick={() => handleSelectRatio('4:5')} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', borderRadius: '6px', background: activeRatio === '4:5' ? '#27272a' : 'transparent', cursor: 'pointer', color: '#e4e4e7', fontSize: '0.85rem', gap: '0.5rem' }}>
                          <Tablet size={16}/> 4:5
                        </div>
                        <div onClick={() => handleSelectRatio('Original')} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', borderRadius: '6px', background: activeRatio === 'Original' ? '#27272a' : 'transparent', cursor: 'pointer', color: '#e4e4e7', fontSize: '0.85rem', gap: '0.5rem' }}>
                          <Maximize2 size={16}/> Original
                        </div>
                      </div>
                   )}
                 </div>
               </div>
               
               {/* Auto Reframe Toggle */}
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                 <span style={{ color: '#e4e4e7', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Auto Reframe <span style={{ color: '#52525b', fontSize: '0.7rem', border: '1px solid #52525b', borderRadius: '50%', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>i</span> <Diamond size={12} color="#eab308" fill="#eab308" /></span>
                 <div style={{ display: 'flex', alignItems: 'center', background: '#27272a', borderRadius: '6px', overflow: 'hidden' }}>
                    <button style={{ background: '#10b981', color: '#000', border: 'none', padding: '0.3rem 1rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>ON</button>
                    <button style={{ background: 'transparent', color: '#a1a1aa', border: 'none', padding: '0.3rem 1rem', fontSize: '0.75rem', cursor: 'pointer' }}>OFF</button>
                 </div>
               </div>

               {/* Global Layout Dropdown */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 <span style={{ color: '#e4e4e7', fontSize: '0.85rem', fontWeight: 500 }}>Global Layout</span>
                 <div style={{ position: 'relative' }}>
                   <div onClick={() => setLayoutMenuOpen(!layoutMenuOpen)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#18181b', border: '1px solid #27272a', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', color: '#e4e4e7', fontSize: '0.85rem' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       {layoutOptions.find(l => l.name === activeLayout)?.icon} {activeLayout}
                     </div>
                     <ChevronDown size={14} color="#a1a1aa" />
                   </div>
                   {layoutMenuOpen && (
                     <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '0.5rem', zIndex: 50, marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                       {layoutOptions.map(l => (
                         <div 
                           key={l.name}
                           onClick={() => { setActiveLayout(l.name); setLayoutMenuOpen(false); }}
                           style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', background: activeLayout === l.name ? '#27272a' : 'transparent', color: activeLayout === l.name ? '#fff' : '#a1a1aa', fontSize: '0.85rem' }}
                         >
                           {l.icon} {l.name}
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               </div>

               {/* Editing Preview Section */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 <span style={{ color: '#e4e4e7', fontSize: '0.85rem', fontWeight: 500 }}>Editing Preview</span>
                 <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '50%', background: 'url(https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80) center/cover' }}></div>
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, bottom: 0, background: 'url(https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80) center/cover' }}></div>
                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', color: '#fff', border: '1px solid #10b981' }}>Facecam</div>
                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', color: '#fff', border: '1px solid #3b82f6' }}>Gameplay</div>
                 </div>
               </div>
             </div>
           )}
          </div>
        </div>

        {/* Center Preview Canvas & Timeline wrapper */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#18181b' }}>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: '#09090b' }}>
            <div style={{ width: `${currentDims.w}px`, height: `${currentDims.h}px`, background: '#000', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease' }}>
              {/* Actual Video */}
               <div style={{ position: 'absolute', inset: 0 }}>
                  <CaptionVideo clip={clip} layout={activeLayout} />
               </div>
            </div>

            <div style={{ position: 'absolute', bottom: '1.5rem', right: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ background: 'transparent', border: '1px solid #333', padding: '0.3rem 0.8rem', borderRadius: '8px', color: '#a1a1aa', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Crop size={14}/> {activeRatio}</div>
              <div style={{ position: 'relative' }}>
                <div onClick={() => setLayoutMenuOpen(!layoutMenuOpen)} style={{ background: 'transparent', border: '1px solid #333', padding: '0.3rem 0.8rem', borderRadius: '8px', color: '#a1a1aa', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  {layoutOptions.find(l => l.name === activeLayout)?.icon} Current Layout: {activeLayout} <ChevronDown size={14} />
                </div>
                {layoutMenuOpen && (
                  <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: '0.5rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', width: '200px', padding: '0.5rem', zIndex: 50, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderBottom: '1px solid #27272a', marginBottom: '0.5rem', justifyContent: 'center' }}>
                      <button style={{ flex: 1, background: '#10b981', color: '#000', border: 'none', borderRadius: '4px', padding: '0.2rem', fontSize: '0.75rem', fontWeight: 600 }}>ON</button>
                      <button style={{ flex: 1, background: '#27272a', color: '#a1a1aa', border: 'none', borderRadius: '4px', padding: '0.2rem', fontSize: '0.75rem' }}>OFF</button>
                    </div>
                    {layoutOptions.map(l => (
                      <div 
                        key={l.name}
                        onClick={() => { setActiveLayout(l.name); setLayoutMenuOpen(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', background: activeLayout === l.name ? '#27272a' : 'transparent', color: activeLayout === l.name ? '#fff' : '#a1a1aa', fontSize: '0.85rem' }}
                      >
                        {l.icon} {l.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ background: 'transparent', border: '1px solid #333', padding: '0.3rem 0.8rem', borderRadius: '8px', color: '#fff', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><PlayCircle size={14}/> YouTube Shorts</div>
              <span style={{ color: '#a1a1aa', fontSize: '0.75rem', marginLeft: '1rem' }}>Low-res Preview</span>
            </div>
          </div>

          {/* Bottom Timeline */}
          <div style={{ height: '300px', background: '#18181b', borderTop: '1px solid #27272a', display: 'flex', flexDirection: 'column' }}>
            
            {/* Timeline controls */}
            <div style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #27272a' }}>
              <div style={{ display: 'flex', gap: '1rem', color: '#52525b' }}>
                <Scissors size={18} style={{ cursor: 'pointer' }} />
                <Trash2 size={18} style={{ cursor: 'pointer' }} />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <PlayCircle size={24} color="#fff" style={{ cursor: 'pointer' }} />
                <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>00:00:00.00 / 00:01:08.81</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#a1a1aa' }}>
                <FileAudio size={18} color="#86efac" />
                <ZoomIn size={18} />
                <div style={{ width: '60px', height: '4px', background: '#3f3f46', borderRadius: '2px', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '20%', top: '-3px', width: '10px', height: '10px', background: '#fff', borderRadius: '50%' }}></div>
                </div>
                <Maximize size={18} />
                <Monitor size={18} />
              </div>
            </div>
            
            {/* Timeline Tracks */}
            <div style={{ flex: 1, position: 'relative', overflowX: 'auto', overflowY: 'hidden', padding: '1rem 0' }}>
              
              {/* Ruler */}
              <div style={{ display: 'flex', gap: '2rem', paddingLeft: '100px', marginBottom: '1rem' }}>
                {Array(20).fill(0).map((_, i) => (
                  <div key={i} style={{ color: '#52525b', fontSize: '0.6rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>|</span>
                  </div>
                ))}
              </div>
              
              {/* Video Track */}
              <div style={{ display: 'flex', paddingLeft: '1rem', position: 'relative', height: '60px' }}>
                {/* Track controls */}
                <div style={{ width: '80px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a1a1aa', marginRight: '1rem' }}>
                  <Eye size={14} />
                  <Volume2 size={14} />
                  <div style={{ background: '#27272a', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.6rem' }}>1</div>
                </div>
                
                {/* Thumbnails strip */}
                <div style={{ display: 'flex', border: '2px solid #9333ea', borderRadius: '4px', overflow: 'hidden' }}>
                   {Array(15).fill(0).map((_, i) => (
                     <img key={i} src={clip.thumbnail || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&q=80'} style={{ width: '40px', height: '100%', objectFit: 'cover' }} />
                   ))}
                </div>
                
                {/* Playhead */}
                <div style={{ position: 'absolute', left: '150px', top: '-30px', bottom: '0', width: '2px', background: '#86efac', zIndex: 10 }}>
                  <div style={{ position: 'absolute', top: 0, left: '-4px', width: '10px', height: '10px', background: '#86efac', borderRadius: '2px' }}></div>
                </div>
              </div>

            </div>

          </div>
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
            onDelete={onDelete}
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

  const handleDeleteGeneratedClip = (id) => {
    setClips(prev => prev.filter(c => c.id !== id));
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
                      <ClipCard key={index} clip={clip} index={index} onEdit={handleEditLibraryClip} onDelete={handleDeleteGeneratedClip} />
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
