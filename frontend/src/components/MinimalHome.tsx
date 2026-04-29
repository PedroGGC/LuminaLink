import React, { useState, useEffect } from 'react';

interface Props {
  onLoginClick: () => void;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
}

export default function MinimalHome({ onLoginClick, isDark, setIsDark }: Props) {
  const [url, setUrl] = useState('');
  const [shortenedLink, setShortenedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('anonymousId')) {
      localStorage.setItem('anonymousId', crypto.randomUUID());
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setIsLoading(true);
    setShortenedLink(null);
    setCopied(false);
    
    try {
      const anonymousId = localStorage.getItem('anonymousId');
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ originalUrl: url, anonymousId })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setShortenedLink(data.shortUrl);
        setUrl('');
      } else {
        console.error('Error creating link:', data.error);
        // Optional: Show error to user
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (shortenedLink) {
      navigator.clipboard.writeText(shortenedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div 
      className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-bg-base dark:bg-[#111111] text-text-main dark:text-d-text-main transition-colors duration-300" 
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
            className="text-sm font-medium text-[#787774] hover:text-[#111111] dark:text-[#A0A0A0] dark:hover:text-white transition-colors flex items-center"
            title="Toggle Theme"
          >
            <span className="material-symbols-outlined" style={{fontSize: 20}}>
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <button 
            onClick={onLoginClick}
            className="text-sm font-medium px-4 py-1.5 border border-[#EAEAEA] dark:border-[#333333] rounded-[6px] hover:bg-[#F9F9F8] dark:hover:bg-[#222222] transition-colors"
          >
            Log in
          </button>
        </div>
      </header>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none -z-10 flex items-center justify-center overflow-hidden opacity-[0.03]">
        <div className="w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,#111_0%,transparent_70%)] dark:bg-[radial-gradient(circle,#fff_0%,transparent_70%)] blur-3xl mix-blend-multiply dark:mix-blend-screen" />
      </div>

      <main className="w-full max-w-3xl mx-auto flex flex-col items-center animate-[fade-in-up_600ms_cubic-bezier(0.16,1,0.3,1)] pt-24 pb-32">
        
        {/* Editorial Heading */}
        <h1 
          className="text-4xl md:text-6xl tracking-tight leading-[1.1] mb-6 text-center text-[#111111] dark:text-white" 
          style={{ fontFamily: "'Newsreader', 'Playfair Display', 'Lyon Text', serif", letterSpacing: '-0.03em' }}
        >
          Clean links. <br />
          Focus on what matters.
        </h1>
        
        {/* Subtitle */}
        <p className="text-[#787774] dark:text-[#A0A0A0] mb-12 text-center text-lg leading-[1.6] max-w-xl">
          Paste your long URL below. Create short, trackable, and professional links. No ads, no noise.
        </p>

        {/* Input & Button Component */}
        <form onSubmit={handleSubmit} className="w-full max-w-xl flex flex-col gap-4">
          <div className="relative flex items-center bg-[#FFFFFF] dark:bg-[#1A1A1A] border border-[#EAEAEA] dark:border-[#333333] rounded-[8px] p-1.5 transition-colors focus-within:border-[#111111] dark:focus-within:border-[#555555]">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-long-url-here.com"
              required
              className="flex-1 bg-transparent px-4 py-2.5 outline-none border-none focus:border-transparent focus:outline-none focus:ring-0 focus:ring-offset-0 shadow-none text-[#111111] dark:text-[#FFFFFF] placeholder:text-[#A0A0A0] dark:placeholder:text-[#666666] text-base"
              style={{ boxShadow: 'none' }}
            />
            <button
              type="submit"
              disabled={!url || isLoading}
              className="group flex items-center justify-center min-w-[100px] gap-2 bg-[#111111] dark:bg-[#FFFFFF] text-white dark:text-[#111111] px-6 py-2.5 rounded-[6px] text-sm font-medium transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#333333] dark:hover:bg-[#EAEAEA] active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="material-symbols-outlined text-sm animate-spin">sync</span>
              ) : (
                <>
                  Shorten
                  <span className="material-symbols-outlined text-sm transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Result Box */}
        {shortenedLink && (
          <div className="mt-8 w-full max-w-xl flex flex-col items-center animate-[fade-in-up_400ms_cubic-bezier(0.16,1,0.3,1)]">
            <div className="w-full flex items-center justify-between p-4 rounded-[8px] bg-[#EDF3EC] dark:bg-[#1C261C] border border-[#D5E5D4] dark:border-[#2A3A2A]">
              <span className="text-[#346538] dark:text-[#7FD186] font-medium truncate pr-4">{shortenedLink}</span>
              <button 
                onClick={handleCopy}
                className="flex items-center justify-center p-2 rounded-[4px] bg-[#FFFFFF] dark:bg-[#111111] border border-[#D5E5D4] dark:border-[#2A3A2A] text-[#346538] dark:text-[#7FD186] hover:scale-95 transition-transform"
                title="Copy link"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {copied ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
            <p className="mt-4 text-sm text-[#787774] dark:text-[#A0A0A0]">
              <button onClick={onLoginClick} className="underline hover:text-[#111111] dark:hover:text-white transition-colors">Log in</button> to get more insights about your links.
            </p>
          </div>
        )}

        {/* Keystroke Micro-UI */}
        {!shortenedLink && (
          <div className="mt-12 flex items-center gap-2 text-xs text-[#787774] dark:text-[#A0A0A0]">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 bg-[#F7F6F3] dark:bg-[#222222] border border-[#EAEAEA] dark:border-[#333333] rounded-[4px] font-mono text-[#111111] dark:text-white">
              Enter
            </kbd>
            <span>to shorten</span>
          </div>
        )}

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
        .animate-\\[fade-in-up_400ms_cubic-bezier\\(0\\.16\\,1\\,0\\.3\\,1\\)\\] {
          animation: fade-in-up 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
}