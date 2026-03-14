'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/services/api';
import { ArrowLeft, Dumbbell, Target, Layers, Plus, Wrench } from 'lucide-react';
import Link from 'next/link';

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner:     'bg-emerald-900/40 text-emerald-400 border-emerald-700/40',
  Intermediate: 'bg-blue-900/40   text-blue-400   border-blue-700/40',
  Advanced:     'bg-red-900/40    text-red-400    border-red-700/40',
};

export default function ExerciseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Cookies.get('token')) { router.push('/login'); return; }
    if (!id) return;

    api.get(`/exercises/${id}`)
      .then(res => setExercise(res.data))
      .catch(err => { console.error(err); router.push('/exercises'); })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!exercise) return null;

  const instructions: string[] = exercise.instructions
    ? exercise.instructions.split('\n').filter(Boolean)
    : [];

  const secondaryMuscles: string[] = (exercise.secondaryMuscles ?? []).map(
    (s: any) => s.muscleGroup?.name
  ).filter(Boolean);

  // Get last 3 sets for "Last performance" section
  const pastSets = exercise.workoutSets?.slice(0, 3) ?? [];

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-16">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur-md border-b border-gray-800/50 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-lg truncate flex-1">{exercise.name}</h1>
        <Link href={`/workouts/new?exercise=${exercise.id}`}>
          <button className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-blue-500 transition-colors">
            <Plus className="w-4 h-4" /> Log It
          </button>
        </Link>
      </div>

      <div className="max-w-md mx-auto">

        {/* ── Hero GIF ── */}
        <div className="bg-gray-900 flex items-center justify-center" style={{ minHeight: 220 }}>
          {exercise.mediaUrl ? (
            <img
              src={exercise.mediaUrl}
              alt={exercise.name}
              className="w-full max-h-72 object-contain"
            />
          ) : (
            <div className="py-16 text-6xl">💪</div>
          )}
        </div>

        <div className="p-4 space-y-5">

          {/* ── Tags row ── */}
          <div className="flex flex-wrap gap-2">
            {exercise.difficulty && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${DIFFICULTY_COLORS[exercise.difficulty] ?? DIFFICULTY_COLORS.Intermediate}`}>
                {exercise.difficulty}
              </span>
            )}
            {exercise.equipment && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700 flex items-center gap-1.5">
                <Wrench className="w-3 h-3" /> {exercise.equipment}
              </span>
            )}
          </div>

          {/* ── Muscle groups ── */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold text-gray-300">Primary Muscle</span>
            </div>
            <div className="flex flex-wrap gap-2 pl-6">
              <span className="px-3 py-1 bg-blue-900/40 text-blue-300 rounded-lg text-sm font-semibold border border-blue-700/40">
                {exercise.primaryMuscle?.name ?? 'Mixed'}
              </span>
            </div>

            {secondaryMuscles.length > 0 && (
              <>
                <div className="flex items-center gap-2 pt-1 border-t border-gray-800">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-bold text-gray-300">Secondary Muscles</span>
                </div>
                <div className="flex flex-wrap gap-2 pl-6">
                  {secondaryMuscles.map((m: string) => (
                    <span key={m} className="px-2.5 py-0.5 bg-purple-900/30 text-purple-300 rounded-lg text-xs font-semibold border border-purple-700/40">
                      {m}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Instructions ── */}
          {instructions.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-gray-300">How to Perform</span>
              </div>
              <ol className="space-y-3 pl-1">
                {instructions.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-300 leading-relaxed">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* ── Past performance ── */}
          {pastSets.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-bold text-gray-300">Your Recent Sets</p>
              <div className="space-y-2">
                {pastSets.map((set: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm text-gray-400">
                    <span>{new Date(set.workout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    <span className="font-semibold text-gray-200">{set.weight} kg × {set.reps} reps</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
