'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/services/api';
import BottomNav from '@/components/layout/BottomNav';
import { CalendarDays, Flame, CheckCircle2, Plus } from 'lucide-react';

// Helper: get all days in a given month
const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export default function AttendancePage() {
  const router = useRouter();
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  const load = useCallback(async () => {
    try {
      const token = Cookies.get('token');
      if (!token) { router.push('/login'); return; }
      const res = await api.get('/attendance');
      setAttendanceData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const markToday = async () => {
    setMarking(true);
    try {
      await api.post('/attendance', {});
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Build set of attended date strings for quick lookup
  const attendedSet = new Set<string>(
    (attendanceData?.logs || []).map((l: any) =>
      new Date(l.date).toDateString()
    )
  );

  // Calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const today = new Date();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isTodayAttended = attendedSet.has(today.toDateString());

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-28">
      <div className="max-w-md mx-auto p-4 space-y-5">

        {/* ── Header ── */}
        <div className="pt-4 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="w-7 h-7 text-emerald-400" /> Attendance
            </h1>
            <p className="text-gray-400 text-sm mt-1">Track your gym visits</p>
          </div>
          <button
            onClick={markToday}
            disabled={marking || isTodayAttended}
            className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl transition-all ${
              isTodayAttended
                ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/40 cursor-default'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
            }`}
          >
            {isTodayAttended
              ? <><CheckCircle2 className="w-4 h-4" /> Done today!</>
              : <><Plus className="w-4 h-4" /> Check In</>
            }
          </button>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-emerald-400">{attendanceData?.weeklyVisits ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">This Week</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-blue-400">{attendanceData?.monthlyVisits ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">This Month</p>
          </div>
          <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 border border-orange-700/40 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 text-orange-400" />
              <p className="text-2xl font-black text-orange-300">{attendanceData?.currentStreak ?? 0}</p>
            </div>
            <p className="text-xs text-gray-400 mt-1">Day Streak 🔥</p>
          </div>
        </div>

        {/* ── Calendar ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-md">
          {/* Month navigation */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <button onClick={prevMonth} className="text-gray-400 hover:text-white transition-colors text-xl font-bold px-2">‹</button>
            <h3 className="font-bold text-gray-200">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h3>
            <button onClick={nextMonth} className="text-gray-400 hover:text-white transition-colors text-xl font-bold px-2">›</button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 px-3 pt-3 pb-1">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-[11px] font-semibold text-gray-500 pb-1">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1 px-3 pb-4">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dayDate = new Date(viewYear, viewMonth, dayNum);
              const isAttended = attendedSet.has(dayDate.toDateString());
              const isToday =
                dayDate.getDate() === today.getDate() &&
                dayDate.getMonth() === today.getMonth() &&
                dayDate.getFullYear() === today.getFullYear();
              const isFuture = dayDate > today;

              return (
                <div
                  key={dayNum}
                  className={`aspect-square flex items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                    isAttended
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                      : isToday
                        ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                        : isFuture
                          ? 'text-gray-700'
                          : 'text-gray-500 hover:bg-gray-800 cursor-pointer'
                  }`}
                >
                  {dayNum}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-5 pb-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-md bg-emerald-500" />
              <span>Attended</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-md bg-blue-600/30 border border-blue-500/50" />
              <span>Today</span>
            </div>
          </div>
        </div>

      </div>
      <BottomNav />
    </div>
  );
}
