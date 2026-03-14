'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/services/api';
import BottomNav from '@/components/layout/BottomNav';
import { LogOut, Scale, Ruler, Target, Trophy, Flame, Dumbbell, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const TIER_ICONS: Record<string, string> = {
  Elite: '👑', Advanced: '🔥', Intermediate: '⚡', Beginner: '🌱',
};
const TIER_COLORS: Record<string, string> = {
  Elite: 'text-yellow-300', Advanced: 'text-purple-300',
  Intermediate: 'text-blue-300', Beginner: 'text-gray-300',
};
const TIER_BG: Record<string, string> = {
  Elite: 'bg-yellow-900/30 border-yellow-600/40',
  Advanced: 'bg-purple-900/30 border-purple-600/40',
  Intermediate: 'bg-blue-900/30 border-blue-600/40',
  Beginner: 'bg-gray-800/50 border-gray-600/40',
};
const TIER_MIN: Record<string, number> = { Beginner: 0, Intermediate: 200, Advanced: 400, Elite: 700 };
const TIER_MAX: Record<string, number> = { Beginner: 200, Intermediate: 400, Advanced: 700, Elite: 700 };
const TIER_NEXT: Record<string, string> = { Beginner: 'Intermediate', Intermediate: 'Advanced', Advanced: 'Elite', Elite: 'Elite' };

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [rankData, setRankData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const token = Cookies.get('token');
        if (!token) { router.push('/login'); return; }
        const [userRes, rankRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/ranking/me'),
        ]);
        setUser(userRes.data);
        setRankData(rankRes.data);
      } catch (err) {
        console.error(err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  const logout = () => {
    Cookies.remove('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const tier = rankData?.rankTier || 'Beginner';
  const score = rankData?.fitnessScore || 0;
  const min = TIER_MIN[tier] || 0;
  const max = TIER_MAX[tier] || 200;
  const progress = tier === 'Elite' ? 100 : Math.min(100, Math.max(0, ((score - min) / (max - min)) * 100));

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-28">
      <div className="max-w-md mx-auto p-4 space-y-5">

        {/* ── Avatar + Name ── */}
        <div className="pt-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-black text-3xl shadow-2xl ring-4 ring-blue-500/30 mb-3">
            {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <h1 className="text-xl font-bold">{user.name || 'Athlete'}</h1>
          <p className="text-gray-400 text-sm">{user.email}</p>
        </div>

        {/* ── Rank Badge ── */}
        {rankData && (
          <Link href="/leaderboard">
            <div className={`rounded-2xl border p-5 cursor-pointer hover:opacity-90 transition-opacity ${TIER_BG[tier]}`}>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Fitness Rank</p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{TIER_ICONS[tier]}</span>
                    <div>
                      <p className={`text-xl font-black ${TIER_COLORS[tier]}`}>{tier}</p>
                      <p className="text-xs text-gray-400">Rank #{rankData.rank} globally</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-black ${TIER_COLORS[tier]}`}>{score.toFixed(0)}</p>
                  <p className="text-xs text-gray-500">Fitness Score</p>
                </div>
              </div>

              {/* Progress to next tier */}
              {tier !== 'Elite' && (
                <>
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>{tier}</span>
                    <span>{TIER_NEXT[tier]} at {max} pts</span>
                  </div>
                  <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${tier === 'Beginner' ? 'bg-blue-500' : tier === 'Intermediate' ? 'bg-purple-500' : 'bg-yellow-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-right mt-1">{(max - score).toFixed(0)} pts to {TIER_NEXT[tier]}</p>
                </>
              )}

              {/* Score breakdown */}
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="bg-black/20 rounded-xl p-2">
                  <Dumbbell className="w-3.5 h-3.5 mx-auto mb-1 text-blue-400" />
                  <p className="text-sm font-bold">{Math.round(rankData.strengthScore)}</p>
                  <p className="text-[10px] text-gray-400">Strength</p>
                </div>
                <div className="bg-black/20 rounded-xl p-2">
                  <TrendingUp className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-400" />
                  <p className="text-sm font-bold">{Math.round(rankData.volumeScore / 100)}×</p>
                  <p className="text-[10px] text-gray-400">Volume</p>
                </div>
                <div className="bg-black/20 rounded-xl p-2">
                  <Flame className="w-3.5 h-3.5 mx-auto mb-1 text-orange-400" />
                  <p className="text-sm font-bold">{Math.round(rankData.consistencyScore)}</p>
                  <p className="text-[10px] text-gray-400">Consistency</p>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center mt-3">Tap to view global leaderboard →</p>
            </div>
          </Link>
        )}

        {/* ── Body Stats ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Body Stats</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
                <Scale className="w-5 h-5 text-blue-400" />
              </div>
              <p className="font-bold text-lg">{user.currentWeight ?? '—'}</p>
              <p className="text-xs text-gray-400">kg now</p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-900/30 flex items-center justify-center mx-auto mb-2">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="font-bold text-lg">{user.targetWeight ?? '—'}</p>
              <p className="text-xs text-gray-400">kg target</p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-900/30 flex items-center justify-center mx-auto mb-2">
                <Ruler className="w-5 h-5 text-purple-400" />
              </div>
              <p className="font-bold text-lg">{user.height ?? '—'}</p>
              <p className="text-xs text-gray-400">cm height</p>
            </div>
          </div>
        </div>

        {/* ── Logout ── */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-red-900/20 hover:bg-red-900/40 border border-red-700/40 text-red-400 font-bold py-3.5 rounded-2xl transition-all mt-2"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
