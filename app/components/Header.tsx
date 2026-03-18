'use client';

import Link from "next/link";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function Header() {
  const [windowWidth, setWindowWidth] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setUser(data.session.user)
      } else {
        setUser(null)
      }
    })
    
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSearch = () => {
    const query = searchRef.current?.value.trim();
    if (query) {
      router.push(`/search/${encodeURIComponent(query)}`);
    }
  };

  const MIN_LOGO_WIDTH = 450;

  return (
    <div className="flex backdrop-blur-xs fixed h-20 max-lg:h-16 w-full bg-gradient-to-b from-gray-950 justify-between items-center px-12 max-2xl:px-5 max-lg:px-3 z-50">
      {/* Left cluster: logo + nav */}
      <div className="flex items-center gap-2 min-w-0">
        <Link href='/' className="mr-1 transition-all hover:opacity-50 flex items-center" aria-label="Home">
          {windowWidth < MIN_LOGO_WIDTH ? (
            <Image
              src="/icon.ico"
              alt="Logo"
              width={28}
              height={28}
              className="w-7 h-7 rounded-md"
              unoptimized
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 900 220"
              width="112.45px"
              height="32px"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700&display=swap');`}</style>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff2b2b" />
                  <stop offset="50%" stopColor="#ff2b7f" />
                  <stop offset="100%" stopColor="#7a2cff" />
                </linearGradient>
              </defs>
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="url(#grad)"
                fontFamily="Poppins, sans-serif"
                fontSize="120"
                fontWeight="700"
                letterSpacing="1"
              >
                povertymovie
              </text>
            </svg>
          )}
        </Link>

        {/* Desktop/tablet anime link */}
        <Link
          href="/anime"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <span>🎌</span>
          <span>Anime</span>
        </Link>
      </div>

      {/* Right side: search + profile (+ mobile anime icon) */}
      <div className="flex items-center gap-2">
        <div className="flex items-center relative hover:opacity-80 transition-all">
          <button aria-label="Search" onClick={handleSearch} className="w-10 h-full absolute left-0 top-1/2 -translate-y-1/2 bg-white/5 p-2 rounded-l-xl hover:bg-white/15 transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={24} height={24}>
              <path fill="#ffffff" d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/>
            </svg>
          </button>
          <input className="pl-12 py-2 bg-white/15 rounded-xl outline-0 outline-white/30 focus:outline-1 line-clamp-1 max-xs:w-[280px] max-xss:w-[224px]" placeholder="Type to search..." ref={searchRef} onKeyDown={(e) => { if (e.key === 'Enter') {handleSearch();} }} />
        </div>
        {/* Mobile anime icon (anime was previously hidden on phones) */}
        <Link
          href="/anime"
          className="sm:hidden bg-white/15 rounded-xl transition-all hover:scale-95 px-2 py-2"
          aria-label="Anime"
        >
          <span className="text-lg leading-none">🎌</span>
        </Link>
        <Link href='/user' className="bg-white/15 rounded-xl transition-all hover:scale-95" aria-label="Profile">
          {user && user.user_metadata?.avatar_url ? (
            <Image 
              width={40}
              height={40}
              src={user.user_metadata.avatar_url}
              alt="Profile"
              className="rounded-xl"
              referrerPolicy="no-referrer"
              unoptimized
            />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={32} height={32} className="m-1">
              <path fill="#ffffff" d="M406.5 399.6C387.4 352.9 341.5 320 288 320l-64 0c-53.5 0-99.4 32.9-118.5 79.6C69.9 362.2 48 311.7 48 256C48 141.1 141.1 48 256 48s208 93.1 208 208c0 55.7-21.9 106.2-57.5 143.6zm-40.1 32.7C334.4 452.4 296.6 464 256 464s-78.4-11.6-110.5-31.7c7.3-36.7 39.7-64.3 78.5-64.3l64 0c38.8 0 71.2 27.6 78.5 64.3zM256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-272a40 40 0 1 1 0-80 40 40 0 1 1 0 80zm-88-40a88 88 0 1 0 176 0 88 88 0 1 0 -176 0z"/>
            </svg>
          )}
        </Link>
      </div>
    </div>
  );
}