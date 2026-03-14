'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/services/api';
import { ArrowLeft, Plus, Check, Trash2, Search } from 'lucide-react';

type WorkoutSetLine = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  weight: string;
  reps: string;
  isWarmup: boolean;
  history?: any[];
};

export default function NewWorkoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialExerciseId = searchParams.get('exercise');

  const [notes, setNotes] = useState('');
  const [sets, setSets] = useState<WorkoutSetLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exercises, setExercises] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (initialExerciseId) {
      loadExerciseById(initialExerciseId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialExerciseId]);

  const loadExerciseById = async (id: string) => {
    try {
      const res = await api.get(`/exercises/${id}`);
      addExerciseToWorkout(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!isModalOpen) return;
    const fetchExs = async () => {
      try {
        const res = await api.get(search ? `/exercises?search=${search}` : '/exercises');
        setExercises(res.data.exercises || []);
      } catch (e) { console.error(e); }
    };
    const timer = setTimeout(fetchExs, 300);
    return () => clearTimeout(timer);
  }, [search, isModalOpen]);

  const nextId = () => Math.random().toString(36).substr(2, 9);

  const addExerciseToWorkout = async (exercisePartial: any) => {
    try {
      // Fetch full details to get history
      const res = await api.get(`/exercises/${exercisePartial.id}`);
      const exercise = res.data;
      
      setSets(prev => {
        const group = prev.filter(s => s.exerciseId === exercise.id);
        const lastSets = exercise.workoutSets?.slice(0, 3) || [];
        return [
          ...prev,
          {
            id: nextId(),
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            setNumber: group.length + 1,
            weight: group.length > 0 ? group[group.length - 1].weight : (lastSets[0]?.weight?.toString() || ''),
            reps: group.length > 0 ? group[group.length - 1].reps : (lastSets[0]?.reps?.toString() || ''),
            isWarmup: false,
            history: lastSets,
          }
        ];
      });
      setIsModalOpen(false);
      setSearch('');
    } catch(err) { console.error('Failed to load full exercise', err); }
  };

  const addSetToExercise = (exerciseId: string, exerciseName: string) => {
    setSets(prev => {
      const group = prev.filter(s => s.exerciseId === exerciseId);
      return [
        ...prev,
        {
          id: nextId(),
          exerciseId,
          exerciseName,
          setNumber: group.length + 1,
          weight: group.length > 0 ? group[group.length - 1].weight : '',
          reps: group.length > 0 ? group[group.length - 1].reps : '',
          isWarmup: false,
        }
      ];
    });
  };

  const removeSet = (id: string) => setSets(prev => prev.filter(s => s.id !== id));

  const updateSet = (id: string, field: keyof WorkoutSetLine, value: any) =>
    setSets(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));

  const saveWorkout = async () => {
    if (sets.length === 0) return alert('Add at least one set');
    const validSets = sets.map(s => ({
      exerciseId: s.exerciseId,
      setNumber: s.setNumber,
      weight: parseFloat(s.weight) || 0,
      reps: parseInt(s.reps) || 0,
      isWarmup: s.isWarmup,
    }));
    setLoading(true);
    try {
      const res = await api.post('/workouts', { date: new Date().toISOString(), notes, sets: validSets });
      
      if (res.data.prNotifications && res.data.prNotifications.length > 0) {
        alert("🎉 " + res.data.prNotifications.join('\n\n'));
      }
      
      router.push('/workouts');
    } catch (e) {
      console.error(e);
      alert('Failed to save workout');
    } finally {
      setLoading(false);
    }
  };

  const groupedSets = sets.reduce((acc, curr) => {
    if (!acc[curr.exerciseId]) acc[curr.exerciseId] = [];
    acc[curr.exerciseId].push(curr);
    return acc;
  }, {} as Record<string, WorkoutSetLine[]>);

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-32">

      {/* Sticky Top Nav */}
      <div className="sticky top-0 bg-gray-950/90 backdrop-blur-md border-b border-gray-800/60 z-40">
        <div className="max-w-md mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Log Workout</h1>
          </div>
          <button
            onClick={saveWorkout}
            disabled={loading || sets.length === 0}
            className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Finish
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Notes */}
        <input
          type="text"
          placeholder="Workout notes... (e.g. Push day – felt strong)"
          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-gray-500"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Exercise Groups */}
        <div className="space-y-6">
          {Object.entries(groupedSets).map(([exId, exSets]) => (
            <div key={exId} className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-md">
              <div className="bg-gray-800/60 px-4 py-3 border-b border-gray-800 flex justify-between items-center">
                <h3 className="font-bold text-blue-400">{exSets[0].exerciseName}</h3>
                {exSets[0].history && exSets[0].history.length > 0 && (
                  <span className="text-[10px] text-gray-500 bg-gray-900 px-2 py-0.5 rounded-md border border-gray-700">
                    Last: {exSets[0].history[0].weight}kg × {exSets[0].history[0].reps}
                  </span>
                )}
              </div>
              <div className="p-3 space-y-3">
                {/* Column Headers */}
                <div className="grid grid-cols-12 gap-2 px-1 text-[11px] font-semibold text-gray-500 tracking-widest uppercase">
                  <div className="col-span-2 text-center">Set</div>
                  <div className="col-span-4 text-center">kg</div>
                  <div className="col-span-4 text-center">Reps</div>
                  <div className="col-span-2" />
                </div>

                {exSets.map((set, idx) => (
                  <div key={set.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-2 flex justify-center">
                      <button
                        onClick={() => updateSet(set.id, 'isWarmup', !set.isWarmup)}
                        className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold transition-colors ${set.isWarmup ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-800 text-gray-300'}`}
                      >
                        {set.isWarmup ? 'W' : idx + 1}
                      </button>
                    </div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        placeholder="0"
                        value={set.weight}
                        onChange={(e) => updateSet(set.id, 'weight', e.target.value)}
                        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-2 py-2.5 text-center text-white font-medium focus:outline-none focus:border-blue-500 transition-colors text-sm"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        placeholder="0"
                        value={set.reps}
                        onChange={(e) => updateSet(set.id, 'reps', e.target.value)}
                        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-2 py-2.5 text-center text-white font-medium focus:outline-none focus:border-blue-500 transition-colors text-sm"
                      />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button onClick={() => removeSet(set.id)} className="p-1.5 text-red-500/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => addSetToExercise(exId, exSets[0].exerciseName)}
                  className="w-full py-2.5 bg-gray-800/60 hover:bg-gray-700/60 text-gray-400 hover:text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 mt-1"
                >
                  <Plus className="w-4 h-4" /> Add Set
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Exercise Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border-2 border-dashed border-blue-600/30 rounded-2xl py-6 font-bold flex flex-col items-center gap-1.5 transition-all active:scale-[0.98]"
        >
          <Plus className="w-6 h-6" />
          <span className="tracking-widest text-sm">ADD EXERCISE</span>
        </button>
      </div>

      {/* Exercise Selection Sheet */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col">
          <div className="bg-gray-900 mt-16 flex-1 rounded-t-3xl border-t border-gray-800 flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-800 flex items-center gap-3">
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search exercises..."
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {exercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => addExerciseToWorkout(ex)}
                  className="w-full flex items-center justify-between bg-gray-950 border border-gray-800 p-4 rounded-xl hover:bg-gray-800 hover:border-blue-500/40 transition-all text-left group"
                >
                  <div>
                    <p className="font-bold text-gray-200 group-hover:text-white transition-colors">{ex.name}</p>
                    <span className="text-xs text-blue-400 font-medium">{ex.primaryMuscle}</span>
                  </div>
                  <Plus className="text-gray-600 group-hover:text-blue-400 w-5 h-5 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
