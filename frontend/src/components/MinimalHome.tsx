import React, { useState } from 'react';

interface Props {
  onLoginClick: () => void;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
}

export default function MinimalHome({ onLoginClick, isDark, setIsDark }: Props) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    // Require auth to create links
    onLoginClick();
  };

  return (
    <div 
      className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-bg-base dark:bg-d-bg-base text-text-main dark:text-d-text-main transition-colors duration-300" 
      style={{ fontFamily: "'Geist Sans', 'SF Pro Display', 'Helvetica Neue', sans-serif" }}
    >
      {/* Navbar */}
      <header className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50">
        <div className="font-bold tracking-tight text-lg flex items-center gap-2">
          <div className="w-6 h-6 bg-text-main dark:bg-d-text-main rounded-[4px] flex items-center justify-center">
            <span className="material-symbols-outlined text-bg-base dark:text-d-bg-base" style={{fontSize: 16}}>link</span>
          </div>
          LuminaLink
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDark(!isDark)}
            className="text-sm font-medium text-text-muted dark:text-d-text-muted hover:text-text-main dark:hover:text-d-text-main transition-colors flex items-center"
            title="Toggle Theme"
          >
            <span className="material-symbols-outlined" style={{fontSize: 20}}>
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <button 
            onClick={onLoginClick}
            className="text-sm font-medium px-4 py-1.5 border-[1.5px] border-text-main dark:border-d-border-subtle rounded-[6px] shadow-[2px_2px_0px_#111111] dark:shadow-none hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#111111] dark:hover:shadow-none dark:hover:bg-d-bg-surface transition-all duration-200 active:translate-y-0 active:shadow-[0px_0px_0px_#111111]"
          >
            Log in
          </button>
        </div>
      </header>

      {/* Ambient background (Opacity 0.03) */}
      <div className="fixed inset-0 pointer-events-none -z-10 flex items-center justify-center overflow-hidden opacity-[0.03] dark:opacity-[0.05]">
        <div className="w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,#111_0%,transparent_70%)] dark:bg-[radial-gradient(circle,#fff_0%,transparent_70%)] blur-3xl mix-blend-multiply dark:mix-blend-screen" />
      </div>

      <main className="w-full max-w-3xl mx-auto flex flex-col items-center animate-[fade-in-up_600ms_cubic-bezier(0.16,1,0.3,1)]">
        
        {/* Editorial Heading */}
        <h1 
          className="text-4xl md:text-6xl tracking-[-0.03em] leading-[1.1] mb-6 text-center" 
          style={{ fontFamily: "'Newsreader', 'Playfair Display', 'Lyon Text', serif" }}
        >
          Clean links. <br />
          Focus on what matters.
        </h1>
        
        {/* Subtitle */}
        <p className="text-text-muted dark:text-d-text-muted mb-12 text-center text-lg leading-[1.6] max-w-xl">
          Paste your long URL below. Create short, trackable, and professional links. No ads, no noise.
        </p>

        {/* Input & Button Component */}
        <form onSubmit={handleSubmit} className="w-full max-w-xl flex flex-col gap-4">
          <div className="relative flex items-center bg-bg-surface dark:bg-d-bg-surface border-[1.5px] border-text-main dark:border-d-border-subtle shadow-[4px_4px_0px_#111111] dark:shadow-none rounded-[8px] p-1.5 transition-all duration-300 focus-within:-translate-y-0.5 focus-within:shadow-[6px_6px_0px_#111111] dark:focus-within:border-d-text-main dark:focus-within:shadow-none">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-long-url-here.com"
              required
              className="flex-1 bg-transparent px-4 py-2.5 outline-none text-text-main dark:text-d-text-main placeholder:text-text-muted dark:placeholder:text-d-text-muted text-base"
            />
            <button
              type="submit"
              disabled={!url}
              className="group flex items-center gap-2 bg-text-main dark:bg-d-text-main text-bg-base dark:text-d-bg-base px-6 py-2.5 rounded-[4px] text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#333333] dark:hover:bg-[#E0E0E0] active:scale-[0.96]"
            >
              Shorten
              <span className="material-symbols-outlined text-sm transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
            </button>
          </div>
        </form>

        {/* Keystroke Micro-UI */}
        <div className="mt-12 flex items-center gap-2 text-xs text-text-muted dark:text-d-text-muted">
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 bg-bg-muted dark:bg-d-bg-muted border border-border-subtle dark:border-d-border-subtle rounded-[4px] font-mono text-text-main dark:text-d-text-main">
            Enter
          </kbd>
          <span>to shorten</span>
        </div>

      </main>

      {/* Inject Keyframe Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-\\[fade-in-up_600ms_cubic-bezier\\(0\\.16\\,1\\,0\\.3\\,1\\)\\] {
          animation: fade-in-up 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
}