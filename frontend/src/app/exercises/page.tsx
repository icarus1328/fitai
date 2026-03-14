'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/services/api';
import BottomNav from '@/components/layout/BottomNav';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner:     'bg-emerald-900/50 text-emerald-400 border-emerald-700/40',
  Intermediate: 'bg-blue-900/50   text-blue-400   border-blue-700/40',
  Advanced:     'bg-red-900/50    text-red-400    border-red-700/40',
};

export default function ExercisesPage() {
  const router = useRouter();

  // Filters
  const [search, setSearch]               = useState('');
  const [regionId, setRegionId]           = useState('');
  const [muscleGroupId, setMuscleGroupId] = useState('');
  const [equipment, setEquipment]         = useState('');
  const [page, setPage]                   = useState(1);

  // Data
  const [exercises, setExercises]         = useState<any[]>([]);
  const [total, setTotal]                 = useState(0);
  const [pages, setPages]                 = useState(1);
  const [regions, setRegions]             = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<string[]>([]);

  const [loading, setLoading]             = useState(true);
  const [showFilters, setShowFilters]     = useState(false);
  const debounceRef                       = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch filter options once
  useEffect(() => {
    if (!Cookies.get('token')) { router.push('/login'); return; }
    api.get('/exercises/filters').then(res => {
      setRegions(res.data.regions || []);
      setEquipmentList(res.data.equipment || []);
    }).catch(console.error);
  }, [router]);

  // Fetch exercises on filter change
  const fetchExercises = useCallback(async (s: string, r: string, m: string, eq: string, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '30' });
      if (s)  params.append('search', s);
      if (r)  params.append('regionId', r);
      if (m)  params.append('muscleGroupId', m);
      if (eq) params.append('equipment', eq);

      const res = await api.get(`/exercises?${params}`);
      setExercises(res.data.exercises || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search, immediate on filter change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchExercises(search, regionId, muscleGroupId, equipment, 1);
      setPage(1);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, regionId, muscleGroupId, equipment, fetchExercises]);

  // Page change
  useEffect(() => {
    fetchExercises(search, regionId, muscleGroupId, equipment, page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const clearFilters = () => {
    setSearch(''); setRegionId(''); setMuscleGroupId(''); setEquipment(''); setPage(1);
  };
  
  const hasFilters = search || regionId || muscleGroupId || equipment;

  const handleRegionSelect = (id: string) => {
    if (regionId === id) {
      setRegionId('');
      setMuscleGroupId('');
    } else {
      setRegionId(id);
      setMuscleGroupId(''); // Reset muscle group when changing region
    }
  };

  const selectedRegion = regions.find(r => r.id === regionId);

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-28">
      <div className="max-w-md mx-auto">

        {/* ── Sticky search bar ── */}
        <div className="sticky top-0 z-30 bg-gray-950/95 backdrop-blur-md border-b border-gray-800/50 px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search exercises…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`p-2.5 rounded-xl border transition-colors ${showFilters ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-gray-900 border-gray-800 text-gray-400'}`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-red-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="space-y-3 pb-1 pt-2">
              {/* Body Region filter */}
              <div>
                <p className="text-xs text-gray-400 px-1 mb-1.5 font-bold uppercase tracking-wider">Body Region</p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => handleRegionSelect('')}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${!regionId ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`}
                  >All</button>
                  {regions.map(r => (
                    <button
                      key={r.id}
                      onClick={() => handleRegionSelect(r.id)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${regionId === r.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500'}`}
                    >{r.name}</button>
                  ))}
                </div>
              </div>

              {/* Muscle Group filter (conditional on Region) */}
              {selectedRegion && selectedRegion.muscleGroups?.length > 0 && (
                <div className="pl-2 border-l-2 border-blue-600/50 animate-in fade-in slide-in-from-top-2">
                  <p className="text-[10px] text-blue-400 px-1 mb-1.5 font-bold uppercase tracking-wider">Specific Muscle</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      onClick={() => setMuscleGroupId('')}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${!muscleGroupId ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`}
                    >Any {selectedRegion.name}</button>
                    {selectedRegion.muscleGroups.map((m: any) => (
                      <button
                        key={m.id}
                        onClick={() => setMuscleGroupId(muscleGroupId === m.id ? '' : m.id)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${muscleGroupId === m.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500'}`}
                      >{m.name}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Equipment filter */}
              <div>
                <p className="text-xs text-gray-400 px-1 mb-1.5 font-bold uppercase tracking-wider">Equipment</p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setEquipment('')}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${!equipment ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-900 text-gray-400 border-gray-700'}`}
                  >All</button>
                  {equipmentList.map(eq => (
                    <button
                      key={eq}
                      onClick={() => setEquipment(equipment === eq ? '' : eq)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${equipment === eq ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500'}`}
                    >{eq}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Result count */}
          <div className="text-xs text-gray-500 px-1">
            {loading ? 'Loading…' : `${total.toLocaleString()} exercises`}
          </div>
        </div>

        {/* ── Exercise list ── */}
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Search className="w-12 h-12 mx-auto text-gray-700 mb-3" />
              <p>No exercises found</p>
              <button onClick={clearFilters} className="mt-3 text-blue-400 text-sm underline">Clear filters</button>
            </div>
          ) : (
            exercises.map(ex => (
              <Link key={ex.id} href={`/exercises/${ex.id}`}>
                <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-2xl p-3 hover:border-gray-600 hover:bg-gray-800/70 transition-all active:scale-[0.99] group">
                  {/* GIF thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                    {ex.mediaUrl ? (
                      <img
                        src={ex.mediaUrl}
                        alt={ex.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-xl">💪</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-gray-100 truncate group-hover:text-white transition-colors">{ex.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-xs text-blue-400 font-semibold">{ex.primaryMuscle?.name ?? 'Mixed'}</span>
                      {ex.equipment && (
                        <>
                          <span className="text-gray-700 text-xs">·</span>
                          <span className="text-xs text-gray-500">{ex.equipment}</span>
                        </>
                      )}
                    </div>
                    {ex.difficulty && (
                      <span className={`mt-1.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${DIFFICULTY_COLORS[ex.difficulty] ?? DIFFICULTY_COLORS.Intermediate}`}>
                        {ex.difficulty}
                      </span>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 flex-shrink-0 transition-colors" />
                </div>
              </Link>
            ))
          )}

          {/* ── Pagination ── */}
          {!loading && pages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm font-semibold text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-xs text-gray-500">Page {page} / {pages}</span>
              <button
                disabled={page >= pages}
                onClick={() => setPage(p => p + 1)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm font-semibold text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
