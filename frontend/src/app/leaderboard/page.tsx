'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/services/api';
import BottomNav from '@/components/layout/BottomNav';
import { Trophy, Flame, Dumbbell, TrendingUp, ChevronUp, Medal } from 'lucide-react';

// ── Tier config ────────────────────────────────────────────────────────────────
const TIER_CONFIG: Record<string, { color: string; bg: string; border: string; glow: string }> = {
  Elite:        { color: 'text-yellow-300', bg: 'bg-yellow-900/30', border: 'border-yellow-500/40', glow: 'shadow-yellow-500/20' },
  Advanced:     { color: 'text-purple-300', bg: 'bg-purple-900/30', border: 'border-purple-500/40', glow: 'shadow-purple-500/20' },
  Intermediate: { color: 'text-blue-300',   bg: 'bg-blue-900/30',   border: 'border-blue-500/40',   glow: 'shadow-blue-500/20'   },
  Beginner:     { color: 'text-gray-300',   bg: 'bg-gray-800/50',   border: 'border-gray-600/40',   glow: 'shadow-none'          },
};
const TIER_ICONS: Record<string, string> = {
  Elite: '👑', Advanced: '🔥', Intermediate: '⚡', Beginner: '🌱',
};
const RANK_THRESHOLDS: Record<string, number> = {
  Beginner: 200, Intermediate: 400, Advanced: 700, Elite: 700,
};

const RankMedal = ({ rank }: { rank: number }) => {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-gray-500 font-bold text-lg">#{rank}</span>;
};

export default function LeaderboardPage() {
  const router = useRouter();
  const [myRank, setMyRank] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string>('');

  const load = useCallback(async () => {
    try {
      const token = Cookies.get('token');
      if (!token) { router.push('/login'); return; }

      const [meRes, lbRes, rankRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/ranking/leaderboard'),
        api.get('/ranking/me'),
      ]);
      setMyId(meRes.data.id);
      setLeaderboard(lbRes.data);
      setMyRank(rankRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tier = myRank?.rankTier || 'Beginner';
  const tc = TIER_CONFIG[tier] || TIER_CONFIG.Beginner;
  const threshold = RANK_THRESHOLDS[tier] || 200;
  const prevThreshold = tier === 'Beginner' ? 0 : tier === 'Intermediate' ? 200 : tier === 'Advanced' ? 400 : 700;
  const progress = Math.min(100, Math.max(0,
    ((myRank?.fitnessScore || 0) - prevThreshold) / (threshold - prevThreshold + 0.01) * 100
  ));

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-28">
      <div className="max-w-md mx-auto p-4 space-y-6">

        {/* ── Header ── */}
        <div className="pt-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-7 h-7 text-yellow-400" /> Leaderboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">Global fitness rankings</p>
        </div>

        {/* ── My Rank Card ── */}
        {myRank && (
          <div className={`rounded-2xl border p-5 shadow-xl ${tc.bg} ${tc.border} shadow-lg ${tc.glow}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Your Rank</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">#{myRank.rank}</span>
                  <span className="text-gray-400 text-sm">of {myRank.totalUsers}</span>
                </div>
              </div>
              <div className={`rounded-xl px-3 py-2 text-center ${tc.bg} ${tc.border} border`}>
                <div className="text-2xl">{TIER_ICONS[tier]}</div>
                <div className={`text-xs font-bold mt-1 ${tc.color}`}>{tier}</div>
              </div>
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="bg-black/20 rounded-xl p-3">
                <Dumbbell className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                <p className="text-lg font-bold text-white">{Math.round(myRank.strengthScore)}</p>
                <p className="text-[11px] text-gray-400">Strength</p>
              </div>
              <div className="bg-black/20 rounded-xl p-3">
                <TrendingUp className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                <p className="text-lg font-bold text-white">{Math.round(myRank.volumeScore / 100)}×</p>
                <p className="text-[11px] text-gray-400">Volume</p>
              </div>
              <div className="bg-black/20 rounded-xl p-3">
                <Flame className="w-4 h-4 mx-auto mb-1 text-orange-400" />
                <p className="text-lg font-bold text-white">{Math.round(myRank.consistencyScore)}</p>
                <p className="text-[11px] text-gray-400">Consistency</p>
              </div>
            </div>

            {/* Total score */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300 font-semibold">Fitness Score</span>
              <span className={`text-xl font-black ${tc.color}`}>{myRank.fitnessScore.toFixed(1)}</span>
            </div>

            {/* Tier progress bar */}
            {tier !== 'Elite' && (
              <>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{tier}</span>
                  <span>Next: {threshold} pts</span>
                </div>
                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${tier === 'Beginner' ? 'bg-blue-500' : tier === 'Intermediate' ? 'bg-purple-500' : 'bg-yellow-500'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5 text-right">
                  {(threshold - (myRank.fitnessScore || 0)).toFixed(0)} pts to {
                    tier === 'Beginner' ? 'Intermediate' : tier === 'Intermediate' ? 'Advanced' : 'Elite'
                  }
                </p>
              </>
            )}
            {tier === 'Elite' && (
              <div className="text-center text-yellow-400 text-sm font-bold mt-1">
                🏆 Maximum tier reached!
              </div>
            )}
          </div>
        )}

        {/* ── Global Leaderboard ── */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Medal className="w-4 h-4 text-yellow-400" /> Global Rankings
          </h2>

          <div className="space-y-2">
            {leaderboard.map((entry) => {
              const isMe = entry.id === myId;
              const entryTier = entry.rankTier || 'Beginner';
              const etc = TIER_CONFIG[entryTier] || TIER_CONFIG.Beginner;

              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                    isMe
                      ? `${etc.bg} ${etc.border} shadow-lg ring-1 ring-blue-500/40`
                      : 'bg-gray-900 border-gray-800/60'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-10 text-center flex-shrink-0">
                    <RankMedal rank={entry.rank} />
                  </div>

                  {/* Avatar + name */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${etc.bg} ${etc.color}`}>
                    {(entry.name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`font-bold text-sm truncate ${isMe ? 'text-white' : 'text-gray-200'}`}>
                        {entry.name || 'Anonymous'} {isMe && <span className="text-blue-400 text-xs">(You)</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[11px] font-semibold ${etc.color}`}>
                        {TIER_ICONS[entryTier]} {entryTier}
                      </span>
                      <span className="text-gray-600 text-[11px]">•</span>
                      <span className="text-gray-500 text-[11px]">{entry.workoutsThisMonth} sessions this month</span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-lg font-black ${etc.color}`}>{entry.fitnessScore.toFixed(0)}</p>
                    <p className="text-[10px] text-gray-500">pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
