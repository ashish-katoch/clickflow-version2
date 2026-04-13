import React, { useState } from 'react';
import { CaretLeft, CaretRight, Flag } from '@phosphor-icons/react';
import { Button } from '../components/ui/button';

const PRIORITY_DOT = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-400',
  low: 'bg-blue-400',
  none: 'bg-slate-300',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function TaskCalendarView({ tasks, onSelect }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getTasksForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.due_date && t.due_date.startsWith(dateStr));
  };

  const cells = [];
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) cells.push(null);
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="p-4" data-testid="task-calendar-view">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
          {MONTH_NAMES[month]} {year}
        </h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8 border-slate-200" data-testid="cal-prev">
            <CaretLeft size={16} />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 border-slate-200" data-testid="cal-next">
            <CaretRight size={16} />
          </Button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-xs uppercase tracking-wide font-semibold text-slate-500 py-2">{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid rounded-lg overflow-hidden border border-slate-200">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="calendar-cell bg-slate-50" />;
          const dayTasks = getTasksForDay(day);
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

          return (
            <div key={i} className={`calendar-cell ${isToday ? 'bg-blue-50' : ''}`} data-testid={`cal-day-${day}`}>
              <div className={`text-xs font-medium mb-1 ${isToday ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
                {day}
              </div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    onClick={() => onSelect(task)}
                    className="text-[10px] px-1 py-0.5 rounded bg-white border border-slate-200 hover:border-blue-300 cursor-pointer truncate flex items-center gap-1"
                    data-testid={`cal-task-${task.id}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-[10px] text-slate-400 px-1">+{dayTasks.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
