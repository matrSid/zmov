'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { supabase } from '@/utils/supabase';

// ─── AniList helpers ──────────────────────────────────────────────────────────

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

const DETAIL_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title { romaji english native }
      coverImage { large extraLarge }
      bannerImage
      episodes
      genres
      averageScore
      description(asHtml: false)
      status
      season
      seasonYear
      format
      studios(isMain: true) { nodes { name } }
      characters(sort: ROLE, role: MAIN, perPage: 6) {
        nodes { name { full } image { large } }
      }
      recommendations(sort: RATING_DESC, perPage: 8) {
        nodes {
          mediaRecommendation {
            id
            title { romaji english }
            coverImage { large }
            averageScore
          }
        }
      }
    }
  }
`;

// ─── Source definitions ───────────────────────────────────────────────────────

type SubDub = 'sub' | 'dub';

interface Source {
  id: string;
  label: string;
  getUrl: (anilistId: number, episode: number, type: SubDub) => string;
}

const SOURCES: Source[] = [
  {
    id: 'vidnest',
    label: 'VidNest',
    getUrl: (id, ep, type) => `https://vidnest.fun/anime/${id}/${ep}/${type}`,
  },
  {
    id: 'vidsrc_cc',
    label: 'VidSrc.cc',
    getUrl: (id, ep, type) => `https://vidsrc.cc/v2/embed/anime/${id}/${ep}/${type}`,
  },
  {
    id: 'vidsrc_icu',
    label: 'VidSrc.icu',
    getUrl: (id, ep, type) => `https://vidsrc.icu/embed/anime/${id}/${ep}/${type === 'sub' ? '0' : '1'}`,
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface AniDetail {
  id: number;
  title: { romaji: string; english?: string; native?: string };
  coverImage: { large: string; extraLarge: string };
  bannerImage?: string;
  episodes?: number;
  genres: string[];
  averageScore?: number;
  description?: string;
  status: string;
  season?: string;
  seasonYear?: number;
  format?: string;
  studios: { nodes: { name: string }[] };
  characters: { nodes: { name: { full: string }; image: { large: string } }[] };
  recommendations: {
    nodes: {
      mediaRecommendation?: {
        id: number;
        title: { romaji: string; english?: string };
        coverImage: { large: string };
        averageScore?: number;
      };
    }[];
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnimeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const animeId = Number(params.id);

  const [anime, setAnime] = useState<AniDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEp, setSelectedEp] = useState(1);
  const [subDub, setSubDub] = useState<SubDub>('sub');
  const [sourceId, setSourceId] = useState('vidnest');
  const [descExpanded, setDescExpanded] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);

  // ─── Fetch anime details ──────────────────────────────────────────────────

  useEffect(() => {
    if (!animeId || isNaN(animeId)) { router.push('/anime'); return; }
    setLoading(true);
    setError(null);
    anilistFetch(DETAIL_QUERY, { id: animeId })
      .then((data) => setAnime(data.Media))
      .catch((e) => { console.error(e); setError('Failed to load anime details.'); })
      .finally(() => setLoading(false));
  }, [animeId, router]);

  // ─── Save progress to Supabase ────────────────────────────────────────────

  const saveProgress = useCallback(async (episode: number) => {
    if (!anime) return;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return; // not logged in, skip silently

    setSavingProgress(true);
    const userId = sessionData.session.user.id;
    const title = anime.title.english || anime.title.romaji;

    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from('watcheditem')
        .select('id')
        .eq('userid', userId)
        .eq('itemid', animeId)
        .eq('type', 'anime')
        .maybeSingle();

      const payload = {
        userid: userId,
        itemid: animeId,
        title,
        poster: anime.coverImage.extraLarge || anime.coverImage.large,
        duration: anime.episodes ?? null,
        progress: episode,
        type: 'anime',
        season: null,
        episode,
      };

      if (existing) {
        await supabase.from('watcheditem').update({ progress: episode, episode }).eq('id', existing.id);
      } else {
        await supabase.from('watcheditem').insert(payload);
      }
    } catch (e) {
      console.error('Failed to save progress', e);
    } finally {
      setSavingProgress(false);
    }
  }, [anime, animeId]);

  // Auto-save when episode changes (debounced)
  useEffect(() => {
    if (!anime) return;
    const t = setTimeout(() => saveProgress(selectedEp), 1500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEp]);

  // ─── Computed embed URL ───────────────────────────────────────────────────

  const source = SOURCES.find((s) => s.id === sourceId) ?? SOURCES[0];
  const embedUrl = source.getUrl(animeId, selectedEp, subDub);

  const totalEps = anime?.episodes ?? 0;
  const title = anime ? (anime.title.english || anime.title.romaji) : '';

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#2a1a2e_0%,_transparent_60%)] pt-16">
          <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-4 animate-pulse">
            <div className="h-72 rounded-2xl bg-white/10" />
            <div className="h-8 w-64 bg-white/10 rounded" />
            <div className="h-4 w-1/2 bg-white/5 rounded" />
            <div className="h-96 rounded-xl bg-white/10" />
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !anime) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[radial-gradient(ellipse_at_top,_#2a1a2e_0%,_transparent_60%)] pt-16">
          <p className="text-red-400">{error ?? 'Anime not found.'}</p>
          <Link href="/anime" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm cursor-pointer">
            Back to Anime
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const desc = anime.description ?? '';
  const shortDesc = desc.length > 300 ? desc.slice(0, 300) + '…' : desc;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#2a1a2e_0%,_transparent_60%)] pt-16">

        {/* Banner */}
        {anime.bannerImage && (
          <div className="relative h-48 sm:h-64 overflow-hidden">
            <img src={anime.bannerImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0d0d14]" />
          </div>
        )}

        <div className="max-w-[1400px] mx-auto px-4 pb-12">

          {/* Back link */}
          <Link href="/anime" className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 text-sm mt-4 mb-6 transition-colors">
            ← Back to Anime
          </Link>

          {/* Info section */}
          <div className="flex flex-col sm:flex-row gap-6 mb-8">
            <div className="flex-shrink-0">
              <img
                src={anime.coverImage.extraLarge || anime.coverImage.large}
                alt={title}
                className="w-36 sm:w-48 rounded-xl shadow-2xl border border-white/10"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {anime.format && (
                  <span className="text-xs bg-purple-600/70 text-white px-2 py-0.5 rounded-full">{anime.format}</span>
                )}
                {anime.status && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${anime.status === 'RELEASING' ? 'bg-green-600/50 text-green-200' : 'bg-white/10 text-white/50'}`}>
                    {anime.status === 'RELEASING' ? 'Airing' : anime.status.replace('_', ' ')}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-1">{title}</h1>
              {anime.title.native && (
                <p className="text-white/40 text-sm mb-2">{anime.title.native}</p>
              )}
              <div className="flex flex-wrap gap-3 text-sm text-white/60 mb-3">
                {anime.averageScore && (
                  <span className="text-yellow-400 font-semibold">★ {(anime.averageScore / 10).toFixed(1)}</span>
                )}
                {anime.seasonYear && <span>{anime.season ? `${anime.season} ` : ''}{anime.seasonYear}</span>}
                {anime.episodes && <span>{anime.episodes} episodes</span>}
                {anime.studios.nodes[0] && <span>{anime.studios.nodes[0].name}</span>}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {anime.genres.map((g) => (
                  <span key={g} className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full">{g}</span>
                ))}
              </div>
              {desc && (
                <div>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {descExpanded ? desc : shortDesc}
                  </p>
                  {desc.length > 300 && (
                    <button
                      onClick={() => setDescExpanded(!descExpanded)}
                      className="text-purple-400 text-xs mt-1 cursor-pointer hover:text-purple-300"
                    >
                      {descExpanded ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Player section */}
          <div className="mb-8">
            {/* Controls bar */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="text-white font-semibold text-sm">
                Episode {selectedEp} {savingProgress && <span className="text-white/30 text-xs ml-1">(saving…)</span>}
              </span>

              {/* Sub / Dub */}
              <div className="flex bg-white/10 rounded-lg p-0.5 gap-0.5">
                {(['sub', 'dub'] as SubDub[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSubDub(t)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer uppercase ${
                      subDub === t ? 'bg-purple-600 text-white' : 'text-white/50 hover:text-white/80'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Source switcher */}
              <div className="flex gap-1.5 ml-auto flex-wrap">
                {SOURCES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSourceId(s.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      sourceId === s.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* iFrame Player */}
            <div className="relative w-full bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl" style={{ paddingBottom: '56.25%' }}>
              <iframe
                key={`${sourceId}-${selectedEp}-${subDub}`}
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                referrerPolicy="origin"
                allow="autoplay; fullscreen; picture-in-picture"
              />
            </div>
            <p className="text-white/20 text-xs mt-1.5">
              If the player doesn't work, try a different source above.
            </p>
          </div>

          {/* Episode grid */}
          {totalEps > 0 && (
            <div className="mb-8">
              <h2 className="text-white font-semibold mb-3">Episodes</h2>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: totalEps }).map((_, i) => {
                  const ep = i + 1;
                  return (
                    <button
                      key={ep}
                      onClick={() => setSelectedEp(ep)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        selectedEp === ep
                          ? 'bg-purple-600 text-white scale-110 shadow-lg shadow-purple-900/50'
                          : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      {ep}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Characters */}
          {anime.characters.nodes.length > 0 && (
            <div className="mb-8">
              <h2 className="text-white font-semibold mb-3">Main Characters</h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {anime.characters.nodes.map((c) => (
                  <div key={c.name.full} className="flex-shrink-0 flex flex-col items-center w-20 gap-1.5">
                    <img
                      src={c.image.large}
                      alt={c.name.full}
                      className="w-16 h-16 rounded-full object-cover border border-white/20"
                    />
                    <p className="text-xs text-white/60 text-center leading-tight">{c.name.full}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {anime.recommendations.nodes.length > 0 && (
            <div>
              <h2 className="text-white font-semibold mb-3">You Might Also Like</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {anime.recommendations.nodes
                  .filter((n) => n.mediaRecommendation)
                  .map((n) => {
                    const rec = n.mediaRecommendation!;
                    return (
                      <Link key={rec.id} href={`/anime/${rec.id}`} className="group block">
                        <div className="relative overflow-hidden rounded-lg border border-white/10 hover:border-purple-500/40 transition-all hover:scale-[1.02]">
                          <img
                            src={rec.coverImage.large}
                            alt={rec.title.english || rec.title.romaji}
                            className="w-full aspect-[2/3] object-cover"
                          />
                          {rec.averageScore && (
                            <div className="absolute top-1 right-1 bg-black/60 text-yellow-400 text-[10px] font-bold px-1 py-0.5 rounded">
                              ★ {(rec.averageScore / 10).toFixed(1)}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-white/60 mt-1 line-clamp-2 leading-tight">
                          {rec.title.english || rec.title.romaji}
                        </p>
                      </Link>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}