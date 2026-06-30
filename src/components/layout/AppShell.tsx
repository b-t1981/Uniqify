import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { AppStateProvider, useAppState } from '@/hooks/useAppState'
import { IconHome, IconImport, IconReview, IconScan } from '@/components/ui/Icons'

const navItems = [
  { to: '/', label: 'Accueil', Icon: IconHome },
  { to: '/import', label: 'Photos', Icon: IconImport },
  { to: '/doublons', label: 'Analyser', Icon: IconScan },
  { to: '/revue', label: 'Revue', Icon: IconReview },
]

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppStateProvider>
      <AppShellFrame>{children}</AppShellFrame>
    </AppStateProvider>
  )
}

function AppShellFrame({ children }: { children: ReactNode }) {
  const { hydrated } = useAppState()

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col bg-bg">
      <main className="flex-1 px-5 pb-28 pt-4">
        {!hydrated ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
            <p className="text-[15px] text-label-secondary">Chargement de votre session…</p>
          </div>
        ) : (
          children
        )}
      </main>

      <nav className="glass fixed inset-x-0 bottom-0 z-20 border-t border-separator/60">
        <ul className="mx-auto grid max-w-lg grid-cols-4 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  [
                    'flex flex-col items-center gap-1 rounded-2xl px-2 py-2 transition',
                    isActive ? 'text-accent' : 'text-label-tertiary',
                    !hydrated ? 'pointer-events-none opacity-50' : '',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        'flex h-8 w-14 items-center justify-center rounded-full transition',
                        isActive ? 'bg-accent-soft' : '',
                      ].join(' ')}
                    >
                      <item.Icon className="h-[22px] w-[22px]" />
                    </span>
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
