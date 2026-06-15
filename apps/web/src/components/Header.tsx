'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { FileSharp, BookOpenSharp, Moon } from 'pixelarticons/react';

export default function Header() {
  const { user, loading, login, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isSketchesPage = pathname === '/sketches';

  if (pathname === '/auth/callback') return null;

  const themes = [
    { id: 'light', name: 'G-Pen Ink', icon: FileSharp },
    { id: 'tankobon', name: 'Recycled Book', icon: BookOpenSharp },
    { id: 'midnight', name: 'Midnight Moon', icon: Moon },
  ] as const;

  const firstLetter = user?.email?.[0] || 'M';

  return (
    <header className='relative sticky top-0 z-50 w-full bg-background border-b-4 border-foreground text-foreground transition-colors duration-200'>
      <div className='max-w-[1200px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between'>
        {/* Left Section: Brand Logo */}
        <div className='flex items-center'>
          <Link
            href='/'
            className='font-display text-2xl md:text-3xl tracking-wider hover:opacity-85 transition-opacity'
          >
            MANGASKETCH
          </Link>
        </div>

        {/* Center Section: Cartoonish Binder Tab (Visible if Logged In) */}
        {user && (
          <div className="absolute left-1/2 transform -translate-x-1/2 bottom-[-22px] z-30">
            <Link 
              href="/sketches" 
              className={`block font-display text-xs md:text-sm tracking-wider px-5 py-2 border-2 border-foreground bg-background text-foreground transition-all rotate-[-2.5deg] neo-shadow-sm hover:-translate-y-0.5 hover:neo-shadow active:translate-y-0 cursor-pointer uppercase ${
                isSketchesPage 
                  ? "bg-screentone-dense" 
                  : "hover:bg-screentone"
              }`}
            >
              MY SKETCHBOOK
            </Link>
          </div>
        )}

        {/* Right Section: Theme Selector & User Profile Stamp */}
        <div className='flex items-center gap-3 md:gap-4'>
          {/* Neo-Brutalist Pixel Art Theme Switcher */}
          <div className='flex border-2 border-foreground divide-x-2 divide-foreground neo-shadow-sm'>
            {themes.map(({ id, name, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                title={`Switch to ${name} mode`}
                className={`p-1.5 cursor-pointer transition-colors duration-150 ${
                  theme === id
                    ? 'bg-foreground text-background'
                    : 'bg-background text-foreground hover:bg-foreground hover:text-background'
                }`}
              >
                <Icon className='w-5 h-5' />
              </button>
            ))}
          </div>

          {/* User Auth Stamp Dropdown */}
          {loading ? (
            <div className='w-9 h-9 bg-neutral-light/30 border-2 border-foreground animate-pulse' />
          ) : user ? (
            <div className='relative'>
              {/* Hanko-like Initials Stamp Button */}
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className='w-9 h-9 border-2 border-foreground bg-background text-foreground font-display text-lg flex items-center justify-center neo-shadow-sm hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 cursor-pointer uppercase transition-all'
              >
                {firstLetter}
              </button>

              {dropdownOpen && (
                <>
                  {/* Click-away backdrop */}
                  <div
                    className='fixed inset-0 z-40 cursor-default'
                    onClick={() => setDropdownOpen(false)}
                  />

                  {/* Speech-balloon/Panel styled Dropdown */}
                  <div className='absolute right-0 mt-3 w-64 bg-background border-4 border-foreground neo-shadow p-4 z-50 text-foreground text-left'>
                    {/* Decorative tiny corner notch for cartoonish comic vibe */}
                    <div className='absolute top-[-10px] right-[10px] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-foreground' />

                    <div className='font-mono text-[10px] text-neutral tracking-widest uppercase mb-1'>
                      MANGAKA PROFILE
                    </div>
                    <div className='font-sans font-bold text-sm truncate mb-3'>
                      {user.email}
                    </div>
                    <div className='border-t-2 border-foreground my-3' />
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="w-full font-display py-2 border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 neo-shadow-sm cursor-pointer transition-all uppercase text-sm"
                    >
                      LOGOUT
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => login()}
              className='font-display px-5 py-1.5 text-sm md:text-base border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 neo-shadow-sm cursor-pointer transition-all uppercase'
            >
              LOGIN
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
