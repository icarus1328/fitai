'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dumbbell, ClipboardList, Trophy, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/',            label: 'Home',       icon: Home          },
  { href: '/workouts',    label: 'Workouts',   icon: ClipboardList },
  { href: '/exercises',   label: 'Exercises',  icon: Dumbbell      },
  { href: '/leaderboard', label: 'Ranks',      icon: Trophy        },
  { href: '/profile',     label: 'Profile',    icon: User          },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-xl border-t border-gray-800/60 safe-area-pb">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className="flex-1">
              <div className={`flex flex-col items-center gap-1 py-1.5 rounded-xl transition-all ${active ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
                <div className={`p-1.5 rounded-lg transition-all ${active ? 'bg-blue-600/20' : ''}`}>
                  <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
                </div>
                <span className={`text-[10px] font-semibold tracking-wide ${active ? 'text-blue-400' : 'text-gray-600'}`}>
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
