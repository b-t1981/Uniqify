import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-black hover:brightness-110',
  secondary: 'bg-surface-overlay text-white hover:bg-border',
  danger: 'bg-danger text-white hover:brightness-110',
  ghost: 'bg-transparent text-text-muted hover:bg-surface-overlay hover:text-white',
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
