import React, { useState, useEffect, useCallback } from 'react';
import { getActiveTimer, stopTimer } from '../lib/api';
import { Timer, Stop } from '@phosphor-icons/react';
import { Button } from '../components/ui/button';

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TimeTracker() {
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const checkTimer = useCallback(async () => {
    try {
      const active = await getActiveTimer();
      setActiveTimer(active);
    } catch { setActiveTimer(null); }
  }, []);

  useEffect(() => {
    checkTimer();
    const interval = setInterval(checkTimer, 30000); // check every 30s
    return () => clearInterval(interval);
  }, [checkTimer]);

  useEffect(() => {
    if (!activeTimer) { setElapsed(0); return; }
    const start = new Date(activeTimer.start_time).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  const handleStop = async () => {
    try {
      await stopTimer();
      setActiveTimer(null);
    } catch (e) { console.error(e); }
  };

  if (!activeTimer) return null;

  return (
    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-md px-3 py-1.5" data-testid="time-tracker-widget">
      <Timer size={16} weight="duotone" className="text-blue-700 animate-pulse" />
      <span className="text-sm font-mono font-semibold text-blue-800" data-testid="tracker-time">{formatDuration(elapsed)}</span>
      <Button size="sm" variant="ghost" onClick={handleStop} className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" data-testid="tracker-stop-btn">
        <Stop size={14} weight="fill" />
      </Button>
    </div>
  );
}
