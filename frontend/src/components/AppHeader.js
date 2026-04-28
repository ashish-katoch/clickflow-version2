import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount, getNotifications, markAllRead } from '../lib/api';
import { Search, Bell, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';

export default function AppHeader() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);

  const fetchUnread = useCallback(async () => {
    try { const d = await getUnreadCount(); setUnread(d.count); } catch {}
  }, []);
  useEffect(() => { fetchUnread(); const i = setInterval(fetchUnread, 15000); return () => clearInterval(i); }, [fetchUnread]);

  const handleOpen = async (val) => {
    setOpen(val);
    if (val) { try { setNotifs(await getNotifications()); } catch {} }
  };
  const handleMarkRead = async () => {
    await markAllRead(); setUnread(0);
    setNotifs(n => n.map(x => ({ ...x, read: true })));
  };

  return (
    <header className="h-14 flex-shrink-0 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10" data-testid="app-header">
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <Search size={15} className="text-zinc-500" />
        <input type="text" placeholder="Search..." data-testid="search-input"
          className="bg-transparent text-sm outline-none w-full text-zinc-300 placeholder:text-zinc-600" />
      </div>
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={handleOpen}>
          <PopoverTrigger asChild>
            <button className="h-8 w-8 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 transition-colors relative" data-testid="notifications-btn">
              <Bell size={16} />
              {unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-indigo-500 rounded-full text-[10px] font-bold flex items-center justify-center px-1">{unread}</span>}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 bg-zinc-900 border-zinc-800" align="end">
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Notifications</span>
              {unread > 0 && <button onClick={handleMarkRead} className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><Check size={10} />Mark all read</button>}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifs.length === 0 ? <p className="text-xs text-zinc-600 p-4 text-center">No notifications</p> : notifs.map(n => (
                <div key={n.id} className={`px-3 py-2 border-b border-zinc-800/50 text-xs ${n.read ? 'text-zinc-500' : 'text-zinc-300 bg-zinc-800/20'}`}>
                  <div>{n.message}</div>
                  <div className="text-[10px] text-zinc-600 mt-0.5">{new Date(n.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center" data-testid="user-avatar">
          <span className="text-[10px] font-bold text-white">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
        </div>
      </div>
    </header>
  );
}
