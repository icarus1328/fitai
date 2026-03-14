'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import BottomNav from '@/components/layout/BottomNav';
import { Calendar, Plus, Dumbbell, History } from 'lucide-react';
import Link from 'next/link';
import Cookies from 'js-cookie';

export default function WorkoutsPage() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Cookies.get('token')) {
      router.push('/login');
      return;
    }

    const fetchWorkouts = async () => {
      try {
        const res = await api.get('/workouts');
        setWorkouts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-950 pb-24 text-white">
      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center py-2">
          <h1 className="text-2xl font-bold font-sans">Workout History</h1>
          <Link href="/workouts/new" className="flex items-center gap-1 text-blue-400 bg-blue-900/30 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-900/50 transition-colors">
            <Plus className="w-4 h-4" />
            New
          </Link>
        </div>

        {/* Workout List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10 text-gray-500 animate-pulse">Loading history...</div>
          ) : workouts.length === 0 ? (
            <div className="text-center py-16 text-gray-600 bg-gray-900 rounded-2xl border border-gray-800">
              <History className="w-12 h-12 mx-auto text-gray-700 mb-3" />
              <p className="text-lg font-medium text-gray-300">No workouts yet</p>
              <p className="text-sm mt-1">Time to hit the gym!</p>
              <Link href="/workouts/new">
                <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-blue-600/20 active:scale-95 transition-transform">
                  Log First Workout
                </button>
              </Link>
            </div>
          ) : (
            workouts.map((workout) => {
              const date = new Date(workout.date).toLocaleDateString(undefined, {
                weekday: 'short', month: 'short', day: 'numeric'
              });
              
              const totalSets = workout.sets.length;
              const totalVolume = workout.sets.reduce((acc: number, set: any) => acc + (set.weight * set.reps), 0);
              
              // Group sets by exercise
              const exercisesMap = new Map();
              workout.sets.forEach((set: any) => {
                if (!exercisesMap.has(set.exercise.name)) {
                  exercisesMap.set(set.exercise.name, 1);
                } else {
                  exercisesMap.set(set.exercise.name, exercisesMap.get(set.exercise.name) + 1);
                }
              });
              
              const exerciseSummaries = Array.from(exercisesMap.entries()).slice(0, 3);
              const extraCount = exercisesMap.size - 3;

              return (
                <div key={workout.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-md">
                  <div className="flex justify-between items-start mb-4 border-b border-gray-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-600/20 p-2 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-100">{date}</h3>
                        {workout.notes && <p className="text-xs text-gray-400 mt-0.5">{workout.notes}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {exerciseSummaries.map(([name, setQty]) => (
                      <div key={name} className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">{name}</span>
                        <span className="text-gray-500 font-medium">{setQty} sets</span>
                      </div>
                    ))}
                    {extraCount > 0 && (
                      <div className="text-xs text-gray-500 italic">...and {extraCount} more exercises</div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 pt-3 border-t border-gray-800 mt-2">
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                      <History className="w-4 h-4 text-emerald-500" />
                      <span>{totalSets} Sets Total</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                      <Dumbbell className="w-4 h-4 text-purple-500" />
                      <span>{totalVolume.toLocaleString()} kg Vol</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
