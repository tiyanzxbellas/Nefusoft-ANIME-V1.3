import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

const LiveChat = ({ animeId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
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

  useEffect(() => {
    if (!animeId) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('live_chat')
          .select('*, profiles(username, avatar_url, level)')
          .eq('anime_id', animeId)
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

    // Subscribe to realtime updates for this anime
    const channel = supabase
      .channel(`live_chat:${animeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat',
          filter: `anime_id=eq.${animeId}`,
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
  }, [animeId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const chatData = {
      user_id: user.id,
      anime_id: animeId,
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

  const formatChatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="bg-[#16161a] border border-white/5 rounded-sm overflow-hidden flex flex-col h-[400px] md:h-[450px] shadow-xl w-full">
      <div className="bg-[#1e1e24] px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <h3 className="text-white font-black uppercase text-xs tracking-wider">Live Chat</h3>
        </div>
        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
          {messages.length} pesan
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
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
                    <span className="font-black text-[#F6CF80] truncate max-w-[120px]">{displayName}</span>
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
            <span className="text-[11px] font-bold">Belum ada obrolan. Mulai obrolan pertamamu!</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-3 border-t border-white/5 bg-[#1e1e24]/50">
        {user ? (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              placeholder="Tulis pesan..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 bg-[#0a0a0c] text-white placeholder-white/30 border border-white/10 px-3.5 py-2 rounded-lg text-xs font-bold outline-none focus:border-[#F6CF80]/40 transition-colors"
              maxLength={200}
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-[#F6CF80] text-black font-black text-[11px] uppercase tracking-wider px-4 py-2 rounded-lg transition-all active:scale-95 disabled:opacity-40 disabled:active:scale-100 shrink-0"
            >
              Kirim
            </button>
          </form>
        ) : (
          <div className="text-center py-1">
            <p className="text-[10px] text-white/50 font-bold mb-1.5">Silakan login untuk ikut mengobrol</p>
            <span className="inline-block text-[10px] font-black uppercase text-[#F6CF80] tracking-wider bg-[#F6CF80]/10 px-3 py-1.5 rounded-full border border-[#F6CF80]/20">
              Gunakan Akun Google di Menu Profil (Navbar Atas)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveChat;