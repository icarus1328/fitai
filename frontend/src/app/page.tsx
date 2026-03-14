'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/services/api';
import BottomNav from '@/components/layout/BottomNav';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Zap, AlertTriangle, TrendingUp, Scale, Clock, Flame, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [aiData, setAiData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeExercise, setActiveExercise] = useState(0);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];

  useEffect(() => {
    const init = async () => {
      try {
        const token = Cookies.get('token');
        if (!token) { router.push('/login'); return; }

        const [profileRes, dashRes, aiRes, analyticsRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/ai/dashboard'),
          api.get('/ai/recommendations'),
          api.get('/analytics/dashboard')
        ]);

        setUser(profileRes.data);
        setDashboardData(dashRes.data);
        setAiData(aiRes.data);
        setAnalyticsData(analyticsRes.data);
      } catch (err) {
        console.error(err);
        Cookies.remove('token');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading your dashboard...</p>
      </div>
    );
  }

  if (!user) return null;

  const hasDashData = dashboardData?.frequencyData?.length > 0;
  const hasProgression = dashboardData?.topExercises?.length > 0;
  const calPlan = aiData?.caloriePlan;
  const progressionSuggestions = aiData?.progressionSuggestions || [];
  const volumeWarnings = aiData?.volumeWarnings || [];
  const recoveryWarnings = aiData?.recoveryWarnings || [];

  const currentExerciseData = hasProgression
    ? dashboardData.topExercises[activeExercise]
    : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <div className="max-w-md mx-auto p-4 space-y-5">

        {/* ── Header ── */}
        <div className="flex justify-between items-center pt-4 pb-1">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Hey, {user.name?.split(' ')[0] || 'Athlete'} 👋
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">Here's your fitness summary</p>
          </div>
          <Link href="/profile">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg shadow-lg ring-2 ring-blue-500/30 cursor-pointer">
              {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
          </Link>
        </div>

        {/* ── Calorie Goal Card ── */}
        {calPlan && (
          <div className="bg-gradient-to-br from-blue-900/60 via-blue-900/40 to-purple-900/40 rounded-2xl p-5 border border-blue-800/50 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-orange-400" />
              <h3 className="text-sm font-bold text-blue-200 tracking-wider uppercase">Calorie Plan</h3>
              <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${calPlan.goal === 'bulk' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {calPlan.goal === 'bulk' ? '📈 Bulk' : '📉 Cut'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-extrabold text-white">{calPlan.tdee.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-0.5">Maintenance</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-blue-300">{calPlan.targetCalories.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-0.5">Target kcal</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-purple-300">{calPlan.estimatedDays}</p>
                <p className="text-xs text-gray-400 mt-0.5">Days to Goal</p>
              </div>
            </div>
            <p className="text-xs text-blue-300/70 mt-3 text-center">
              Goal: {calPlan.weightDelta > 0 ? '+' : ''}{calPlan.weightDelta} kg → {user.targetWeight} kg
            </p>
          </div>
        )}

        {/* ── AI Coach Cards ── */}
        {progressionSuggestions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" /> AI Coach
            </h3>
            {progressionSuggestions.slice(0, 2).map((s: any, i: number) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-3 shadow-sm">
                <div className="w-1.5 rounded-full bg-gradient-to-b from-blue-500 to-purple-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-200">{s.exercise}</p>
                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">{s.suggestion?.note}</p>
                  {s.suggestion && (
                    <div className="flex gap-3 mt-2">
                      <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded border border-blue-800/50">
                        {s.suggestion.weight} kg
                      </span>
                      <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded border border-purple-800/50">
                        {s.suggestion.reps} reps × {s.suggestion.sets} sets
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No-data AI card */}
        {progressionSuggestions.length === 0 && (
          <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-2xl p-5 border border-indigo-700/40 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="text-sm font-bold text-indigo-200 tracking-wider uppercase">AI Coach</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Log a few workouts to unlock personalized AI coaching — plateau detection, progressive overload targets, and recovery alerts.
            </p>
            <Link href="/workouts/new">
              <div className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold py-2 px-4 rounded-lg inline-block cursor-pointer transition-colors">
                Log First Workout →
              </div>
            </Link>
          </div>
        )}

        {/* ── Volume Warnings ── */}
        {volumeWarnings.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Volume Alerts
            </h3>
            {volumeWarnings.map((w: string, i: number) => (
              <div key={i} className="bg-amber-950/30 border border-amber-700/40 rounded-xl p-3 text-sm text-amber-300">
                {w}
              </div>
            ))}
          </div>
        )}

        {/* ── Recovery Warnings ── */}
        {recoveryWarnings.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-400" /> Recovery
            </h3>
            {recoveryWarnings.map((w: string, i: number) => (
              <div key={i} className="bg-red-950/30 border border-red-700/40 rounded-xl p-3 text-sm text-red-300">
                {w}
              </div>
            ))}
          </div>
        )}

        {/* ── Strength Progression ── */}
        {hasProgression && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-md">
            <div className="flex border-b border-gray-800 overflow-x-auto">
              {dashboardData.topExercises.map((ex: any, idx: number) => (
                <button
                  key={ex.name}
                  onClick={() => setActiveExercise(idx)}
                  className={`px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors ${activeExercise === idx ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {ex.name}
                </button>
              ))}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-gray-300">Estimated 1RM Progression</h3>
              </div>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentExerciseData?.data || []}>
                    <defs>
                      <linearGradient id="colorOrm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '10px', fontSize: '12px' }}
                      itemStyle={{ color: '#93c5fd' }}
                      formatter={(val: any) => [`${val} kg`, '1RM Est.']}
                    />
                    <Area type="monotone" dataKey="orm" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOrm)" dot={{ fill: '#3b82f6', r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── Workout Frequency ── */}
        {hasDashData && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-md p-4 mt-4">
            <h3 className="text-sm font-bold text-gray-300 mb-1 flex items-center gap-2"><Calendar className="w-4 h-4 text-emerald-400" /> Weekly Workout Frequency</h3>
            <p className="text-xs text-gray-500 mb-4">Sessions logged per week</p>
            <div className="h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.frequencyData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '10px', fontSize: '12px' }}
                    itemStyle={{ color: '#34d399' }}
                    formatter={(val: any) => [val, 'Workouts']}
                  />
                  <Bar dataKey="workouts" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Volume Trends ── */}
        {analyticsData?.volumeByDate?.length > 0 && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-md p-4 mt-4">
            <h3 className="text-sm font-bold text-gray-300 mb-1 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-purple-400" /> Training Volume Trends</h3>
            <p className="text-xs text-gray-500 mb-4">Total kg lifted per day</p>
            <div className="h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.volumeByDate}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, {month:'short', day:'numeric'})} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '10px', fontSize: '12px' }}
                    itemStyle={{ color: '#d8b4fe' }}
                    formatter={(val: any) => [`${val.toLocaleString()} kg`, 'Volume']}
                    labelFormatter={(label) => new Date(label).toDateString()}
                  />
                  <Area type="monotone" dataKey="volume" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVolume)" dot={{ fill: '#a855f7', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Muscle Group Distribution ── */}
        {analyticsData?.muscleDistribution?.length > 0 && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-md p-4 mt-4">
            <h3 className="text-sm font-bold text-gray-300 mb-1 flex items-center gap-2"><Zap className="w-4 h-4 text-blue-400" /> Muscle Group Distribution</h3>
            <p className="text-xs text-gray-500 mb-4">Sets performed all-time</p>
            <div className="h-[200px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.muscleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="muscle"
                  >
                    {analyticsData.muscleDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '10px', fontSize: '12px', color: '#fff' }}
                    formatter={(val: any) => [`${val} sets`, 'Volume']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── No Workout Data Placeholder ── */}
        {!hasDashData && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center shadow-md">
            <Scale className="w-12 h-12 mx-auto text-gray-700 mb-3" />
            <p className="text-gray-400 font-medium">No workout data yet</p>
            <p className="text-gray-600 text-sm mt-1">Your charts will appear here after you log some workouts</p>
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  );
}
