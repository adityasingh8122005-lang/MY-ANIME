import React, { useState, useEffect, useMemo } from 'react';
import { getWeeklySchedule } from '../services/jikanApi';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Loader2, Sparkles } from 'lucide-react';

function getWeekBoundaries() {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7; // 1-7, Mon-Sun
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - dayOfWeek + 1);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { 
    start: Math.floor(monday.getTime() / 1000), 
    end: Math.floor(sunday.getTime() / 1000),
    monday 
  };
}

export default function WeeklySchedule() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const now = new Date();
  const currentDayIndex = (now.getDay() || 7) - 1; // 0-6, Mon-Sun
  const [selectedDay, setSelectedDay] = useState(currentDayIndex);
  
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const weekInfo = useMemo(() => getWeekBoundaries(), []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Math.floor(Date.now() / 1000)), 60000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchSchedule() {
      try {
        setLoading(true);
        const data = await getWeeklySchedule(weekInfo.start, weekInfo.end);
        setSchedule(data);
        setError(false);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchSchedule();
  }, [weekInfo]);

  const daysMap = useMemo(() => {
    const days = Array.from({ length: 7 }, () => []);
    schedule.forEach(item => {
      const date = new Date(item.airingAt * 1000);
      const dayIdx = (date.getDay() || 7) - 1;
      days[dayIdx].push(item);
    });
    days.forEach(d => d.sort((a, b) => a.airingAt - b.airingAt));
    return days;
  }, [schedule]);

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  const formatTime = (unix) => {
    const d = new Date(unix * 1000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  
  const formatDateRange = () => {
    const end = new Date(weekInfo.monday);
    end.setDate(end.getDate() + 6);
    return `${weekInfo.monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };
  
  const getCountdown = (airingAt) => {
    const diff = airingAt - currentTime;
    if (diff < 0) return null;
    const d = Math.floor(diff / 86400);
    const h = Math.floor((diff % 86400) / 3600);
    const m = Math.floor((diff % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    return `${h}h ${m}m`;
  };

  const nearest = useMemo(() => {
     const upcoming = schedule.filter(s => s.airingAt > currentTime).sort((a,b) => a.airingAt - b.airingAt);
     return upcoming.length > 0 ? upcoming[0] : null;
  }, [schedule, currentTime]);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-surface-1 rounded-[24px] p-6 border border-white/5 shadow-depth-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-h3 font-bold text-white flex items-center gap-2 uppercase tracking-wider mb-1">
              <Calendar size={20} className="text-primary" /> This Week
            </h2>
            <p className="text-sm font-medium text-zinc-400">{formatDateRange()} • {schedule.length} upcoming episodes</p>
          </div>
          
          {nearest && (
             <div className="bg-surface-2 border border-primary/20 rounded-xl p-3 px-4 flex items-center gap-4">
                <div>
                   <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">Next Episode</div>
                   <div className="text-sm font-bold text-white truncate max-w-[200px]">{nearest.title}</div>
                </div>
                <div className="w-px h-8 bg-white/10 mx-1" />
                <div className="text-right">
                   <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-0.5">Episode {nearest.episode}</div>
                   <div className="text-sm font-bold text-white flex items-center gap-1.5"><Clock size={12} className="text-primary" /> {getCountdown(nearest.airingAt)}</div>
                </div>
             </div>
          )}
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-2 mb-6 border-b border-white/5 relative">
          {days.map((day, idx) => {
            const date = new Date(weekInfo.monday);
            date.setDate(date.getDate() + idx);
            const isToday = idx === currentDayIndex;
            const isSelected = idx === selectedDay;
            
            return (
              <button 
                key={day}
                onClick={() => setSelectedDay(idx)}
                className={`flex flex-col items-center min-w-[64px] p-2 rounded-xl transition-all relative ${isSelected ? 'text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider mb-1">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span className={`text-sm font-bold ${isSelected ? 'text-primary' : ''}`}>{day}</span>
                {isToday && <div className="w-1 h-1 rounded-full bg-primary mt-1 absolute bottom-1" />}
                {isSelected && <div className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full bg-primary" />}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-[200px]">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-zinc-500">
              <Calendar size={32} className="mb-2 opacity-50" />
              <p className="text-sm font-bold">Schedule unavailable</p>
            </div>
          ) : daysMap[selectedDay].length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-zinc-500 bg-surface-2/50 rounded-xl border border-white/5">
              <p className="text-sm font-bold text-white mb-1 uppercase tracking-wider">{days[selectedDay]}</p>
              <p className="text-sm">No anime episodes scheduled.</p>
            </div>
          ) : (
            daysMap[selectedDay].map((item, idx) => {
              const diff = item.airingAt - currentTime;
              const isAiringNow = diff <= 0 && diff > -3600;
              const isPast = diff <= -3600;
              
              return (
                <Link key={`${item.id}-${idx}`} to={`/anime/${item.malId}`} className="group bg-surface-2 hover:bg-surface-3 transition-colors border border-white/5 hover:border-white/10 rounded-xl p-3 flex items-center gap-4 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" aria-label={`${item.title}, episode ${item.episode}, airs at ${formatTime(item.airingAt)}`}>
                   {isAiringNow && <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />}
                   
                   <div className="w-14 text-center shrink-0">
                      <div className="text-lg font-bold text-white tabular-nums tracking-tight">{formatTime(item.airingAt)}</div>
                   </div>
                   
                   <div className="hidden sm:block w-10 h-14 bg-surface-4 rounded-md overflow-hidden shrink-0 shadow-sm border border-white/5 group-hover:border-white/10 transition-colors">
                      {item.poster ? <img src={item.poster} alt="" className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600">No Img</div>}
                   </div>
                   
                   <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">{item.title}</div>
                      <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-2 mt-0.5">
                         <span className="bg-surface-4 px-1.5 py-0.5 rounded text-zinc-300">EP {item.episode}</span>
                         
                         {isAiringNow ? (
                            <span className="text-primary font-bold flex items-center gap-1" aria-live="polite"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> AIRING NOW</span>
                         ) : isPast ? (
                            <span>Aired recently</span>
                         ) : (
                            <span className="flex items-center gap-1">In {getCountdown(item.airingAt)}</span>
                         )}
                      </div>
                   </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
