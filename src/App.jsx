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
      {layout === 'Split' ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'row' }}>
          <div style={{ flex: 0.5, position: 'relative', borderRight: '2px solid #000' }}>
            <video 
              src={videoSrc}
              style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%'}}
              muted
            ></video>
          </div>
          <div style={{ flex: 0.5, position: 'relative' }}>
            <video 
              src={videoSrc}
              controls
              style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 75%'}}
              onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
            ></video>
          </div>
        </div>
      ) : layout === 'Gameplay A' ? (
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
      ) : layout === 'Fit' ? (
        <video 
          src={videoSrc}
          controls
          style={{width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center'}}
          onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
        ></video>
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
  const ratios = ['9:16', '16:9', '1:1', '4:5'];
  const [ratio, setRatio] = useState('9:16');
  const [isDownloading, setIsDownloading] = useState(false);

  const getAspectRatioString = (r) => r.replace(':', '/');

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';
      const response = await fetch(`${apiBase}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clipUrl: clip.url, ratio })
      });
      const data = await response.json();
      if (data.downloadUrl) {
         try {
           // Build the full URL — prepend backend origin in dev mode
           const downloadUrl = data.downloadUrl.startsWith('http')
             ? data.downloadUrl
             : `${apiBase}${data.downloadUrl}`;
           const fileRes = await fetch(downloadUrl);
           // Guard: make sure we got a video, not an HTML error page
           const contentType = fileRes.headers.get('content-type') || '';
           if (contentType.includes('text/html')) throw new Error('got html instead of video');
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
            <button className="icon-btn-small" onClick={handleDownload} disabled={isDownloading} title={`Download ${ratio}`}>
              {isDownloading ? <Loader2 size={16} style={{animation: 'spin 1s linear infinite'}} /> : <Download size={16} />}
            </button>
            <button className="icon-btn-small" onClick={() => onShare && onShare(clip)}><Send size={16} /></button>
            <button className="icon-btn-small" onClick={() => onDelete && onDelete(clip.id)} style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
            <button className="icon-btn-small" onClick={() => onEdit && onEdit(clip)}><MoreHorizontal size={16} /></button>
          </div>
        </div>

        {/* Ratio selector */}
        <div style={{display: 'flex', gap: '0.3rem', marginBottom: '0.5rem', flexWrap: 'wrap'}}>
          {ratios.map(r => (
            <button
              key={r}
              onClick={() => setRatio(r)}
              style={{
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                border: ratio === r ? '1px solid var(--accent-green)' : '1px solid #333',
                background: ratio === r ? 'rgba(30, 215, 96, 0.15)' : 'transparent',
                color: ratio === r ? 'var(--accent-green)' : '#888',
                fontSize: '0.7rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontWeight: ratio === r ? 600 : 400,
              }}
            >
              {r}
            </button>
          ))}
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
  const [activeRatio, setActiveRatio] = useState('9:16');
  const [reframeOpen, setReframeOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadingRatio, setDownloadingRatio] = useState(null);
  const [isMobilePanel, setIsMobilePanel] = useState(false);

  /* ── ratio → CSS aspect-ratio value ── */
  const ratioMap = {
    '9:16':    { css: '9/16',   label: 'Shorts / TikTok',  svgW: 9,  svgH: 16 },
    '16:9':    { css: '16/9',   label: 'YouTube / Landscape', svgW: 16, svgH: 9  },
    '1:1':     { css: '1/1',    label: 'Instagram Square', svgW: 1,  svgH: 1  },
    '4:5':     { css: '4/5',    label: 'Instagram Portrait', svgW: 4, svgH: 5  },
    'Original':{ css: '16/9',   label: 'Original',         svgW: 16, svgH: 9  },
  };

  const ratios = ['9:16', '16:9', '1:1', '4:5', 'Original'];
  const ratioIcons = {
    '9:16': <Smartphone size={13}/>,
    '16:9': <RectangleHorizontal size={13}/>,
    '1:1':  <Square size={13}/>,
    '4:5':  <Tablet size={13}/>,
    'Original': <Maximize2 size={13}/>,
  };

  const currentCss = ratioMap[activeRatio]?.css || '9/16';

  /* ── Build the same video URL the <video> element uses ── */
  const getClipSrc = () => {
    if (!clip || !clip.url) return '';
    if (clip.url.startsWith('http')) return clip.url;
    if (window.location.hostname === 'localhost') return 'http://localhost:3001' + clip.url;
    return clip.url;
  };

  /* ── 100% cross-platform download ── */
  const downloadAsBlob = async (url, filename) => {
    // iOS Safari does NOT support <a download> for blob URLs — detect it
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOS) {
      // On iOS: open video directly → user long-presses → "Save to Photos" or "Download"
      window.open(url, '_blank');
      return;
    }

    try {
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(res.status);
      // Guard: make sure we got a video, not an HTML error page
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) throw new Error('got html');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(blobUrl); document.body.removeChild(a); }, 500);
    } catch {
      // Fallback: open in new tab → right-click / long-press → Save
      window.open(url, '_blank');
    }
  };


  /* ── download for a specific ratio ── */
  const handleDownloadRatio = async (ratio) => {
    setDownloadingRatio(ratio);
    const filename = (clip.title || 'clip').replace(/[^a-zA-Z0-9]/g, '_') + '_' + ratio.replace(':', 'x') + '.mp4';
    const src = getClipSrc();

    // Try server-side crop first (only works when clip is still on disk)
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 15000);
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clipUrl: clip.url, ratio }),
        signal: controller.signal
      });
      clearTimeout(tid);
      if (response.ok) {
        const data = await response.json();
        if (data.downloadUrl && !data.fallback) {
          // Server cropped it — download the cropped file as blob
          const croppedUrl = data.downloadUrl.startsWith('http') ? data.downloadUrl :
            (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '') + data.downloadUrl;
          await downloadAsBlob(croppedUrl, filename);
          setDownloadingRatio(null);
          return;
        }
      }
    } catch {
      // Server unavailable — fall through to direct download
    }

    // Fallback: download original clip directly (always works)
    await downloadAsBlob(src, filename);
    setDownloadingRatio(null);
  };

  /* ── export (navbar button) — same logic ── */
  const handleExport = async () => {
    setIsExporting(true);
    const filename = (clip.title || 'clip').replace(/[^a-zA-Z0-9]/g, '_') + '_' + activeRatio.replace(':', 'x') + '.mp4';
    const src = getClipSrc();

    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 15000);
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clipUrl: clip.url, ratio: activeRatio }),
        signal: controller.signal
      });
      clearTimeout(tid);
      if (response.ok) {
        const data = await response.json();
        if (data.downloadUrl && !data.fallback) {
          const croppedUrl = data.downloadUrl.startsWith('http') ? data.downloadUrl :
            (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '') + data.downloadUrl;
          await downloadAsBlob(croppedUrl, filename);
          setIsExporting(false);
          return;
        }
      }
    } catch {
      // Fall through
    }

    await downloadAsBlob(src, filename);
    setIsExporting(false);
  };

  const tabs = [
    { id: 'AI Tools',  icon: <Sparkles size={16} /> },
    { id: 'Reframe',   icon: <Crop size={16} />     },
    { id: 'Trim',      icon: <Scissors size={16} />  },
    { id: 'Subtitles', icon: <Subtitles size={16} /> },
  ];

  const aiTools = [
    { icon: <Mic size={14} />,       label: 'Clean Audio'           },
    { icon: <Scissors size={14} />,  label: 'Remove Filler Words'   },
    { icon: <Crop size={14} />,      label: 'Remove Silences'       },
    { icon: <Type size={14} />,      label: 'Generate Hook'         },
    { icon: <ImageIcon size={14} />, label: 'Generate Thumbnail'    },
    { icon: <Globe size={14} />,     label: 'Translate'             },
  ];

  /* ── shared dropdown style ── */
  const dropdownItem = (active) => ({
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.42rem 0.5rem', borderRadius: '5px',
    background: active ? '#27272a' : 'transparent',
    cursor: 'pointer',
    color: active ? '#fff' : '#a1a1aa',
    fontSize: '0.82rem',
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#09090b', zIndex: 3000, display: 'flex', flexDirection: 'column' }}>

      {/* ── Slim Navbar ── */}
      <div style={{ height: '48px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', background: '#111', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          {/* mobile panel toggle */}
          <button
            onClick={() => setIsMobilePanel(p => !p)}
            style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', padding: '0.2rem' }}
            className="mobile-only"
          >
            <Menu size={18} />
          </button>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', flexShrink: 0 }}>
            <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back
          </button>
          <span style={{ color: '#3f3f46', flexShrink: 0 }}>|</span>
          <span style={{ color: '#e4e4e7', fontWeight: 500, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clip.title || clip.hook}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ color: '#3f3f46', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} className="desktop-only"><Cloud size={12} /> Saved</span>
          <button onClick={handleExport} disabled={isExporting} style={{ background: '#1ED760', border: 'none', color: '#000', padding: '0.32rem 0.9rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', opacity: isExporting ? 0.7 : 1, whiteSpace: 'nowrap' }}>
            {isExporting ? 'Exporting…' : 'Export'}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* ── Left Panel (desktop sidebar / mobile overlay) ── */}
        <div className={isMobilePanel ? 'editor-panel editor-panel--open' : 'editor-panel'}>

          {/* close btn on mobile */}
          <button onClick={() => setIsMobilePanel(false)} className="panel-close-btn mobile-only">
            <X size={16} />
          </button>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #27272a', flexShrink: 0 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => { setActiveTab(t.id); }} title={t.id}
                style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: activeTab === t.id ? '2px solid #1ED760' : '2px solid transparent', color: activeTab === t.id ? '#fff' : '#3f3f46', padding: '0.6rem 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                {t.icon}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem' }}>
            <p style={{ color: '#3f3f46', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.65rem' }}>{activeTab}</p>

            {/* AI Tools */}
            {activeTab === 'AI Tools' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                {aiTools.map(item => (
                  <div key={item.label}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.6rem', borderRadius: '6px', cursor: 'pointer', color: '#a1a1aa', fontSize: '0.82rem' }}
                    onMouseOver={e => e.currentTarget.style.background = '#1a1a1a'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ color: '#3f3f46', display: 'flex' }}>{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            )}

            {/* ── REFRAME TAB ── */}
            {activeTab === 'Reframe' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Ratio picker */}
                <div>
                  <p style={{ color: '#52525b', fontSize: '0.72rem', marginBottom: '0.4rem' }}>Select Ratio</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {ratios.map(r => (
                      <button
                        key={r}
                        onClick={() => setActiveRatio(r)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.55rem 0.7rem', borderRadius: '7px', cursor: 'pointer',
                          background: activeRatio === r ? '#1a2e1a' : '#18181b',
                          border: activeRatio === r ? '1px solid #1ED760' : '1px solid #27272a',
                          color: activeRatio === r ? '#1ED760' : '#a1a1aa',
                          fontSize: '0.82rem', transition: 'all 0.15s', width: '100%',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {ratioIcons[r]} {r}
                        </span>
                        <span style={{ fontSize: '0.68rem', opacity: 0.6 }}>{ratioMap[r].label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Download per ratio */}
                <div>
                  <p style={{ color: '#52525b', fontSize: '0.72rem', marginBottom: '0.5rem' }}>Download by Format</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {ratios.filter(r => r !== 'Original').map(r => (
                      <button
                        key={r}
                        onClick={() => handleDownloadRatio(r)}
                        disabled={downloadingRatio === r}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.5rem 0.7rem', borderRadius: '7px', cursor: downloadingRatio === r ? 'not-allowed' : 'pointer',
                          background: '#18181b', border: '1px solid #27272a',
                          color: '#a1a1aa', fontSize: '0.8rem', transition: 'all 0.15s', width: '100%',
                          opacity: downloadingRatio !== null && downloadingRatio !== r ? 0.4 : 1,
                        }}
                        onMouseOver={e => { if (!downloadingRatio) e.currentTarget.style.borderColor = '#1ED760'; }}
                        onMouseOut={e => { e.currentTarget.style.borderColor = '#27272a'; }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {ratioIcons[r]} {r}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: downloadingRatio === r ? '#1ED760' : '#52525b' }}>
                          {downloadingRatio === r ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={13} />}
                          {downloadingRatio === r ? 'Downloading…' : 'Download'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'Trim' && (
              <p style={{ color: '#3f3f46', fontSize: '0.8rem' }}>Drag the timeline handles below to trim your clip.</p>
            )}
            {activeTab === 'Subtitles' && (
              <p style={{ color: '#3f3f46', fontSize: '0.8rem' }}>Subtitles are auto-generated from your audio track.</p>
            )}
          </div>
        </div>

        {/* ── Mobile overlay backdrop ── */}
        {isMobilePanel && (
          <div
            onClick={() => setIsMobilePanel(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 49 }}
            className="mobile-only"
          />
        )}

        {/* ── Center: preview + timeline ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: '#09090b' }}>

          {/* Video Preview — aspect ratio driven by activeRatio */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '1rem' }}>
            <div style={{
              position: 'relative',
              background: '#000',
              borderRadius: '8px',
              overflow: 'hidden',
              /* key fix: use aspect-ratio so the container reshapes on ratio change */
              aspectRatio: currentCss,
              maxWidth: '100%',
              maxHeight: '100%',
              /* constrain by both dimensions */
              width: currentCss === '16/9' ? '100%' : 'auto',
              height: currentCss === '9/16' ? '100%' : 'auto',
            }}>
              <CaptionVideo clip={clip} layout="Full" />
            </div>

            {/* Badges */}
            <div style={{ position: 'absolute', bottom: '0.75rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ background: '#111', border: '1px solid #1ED760', padding: '0.18rem 0.6rem', borderRadius: '5px', color: '#1ED760', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Crop size={11}/> {activeRatio}
              </span>
              <span style={{ background: '#111', border: '1px solid #27272a', padding: '0.18rem 0.6rem', borderRadius: '5px', color: '#52525b', fontSize: '0.68rem' }}>
                Low-res Preview
              </span>
              {/* quick download current ratio */}
              <button
                onClick={() => handleDownloadRatio(activeRatio)}
                disabled={downloadingRatio !== null}
                style={{ background: '#111', border: '1px solid #27272a', padding: '0.18rem 0.7rem', borderRadius: '5px', color: '#a1a1aa', fontSize: '0.68rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                {downloadingRatio === activeRatio ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={11} />}
                {downloadingRatio === activeRatio ? 'Downloading…' : 'Download ' + activeRatio}
              </button>
            </div>
          </div>

          {/* Slim Timeline */}
          <div style={{ height: '100px', background: '#111', borderTop: '1px solid #27272a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.75rem', borderBottom: '1px solid #1e1e1e', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '0.7rem', color: '#3f3f46' }}>
                <Scissors size={14} style={{ cursor: 'pointer' }} />
                <Trash2 size={14} style={{ cursor: 'pointer' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <PlayCircle size={18} color="#fff" style={{ cursor: 'pointer' }} />
                <span style={{ color: '#3f3f46', fontSize: '0.68rem' }}>00:00 / 01:08</span>
              </div>
              <div style={{ display: 'flex', gap: '0.7rem', color: '#3f3f46' }}>
                <ZoomIn size={14} />
                <Maximize size={14} />
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 0.75rem', overflowX: 'auto', position: 'relative' }}>
              <div style={{ display: 'flex', border: '2px solid #7c3aed', borderRadius: '4px', overflow: 'hidden', minWidth: '400px' }}>
                {Array(14).fill(0).map((_, i) => (
                  <img key={i} src={clip.thumbnail || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=80&q=60'} style={{ width: '36px', height: '44px', objectFit: 'cover', display: 'block' }} alt="" />
                ))}
              </div>
              <div style={{ position: 'absolute', left: '120px', top: 0, bottom: 0, width: '2px', background: '#1ED760', zIndex: 10, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: 0, left: '-4px', width: '10px', height: '10px', background: '#1ED760', borderRadius: '2px' }} />
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

  /* ── Wake up Render free-tier server before uploading ── */
  const wakeServer = async () => {
    try {
      await fetch('/api/health', { method: 'GET' });
    } catch { /* ignore — just waking the server up */ }
  };

  /* ── fetch with automatic retry on network failure ── */
  const fetchWithRetry = async (url, options = {}, retries = 3, delayMs = 4000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, options);
        return res; // return on any HTTP response (even 4xx/5xx)
      } catch (err) {
        if (attempt === retries) throw err;
        setError(`Server is starting up… retrying (${attempt}/${retries})`);
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  };

  const handleProcess = async (toolName = 'AI Clipping') => {
    if (selectedFile) {
      // File size warning for large videos on mobile
      const sizeMB = selectedFile.size / (1024 * 1024);
      if (sizeMB > 200) {
        setError(`File is ${Math.round(sizeMB)} MB — upload may take a while on mobile. Please wait…`);
      }

      setStep(1);
      setIsProcessing(true);
      setError('Server is starting, please wait…');

      // Wake Render server first (free tier sleeps after 15 min)
      await wakeServer();
      setError('');

      const formData = new FormData();
      formData.append('video', selectedFile);

      try {
        const response = await fetchWithRetry('/api/upload', {
          method: 'POST',
          body: formData
        }, 3, 5000);

        const data = await response.json();
        if (data.jobId) {
          setError('');
          pollStatus(data.jobId, (newClips) => {
            setClips(newClips);
            setStep(2);
            setIsProcessing(false);
          });
        } else {
          setError(data.error || 'Upload failed — please try again.');
          setStep(0);
          setIsProcessing(false);
        }
      } catch {
        setError('Could not reach the server. Check your internet connection and try again.');
        setStep(0);
        setIsProcessing(false);
      }
      return;
    }

    if (videoUrl) {
      setStep(1);
      setIsProcessing(true);
      setError('Server is starting, please wait…');

      await wakeServer();
      setError('');

      try {
        const response = await fetchWithRetry('/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: videoUrl, offset: 0, tool: toolName })
        }, 3, 5000);

        const data = await response.json();
        if (data.jobId) {
          setError('');
          pollStatus(data.jobId, (newClips) => {
            setClips(newClips);
            setStep(2);
            setIsProcessing(false);
          });
        } else {
          setError(data.error || 'Failed to start processing — please try again.');
          setStep(0);
          setIsProcessing(false);
        }
      } catch {
        setError('Could not reach the server. Check your internet connection and try again.');
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
