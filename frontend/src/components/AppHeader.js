import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getUnreadCount, getNotifications, markAllRead, getTasks, getBugs } from '../lib/api';
import { Search, Bell, Check, Sun, Moon, LogOut, User, Settings, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';

export default function AppHeader() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState([]);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const fetchUnread = useCallback(async () => {
    try { const d = await getUnreadCount(); setUnread(d.count); } catch {}
  }, []);
  useEffect(() => { fetchUnread(); const i = setInterval(fetchUnread, 15000); return () => clearInterval(i); }, [fetchUnread]);

  // Search debounce
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const [tasks, bugs] = await Promise.all([getTasks({}), getBugs({})]);
        const q = searchQuery.toLowerCase();
        const matchedTasks = tasks.filter(t => t.title.toLowerCase().includes(q) || t.key?.toLowerCase().includes(q)).slice(0, 5);
        const matchedBugs = bugs.filter(b => b.title.toLowerCase().includes(q) || b.key?.toLowerCase().includes(q)).slice(0, 5);
        setSearchResults({ tasks: matchedTasks, bugs: matchedBugs });
      } catch {}
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleNotifsOpen = async (val) => {
    setNotifsOpen(val);
    if (val) { try { setNotifs(await getNotifications()); } catch {} }
  };
  const handleMarkRead = async () => {
    await markAllRead(); setUnread(0);
    setNotifs(n => n.map(x => ({ ...x, read: true })));
  };

  return (
    <header className="h-14 flex-shrink-0 t-header border-b backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6" data-testid="app-header">
      {/* Search */}
      <div className="relative flex-1 max-w-lg">
        <div className="flex items-center gap-2">
          <Search size={15} className="t-text-muted" />
          <input type="text" placeholder="Search tasks and bugs..." data-testid="search-input"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm outline-none w-full t-text placeholder:t-text-muted" />
          {searchQuery && <button onClick={() => { setSearchQuery(''); setSearchResults(null); }} className="t-text-muted hover:t-text"><X size={14} /></button>}
        </div>
        {/* Search Results Dropdown */}
        {searchResults && (
          <div className="absolute top-full left-0 right-0 mt-2 t-dropdown border rounded-lg overflow-hidden z-50 max-h-80 overflow-y-auto" data-testid="search-results">
            {searchResults.tasks.length === 0 && searchResults.bugs.length === 0 ? (
              <p className="text-xs t-text-muted p-4 text-center">No results for "{searchQuery}"</p>
            ) : (
              <>
                {searchResults.tasks.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest t-text-muted font-semibold border-b t-border">Tasks</div>
                    {searchResults.tasks.map(t => (
                      <button key={t.id} onClick={() => { navigate(`/project/${t.project_id}/board`); setSearchQuery(''); setSearchResults(null); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-indigo-500/5 transition-colors" data-testid={`search-task-${t.id}`}>
                        <span className="text-[10px] t-text-muted font-mono">{t.key}</span>
                        <span className="t-text truncate">{t.title}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.bugs.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest t-text-muted font-semibold border-b t-border">Bugs</div>
                    {searchResults.bugs.map(b => (
                      <button key={b.id} onClick={() => { navigate(`/project/${b.project_id}/bugs`); setSearchQuery(''); setSearchResults(null); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-red-500/5 transition-colors" data-testid={`search-bug-${b.id}`}>
                        <span className="text-[10px] t-text-muted font-mono">{b.key}</span>
                        <span className="t-text truncate">{b.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <button onClick={toggleTheme} data-testid="theme-toggle-btn"
          className="h-8 w-8 rounded-md flex items-center justify-center t-text-secondary hover:t-text transition-colors"
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <Popover open={notifsOpen} onOpenChange={handleNotifsOpen}>
          <PopoverTrigger asChild>
            <button className="h-8 w-8 rounded-md flex items-center justify-center t-text-secondary hover:t-text transition-colors relative" data-testid="notifications-btn">
              <Bell size={16} />
              {unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-indigo-500 rounded-full text-[10px] font-bold flex items-center justify-center px-1 text-white">{unread}</span>}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 t-dropdown border" align="end">
            <div className="flex items-center justify-between px-3 py-2 border-b t-border">
              <span className="text-[10px] font-semibold t-text-muted uppercase tracking-widest">Notifications</span>
              {unread > 0 && <button onClick={handleMarkRead} className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><Check size={10} />Mark all read</button>}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifs.length === 0 ? <p className="text-xs t-text-muted p-4 text-center">No notifications</p> : notifs.map(n => (
                <div key={n.id} className={`px-3 py-2.5 border-b t-border text-xs ${n.read ? 't-text-muted' : 't-text'}`}>
                  <div>{n.message}</div>
                  <div className="text-[10px] t-text-muted mt-0.5">{new Date(n.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center hover:ring-2 hover:ring-indigo-400/30 transition-all cursor-pointer" data-testid="user-profile-btn">
              <span className="text-[10px] font-bold text-white">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 t-dropdown border" align="end">
            <div className="px-3 py-2.5">
              <div className="text-sm font-medium t-text">{user?.name || 'User'}</div>
              <div className="text-xs t-text-secondary mt-0.5">{user?.email}</div>
              <div className="text-[10px] mt-1 px-1.5 py-0.5 rounded inline-block t-chip capitalize">{user?.role || 'member'}</div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm gap-2 cursor-pointer" data-testid="profile-view-btn">
              <User size={14} /> View Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm gap-2 cursor-pointer" data-testid="settings-btn">
              <Settings size={14} /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTheme} className="text-sm gap-2 cursor-pointer" data-testid="theme-toggle-menu">
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-sm gap-2 cursor-pointer text-red-400" data-testid="dropdown-logout-btn">
              <LogOut size={14} /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
