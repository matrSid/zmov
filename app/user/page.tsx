'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import WatchCard, { WatchCardData } from '@/app/components/WatchCard';
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type WatchItem = WatchCardData & {
  id: number;
  createdAt: string;
};

export default function Home() {
  const [watchedItems, setWatchedItems] = useState<WatchItem[]>([])
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profileName, setProfileName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const router = useRouter();

  const fetchWatchedItems = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('watcheditem')
        .select('*')
        .eq('userid', userId)
        .order('createdat', { ascending: false });

      if (error) {
        console.error('Error fetching watched items:', error);
        return;
      }

      if (data) {
        const mapped: WatchItem[] = data.map((row: any) => ({
          id: row.id,
          itemId: row.itemid,
          title: row.title,
          poster: row.poster,
          duration: row.duration,
          progress: row.progress,
          type: row.type,
          season: row.season ?? undefined,
          episode: row.episode ?? undefined,
          createdAt: row.createdat,
        }));
        setWatchedItems(mapped);
      }
    } catch (e) {
      console.error('Failed to fetch watched items', e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        if (data.session) {
          setUser(data.session.user);
          setProfileName(data.session.user.user_metadata?.name ?? "");
          setAvatarUrl(data.session.user.user_metadata?.avatar_url ?? "");
          // fetch watched items for logged in user
          await fetchWatchedItems(data.session.user.id);
        } else {
          // not logged in
          router.push('/login');
          setUser(null);
          setWatchedItems([]);
        }
      } catch (e) {
        console.error('Error getting session', e);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [fetchWatchedItems, router]);

  const signOutUser = async () => {
    const { error } = await supabase.auth.signOut();
    router.push('/')
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  const clearWatched = async () => {
    if (!user) return;
    setWatchedItems([]);

    const { error } = await supabase
      .from('watcheditem')
      .delete()
      .eq('userid', user.id);

    if (error) {
      console.error('Error clearing watched items:', error);
    }
  };

  const removeWatchItem = async (itemId: number, type: string) => {
    if (!user) return;

    setWatchedItems((prev) =>
      prev.filter((t) => !(t.itemId === itemId && t.type === type))
    );

    const { error } = await supabase
      .from('watcheditem')
      .delete()
      .eq('userid', user.id)
      .eq('itemid', itemId)
      .eq('type', type);

    if (error) {
      console.error('Error removing watch item:', error);
    }
  };

  const handleProfileSave = async () => {
    if (!user) return;
    setProfileError(null);
    setSavingProfile(true);
    try {
      let newAvatarUrl = avatarUrl || null;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `avatars/${user.id}-${Date.now()}.${fileExt || 'png'}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
          setProfileError(uploadError.message);
          setSavingProfile(false);
          return;
        }

        const { data: publicData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        newAvatarUrl = publicData.publicUrl;
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          name: profileName || null,
          avatar_url: newAvatarUrl,
        },
      });
      if (error) {
        setProfileError(error.message);
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user as SupabaseUser);
        setProfileName(data.user.user_metadata?.name ?? "");
        setAvatarUrl(data.user.user_metadata?.avatar_url ?? "");
        setAvatarFile(null);
        setEditingProfile(false);
      }
    } catch (e) {
      setProfileError('Failed to update profile.');
      console.error(e);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <>
      <Header />
      <div className='flex flex-col items-center min-h-screen p-4 pt-16 max-lg:p-2 max-lg:pt-16 bg-[radial-gradient(circle_at_top,_#382222_0%,_transparent_70%)]'>
        <h1 className='text-5xl text-center font-semibold my-6 w-full max-w-[1600px] max-xs:text-4xl'>
          Welcome Back
          {user ? ` ${user.user_metadata?.name || user.email || ""}` : ""}!
        </h1>

        {user && editingProfile && (
          <div className="w-full max-w-[1600px] mb-4 flex flex-col gap-2 border border-white/20 bg-white/5 rounded-xl p-3 max-sm:p-2">
            <p className="font-semibold text-lg">Edit profile</p>
            <div className="flex flex-col gap-3 max-sm:text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-white/80">Display name</span>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-neutral-900/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </label>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-white/80">Profile picture (optional)</span>
                {avatarUrl && (
                  <div className="flex items-center gap-3">
                    <img
                      src={avatarUrl}
                      alt="Current avatar"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      className="px-3 py-1 text-sm bg-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-800"
                      onClick={() => setAvatarUrl("")}
                    >
                      Remove current
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setAvatarFile(file);
                  }}
                  className="text-sm"
                />
              </div>
              {profileError && (
                <p className="text-sm text-red-400">{profileError}</p>
              )}
              <div className="flex gap-2 mt-1">
                <button
                  onClick={handleProfileSave}
                  disabled={savingProfile}
                  className="px-4 py-2 bg-red-600 text-white rounded cursor-pointer hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingProfile ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProfile(false);
                    setProfileError(null);
                    setAvatarFile(null);
                    if (user) {
                      setProfileName(user.user_metadata?.name ?? "");
                      setAvatarUrl(user.user_metadata?.avatar_url ?? "");
                    }
                  }}
                  className="px-4 py-2 bg-neutral-700 text-white rounded cursor-pointer hover:bg-neutral-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="relative border border-white/20 w-full flex flex-col gap-2 bg-white/10 rounded-xl p-2 max-w-[1600px] max-sm:p-1">
          
          <div className='absolute z-40 top-0 right-0 p-1 gap-2 flex bg-neutral-900/25 backdrop-blur-sm rounded-tr-xl rounded-bl-xl'>
            <button
              className="bg-neutral-50/20 hover:bg-neutral-50/10 px-2 h-8 rounded-lg cursor-pointer"
              onClick={() => setEditingProfile(true)}
            >
              Edit profile
            </button>
            <button className="bg-neutral-50/20 hover:bg-neutral-50/10 px-2 h-8 rounded-lg cursor-pointer" onClick={signOutUser}>Sign Out</button>
            <button className="bg-red-600/40 hover:bg-red-600/20 px-2 h-8 rounded-lg cursor-pointer" onClick={clearWatched}>Clear</button>
          </div>
          
          <div className='grid gap-2 items-center justify-center grid-cols-4 max-4xl:grid-cols-3 max-2xl:grid-cols-2 max-lg:grid-cols-1'>
            {watchedItems.length === 0 ? (
              <div className='flex items-center justify-center min-h-70 col-span-full'>
                <p className="text-white/70">No items to continue watching.</p>
              </div>
            ) : ( watchedItems.map((item) => (
              <WatchCard key={item.id} data={item} onRemove={() => removeWatchItem(item.itemId, item.type)}/>
            ))) }
          </div>
        </div>
        
      </div>
      <Footer />
    </>
  );
}
