import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  description?: string
  children?: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'none'
}

export function Card({
  title,
  description,
  children,
  className = '',
  padding = 'md',
}: CardProps) {
  const paddingClass =
    padding === 'none' ? '' : padding === 'sm' ? 'p-3' : 'p-4'

  return (
    <section
      className={[
        'overflow-hidden rounded-[22px] bg-surface shadow-card',
        paddingClass,
        className,
      ].join(' ')}
    >
      {title ? (
        <header className={children ? 'mb-3' : ''}>
          <h2 className="text-[17px] font-semibold tracking-tight text-label">{title}</h2>
          {description ? (
            <p className="mt-1 text-[15px] leading-snug text-label-tertiary">{description}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  )
}

interface ActionRowProps {
  title: string
  subtitle?: string
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  accent?: 'blue' | 'orange' | 'red' | 'gray'
  isLast?: boolean
}

const accentColors = {
  blue: 'bg-accent-soft text-accent',
  orange: 'bg-[#fff4e5] text-[#ff9500]',
  red: 'bg-danger-soft text-danger',
  gray: 'bg-fill text-label-secondary',
}

export function ActionRow({
  title,
  subtitle,
  onClick,
  disabled,
  loading,
  accent = 'blue',
  isLast = false,
}: ActionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        'flex w-full items-center gap-3 px-4 py-3.5 text-left transition',
        'hover:bg-fill-secondary active:bg-fill disabled:opacity-40',
        !isLast ? 'border-b border-separator/70' : '',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[15px] font-semibold',
          accentColors[accent],
        ].join(' ')}
      >
        {title.charAt(0)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-medium text-label">
          {loading ? 'Analyse…' : title}
        </span>
        {subtitle ? (
          <span className="mt-0.5 block text-[13px] text-label-tertiary">{subtitle}</span>
        ) : null}
      </span>
      <svg
        className="h-5 w-5 shrink-0 text-label-tertiary"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-surface px-4 py-3 shadow-card">
      <p className="text-[22px] font-semibold tracking-tight text-label">{value}</p>
      <p className="mt-0.5 text-[12px] font-medium uppercase tracking-wide text-label-tertiary">
        {label}
      </p>
    </div>
  )
}
