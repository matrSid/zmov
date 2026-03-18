'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

// ─── AniList GraphQL helpers ──────────────────────────────────────────────────

const ANILIST_URL = 'https://graphql.anilist.co';

async function anilistFetch(query: string, variables: object) {
  const res = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

const TRENDING_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: TRENDING_DESC, status_in: [RELEASING, FINISHED]) {
        id
        title { romaji english }
        coverImage { large extraLarge }
        episodes
        averageScore
        genres
        status
        seasonYear
        format
      }
    }
  }
`;

const SEARCH_QUERY = `
  query ($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, search: $search, sort: SEARCH_MATCH) {
        id
        title { romaji english }
        coverImage { large extraLarge }
        episodes
        averageScore
        genres
        status
        seasonYear
        format
      }
    }
  }
`;

const POPULAR_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: POPULARITY_DESC, status_in: [RELEASING, FINISHED]) {
        id
        title { romaji english }
        coverImage { large extraLarge }
        episodes
        averageScore
        genres
        status
        seasonYear
        format
      }
    }
  }
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface AniMedia {
  id: number;
  title: { romaji: string; english?: string };
  coverImage: { large: string; extraLarge: string };
  episodes?: number;
  averageScore?: number;
  genres: string[];
  status: string;
  seasonYear?: number;
  format?: string;
}

// ─── AnimeCard component ──────────────────────────────────────────────────────

function AnimeCard({ anime }: { anime: AniMedia }) {
  const title = anime.title.english || anime.title.romaji;
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;

  return (
    <Link href={`/anime/${anime.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-neutral-900 border border-white/10 hover:border-red-500/40 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-red-900/20">
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={anime.coverImage.extraLarge || anime.coverImage.large}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {/* Score badge */}
          {score && (
            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-yellow-400 text-xs font-bold px-1.5 py-0.5 rounded-md">
              ★ {score}
            </div>
          )}
          {/* Format badge */}
          {anime.format && (
            <div className="absolute top-2 left-2 bg-red-600/80 backdrop-blur-sm text-white text-xs font-semibold px-1.5 py-0.5 rounded-md">
              {anime.format.replace('_', ' ')}
            </div>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
            <div className="flex flex-wrap gap-1 mb-2">
              {anime.genres.slice(0, 3).map((g) => (
                <span key={g} className="text-[10px] bg-white/20 text-white/80 px-1.5 py-0.5 rounded-full">{g}</span>
              ))}
            </div>
            <span className="text-white/70 text-xs">{anime.episodes ? `${anime.episodes} eps` : 'Ongoing'}</span>
          </div>
        </div>
        <div className="p-2">
          <p className="text-sm font-medium text-white line-clamp-2 leading-tight">{title}</p>
          <p className="text-xs text-white/40 mt-0.5">{anime.seasonYear || ''}</p>
        </div>
      </div>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnimePage() {
  const [tab, setTab] = useState<'trending' | 'popular'>('trending');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [animeList, setAnimeList] = useState<AniMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAnime = useCallback(async (mode: 'trending' | 'popular' | 'search', q?: string) => {
    setLoading(true);
    setError(null);
    try {
      let data: AniMedia[] = [];
      if (mode === 'search' && q) {
        const res = await anilistFetch(SEARCH_QUERY, { search: q, page: 1, perPage: 40 });
        data = res.Page.media;
      } else if (mode === 'popular') {
        const res = await anilistFetch(POPULAR_QUERY, { page: 1, perPage: 40 });
        data = res.Page.media;
      } else {
        const res = await anilistFetch(TRENDING_QUERY, { page: 1, perPage: 40 });
        data = res.Page.media;
      }
      setAnimeList(data);
    } catch (e) {
      console.error(e);
      setError('Failed to load anime. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAnime(tab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim()) {
      fetchAnime(tab);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchAnime('search', search.trim());
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#2a1a2e_0%,_transparent_60%)] pt-16">
        {/* Hero / Title area */}
        <div className="max-w-[1600px] mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white">
                Anime <span className="text-purple-400">Mode</span>
              </h1>
              <p className="text-white/50 text-sm mt-1">Powered by AniList</p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="sm:ml-auto flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search anime..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setSearch(e.target.value);
                }}
                className="flex-1 sm:w-72 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>

          {/* Tab switcher (only show when not searching) */}
          {!search.trim() && (
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setTab('trending')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  tab === 'trending'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                🔥 Trending
              </button>
              <button
                onClick={() => setTab('popular')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  tab === 'popular'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                ⭐ Popular
              </button>
            </div>
          )}

          {search.trim() && (
            <p className="text-white/50 text-sm mb-4">
              Results for <span className="text-white font-medium">"{search}"</span>
              <button
                onClick={() => { setSearch(''); setSearchInput(''); }}
                className="ml-2 text-purple-400 hover:text-purple-300 cursor-pointer"
              >
                ✕ Clear
              </button>
            </p>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[2/3] rounded-xl bg-white/10" />
                  <div className="h-3 bg-white/10 rounded mt-2 mx-2" />
                  <div className="h-2 bg-white/5 rounded mt-1 mx-2 w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center min-h-60 gap-3">
              <p className="text-red-400">{error}</p>
              <button
                onClick={() => fetchAnime(tab)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : animeList.length === 0 ? (
            <div className="flex items-center justify-center min-h-60">
              <p className="text-white/40">No results found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
              {animeList.map((anime) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}