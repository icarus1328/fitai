'use client';

import { Suspense } from 'react';
import NewWorkoutInner from './NewWorkoutInner';

export default function NewWorkoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <NewWorkoutInner />
    </Suspense>
  );
}
