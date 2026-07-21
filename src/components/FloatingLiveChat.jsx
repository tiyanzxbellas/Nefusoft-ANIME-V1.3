import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

const FloatingLiveChat = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeRoom, setActiveRoom] = useState('global'); // 'global' or the current animeId
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Parse current page for anime info
  const match = location.pathname.match(/^\/anime\/([^/]+)/);
  const currentAnimeId = match ? match[1].split('-')[0] : null;
  const currentAnimeTitleRaw = match ? match[1].split('-').slice(1).join(' ') : '';

  const formatAnimeTitle = (titleRaw) => {
    if (!titleRaw) return '';
    return titleRaw
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };
  const currentAnimeTitle = formatAnimeTitle(currentAnimeTitleRaw);

  // Monitor path changes to auto-toggle room or ensure fallback
  useEffect(() => {
    if (currentAnimeId) {
      // If user is watching an anime, default to that anime's room
      setActiveRoom(currentAnimeId);
    } else {
      // Otherwise, fallback to global room
      setActiveRoom('global');
    }
  }, [currentAnimeId, location.pathname]);

  // Auth session listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle().then(({ data }) => {
        if (data) setProfile(data);
      });
    } else {
      setProfile(null);
    }
  }, [user]);

  // Fetch and subscribe to messages
  useEffect(() => {
    if (!isOpen) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('live_chat')
          .select('*, profiles(username, avatar_url, level)')
          .eq('anime_id', activeRoom)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error('Error fetching chat messages:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to realtime updates for the active room
    const channel = supabase
      .channel(`live_chat:${activeRoom}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat',
          filter: `anime_id=eq.${activeRoom}`,
        },
        async (payload) => {
          const newMsg = payload.new;
          try {
            const { data: prof } = await supabase
              .from('profiles')
              .select('username, avatar_url, level')
              .eq('id', newMsg.user_id)
              .maybeSingle();

            if (prof) {
              newMsg.profiles = prof;
            }
          } catch (e) {
            console.error('Error fetching profile for realtime message:', e);
          }

          setMessages((prev) => {
            // Prevent duplicate messages in local state
            if (prev.some((msg) => msg.id === newMsg.id)) {
              return prev;
            }
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRoom, isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const chatData = {
      user_id: user.id,
      anime_id: activeRoom,
      user_name: profile?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      user_avatar: profile?.avatar_url || user.user_metadata?.avatar_url || '',
      message: newMessage.trim(),
    };

    try {
      const { error } = await supabase.from('live_chat').insert([chatData]);
      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Gagal mengirim pesan. Silakan pastikan skema database live_chat dan RLS policy sudah dikonfigurasi di Supabase SQL Editor / SQL Injector Anda.\n\nDetail Error: ' + (err.message || JSON.stringify(err)));
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/home',
        },
      });
      if (error) throw error;
    } catch (e) {
      console.error('Google Auth Error:', e.message);
      alert('Gagal login dengan Google: ' + e.message);
    }
  };

  const formatChatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 left-4 md:left-auto md:right-6 md:w-96 h-[480px] md:h-[500px] bg-[#16161a] border border-white/10 rounded-2xl shadow-2xl flex flex-col z-[95] overflow-hidden select-text font-nunito animate-[slideUp_0.2s_ease-out]">
          {/* Header */}
          <div className="bg-[#1e1e24] px-4 py-3 border-b border-white/5 flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                <h3 className="text-white font-black uppercase text-xs tracking-wider">Live Chat Room</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
                aria-label="Tutup live chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Room Switcher Tabs if on an anime page */}
            {currentAnimeId && (
              <div className="flex bg-[#0a0a0c] p-1 rounded-lg border border-white/5 mt-1">
                <button
                  onClick={() => setActiveRoom('global')}
                  className={`flex-1 text-center py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${
                    activeRoom === 'global'
                      ? 'bg-[#F6CF80] text-black shadow-md'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  Global
                </button>
                <button
                  onClick={() => setActiveRoom(currentAnimeId)}
                  className={`flex-1 text-center py-1.5 px-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all truncate ${
                    activeRoom !== 'global'
                      ? 'bg-[#F6CF80] text-black shadow-md'
                      : 'text-white/50 hover:text-white'
                  }`}
                  title={currentAnimeTitle}
                >
                  {currentAnimeTitle ? currentAnimeTitle : 'Anime'}
                </button>
              </div>
            )}
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-[#16161a]">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-[#F6CF80] text-xs font-bold animate-pulse">Memuat obrolan...</span>
              </div>
            ) : messages.length > 0 ? (
              messages.map((msg) => {
                const avatarSrc = msg.profiles?.avatar_url || msg.user_avatar;
                const displayName = msg.profiles?.username || msg.user_name;
                const userLevel = msg.profiles?.level || 1;
                return (
                  <div key={msg.id} className="flex gap-2.5 items-start text-xs">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-white/5 shrink-0 border border-white/10 flex items-center justify-center">
                      {avatarSrc ? (
                        <img src={avatarSrc} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-[#F6CF80] font-black text-[10px] uppercase">
                          {displayName?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex items-baseline gap-1.5 mb-0.5 flex-wrap">
                        <span className="font-black text-[#F6CF80] truncate max-w-[140px]">{displayName}</span>
                        <span className="bg-[#F6CF80] text-black text-[8px] font-black px-1.5 py-0.2 rounded-full shrink-0 scale-90">
                          Lv.{userLevel}
                        </span>
                        <span className="text-[8px] text-white/30 font-bold">{formatChatTime(msg.created_at)}</span>
                      </div>
                      <p className="text-white/80 font-medium break-words whitespace-pre-wrap leading-relaxed">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center text-white/30 p-4">
                <svg className="w-8 h-8 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-[11px] font-bold">Belum ada obrolan di ruangan ini. Mulai obrolan pertamamu!</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 border-t border-white/5 bg-[#1e1e24]/50 shrink-0">
            {user ? (
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Tulis pesan di ${activeRoom === 'global' ? 'Global Chat' : 'Anime Chat'}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-[#0a0a0c] text-white placeholder-white/30 border border-white/10 px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#F6CF80]/40 transition-colors"
                  maxLength={200}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-[#F6CF80] text-black font-black text-[11px] uppercase tracking-wider px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:active:scale-100 shrink-0"
                >
                  Kirim
                </button>
              </form>
            ) : (
              <div className="text-center py-2 flex flex-col items-center gap-2">
                <p className="text-[10px] text-white/50 font-bold">Silakan login untuk ikut mengobrol</p>
                <button
                  onClick={handleGoogleLogin}
                  className="flex items-center justify-center gap-2 bg-white hover:bg-white/90 text-black py-2 px-4 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Login dengan Google
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) - Only shown when chat is closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 md:right-8 w-14 h-14 bg-[#F6CF80] text-black rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(246,207,128,0.4)] hover:scale-105 active:scale-95 transition-all z-[95] cursor-pointer group"
          aria-label="Buka live chat"
        >
          <div className="relative">
            <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 border border-black rounded-full"></span>
          </div>
        </button>
      )}
    </>
  );
};

export default FloatingLiveChat;