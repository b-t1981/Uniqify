import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AppStateProvider } from '@/hooks/useAppState'

const navItems = [
  { to: '/', label: 'Accueil', icon: '⌂' },
  { to: '/import', label: 'Importer', icon: '＋' },
  { to: '/doublons', label: 'Doublons', icon: '◎' },
  { to: '/revue', label: 'Revue', icon: '⇆' },
]

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppStateProvider>
      <div className="mx-auto flex min-h-full max-w-5xl flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold tracking-tight">Uniqify</p>
              <p className="text-xs text-text-muted">
                Tri · doublons · photos inutiles
              </p>
            </div>
            <span className="rounded-full bg-surface-overlay px-2.5 py-1 text-xs text-text-muted">
              PWA
            </span>
          </div>
        </header>

        <main className="flex-1 px-4 py-5">{children}</main>

        <nav className="sticky bottom-0 border-t border-border bg-surface/95 backdrop-blur">
          <ul className="grid grid-cols-4 gap-1 px-2 py-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-xs transition-colors',
                      isActive
                        ? 'bg-surface-overlay text-white'
                        : 'text-text-muted hover:text-white',
                    ].join(' ')
                  }
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </AppStateProvider>
  )
}
