import React, { useState } from 'react';
import { Smartphone, Type, ChevronLeft, ChevronRight, X, Play, Pause, Bookmark, Sparkles } from 'lucide-react';

export default function MobileReaderSimulatorModal({ book, onClose }) {
  if (!book) return null;

  const chapters = book.chapters && book.chapters.length > 0 ? book.chapters : [
    {
      id: 'ch_1',
      title: 'Page 1',
      content: [
        'Welcome to Bookkaboo Mobile Reader preview.',
        book.description || 'This is a sample paragraph rendered dynamically in raw text format.',
        'You can change font size, switch between Sepia, Dark, and Light themes, and use Audio TTS features just like on a real phone!'
      ]
    }
  ];

  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [theme, setTheme] = useState('sepia'); // 'light' | 'dark' | 'sepia'
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const currentChapter = chapters[currentChapterIdx] || chapters[0];

  // Theme styling configurations
  const themeStyles = {
    light: { bg: '#ffffff', text: '#0f172a', headerBg: '#f8fafc', border: '#e2e8f0', cardBg: '#f1f5f9' },
    dark: { bg: '#0f172a', text: '#f8fafc', headerBg: '#1e293b', border: '#334155', cardBg: '#1e293b' },
    sepia: { bg: '#fbf0d9', text: '#432818', headerBg: '#f4e4c1', border: '#e6ccb2', cardBg: '#f4e4c1' }
  };

  const activeTheme = themeStyles[theme];

  // Text-To-Speech web browser simulator
  const toggleTTS = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        const fullText = (currentChapter.content || []).join('. ');
        const utterance = new SpeechSynthesisUtterance(fullText);
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    } else {
      alert('Speech synthesis is not supported on this browser window.');
    }
  };

  const handleClose = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1.5rem',
      overflowY: 'auto'
    }}>
      {/* Centered Container Wrapper */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: 'auto'
      }}>

        {/* Floating Top Title Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          width: '100%',
          maxWidth: '420px',
          marginBottom: '0.75rem',
          color: '#fff',
          background: 'rgba(30, 41, 59, 0.95)',
          padding: '0.5rem 1rem',
          borderRadius: '30px',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Smartphone size={18} color="#38bdf8" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
              {book.title || 'Bookkaboo'} Preview
            </span>
            <span style={{ fontSize: '0.725rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: 600 }}>
              {chapters.length} Pages
            </span>
          </div>

          {/* Clean Sleek Header Close Button */}
          <button
            onClick={handleClose}
            title="Close Preview"
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#ef4444';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.color = '#fca5a5';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Mobile Device Frame Mockup (Centered) */}
        <div style={{
          width: '390px',
          height: '750px',
          background: '#090d16',
          borderRadius: '50px',
          padding: '12px',
          boxShadow: '0 30px 60px -15px rgba(0,0,0,0.8), 0 0 0 10px #1e293b, 0 0 0 11px rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>

          {/* iPhone Dynamic Island Notch */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '115px',
            height: '28px',
            background: '#000',
            borderRadius: '20px',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            padding: '0 10px'
          }}>
            <div style={{ width: '10px', height: '10px', background: '#1c1c1e', borderRadius: '50%' }} />
            <div style={{ width: '10px', height: '10px', background: '#09090b', borderRadius: '50%', border: '2px solid #18181b' }} />
          </div>

          {/* Phone Inner Screen Display */}
          <div style={{
            flex: 1,
            background: activeTheme.bg,
            color: activeTheme.text,
            borderRadius: '40px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease'
          }}>

            {/* Top Mobile Status Header */}
            <div style={{
              padding: '38px 16px 12px 16px',
              background: activeTheme.headerBg,
              borderBottom: `1px solid ${activeTheme.border}`,
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bookmark size={15} color="var(--primary)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  BOOKKABOO
                </span>
              </div>

              {/* Audio Speech Button */}
              <button
                onClick={toggleTTS}
                style={{
                  border: 'none',
                  background: isPlayingAudio ? '#10b981' : 'var(--primary)',
                  color: '#fff',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }}
              >
                {isPlayingAudio ? <Pause size={12} /> : <Play size={12} />}
                {isPlayingAudio ? 'Reading...' : 'Audio TTS'}
              </button>
            </div>

            {/* Controls Bar (Font Sizing & Theme Pickers) */}
            <div style={{
              padding: '8px 14px',
              background: activeTheme.headerBg,
              borderBottom: `1px solid ${activeTheme.border}`,
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between'
            }}>
              {/* Font Size Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Type size={14} />
                <button
                  onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                  style={{ border: `1px solid ${activeTheme.border}`, background: activeTheme.cardBg, color: activeTheme.text, padding: '3px 9px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}
                >
                  A-
                </button>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '32px', textAlign: 'center' }}>{fontSize}px</span>
                <button
                  onClick={() => setFontSize(Math.min(26, fontSize + 2))}
                  style={{ border: `1px solid ${activeTheme.border}`, background: activeTheme.cardBg, color: activeTheme.text, padding: '3px 9px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}
                >
                  A+
                </button>
              </div>

              {/* Theme Selectors */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => setTheme('light')}
                  title="Light Theme"
                  style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#ffffff', border: theme === 'light' ? '2.5px solid var(--primary)' : '1px solid #cbd5e1', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                />
                <button
                  onClick={() => setTheme('sepia')}
                  title="Sepia Theme"
                  style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fbf0d9', border: theme === 'sepia' ? '2.5px solid var(--primary)' : '1px solid #d6c5a0', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                />
                <button
                  onClick={() => setTheme('dark')}
                  title="Dark Theme"
                  style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0f172a', border: theme === 'dark' ? '2.5px solid var(--primary)' : '1px solid #475569', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                />
              </div>
            </div>

            {/* Book Content Scroll View */}
            <div style={{ flex: 1, padding: '20px 18px', overflowY: 'auto', lineHeight: '1.75' }}>
              <h3 style={{ fontSize: `${fontSize + 3}px`, fontWeight: 800, marginBottom: '16px', borderBottom: `2px solid ${activeTheme.border}`, paddingBottom: '10px' }}>
                {currentChapter.title}
              </h3>

              {Array.isArray(currentChapter.content) ? (
                currentChapter.content.map((pText, pIdx) => (
                  <p
                    key={pIdx}
                    style={{
                      fontSize: `${fontSize}px`,
                      marginBottom: '16px',
                      textAlign: 'justify'
                    }}
                  >
                    {pText}
                  </p>
                ))
              ) : (
                <p style={{ fontSize: `${fontSize}px` }}>{String(currentChapter.content || '')}</p>
              )}
            </div>

            {/* Bottom Navigation Bar */}
            <div style={{
              padding: '12px 18px 24px 18px',
              background: activeTheme.headerBg,
              borderTop: `1px solid ${activeTheme.border}`,
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between'
            }}>
              <button
                disabled={currentChapterIdx === 0}
                onClick={() => setCurrentChapterIdx(prev => prev - 1)}
                style={{
                  border: `1px solid ${activeTheme.border}`,
                  background: activeTheme.cardBg,
                  color: currentChapterIdx === 0 ? '#94a3b8' : activeTheme.text,
                  padding: '0.4rem 0.85rem',
                  borderRadius: '18px',
                  fontSize: '0.775rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: currentChapterIdx === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                <ChevronLeft size={16} /> Prev Page
              </button>

              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                {currentChapterIdx + 1} / {chapters.length}
              </span>

              <button
                disabled={currentChapterIdx === chapters.length - 1}
                onClick={() => setCurrentChapterIdx(prev => prev + 1)}
                style={{
                  border: `1px solid ${activeTheme.border}`,
                  background: activeTheme.cardBg,
                  color: currentChapterIdx === chapters.length - 1 ? '#94a3b8' : activeTheme.text,
                  padding: '0.4rem 0.85rem',
                  borderRadius: '18px',
                  fontSize: '0.775rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: currentChapterIdx === chapters.length - 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Next Page <ChevronRight size={16} />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
