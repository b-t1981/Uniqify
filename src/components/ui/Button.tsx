import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'tinted'
type Size = 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white shadow-sm hover:brightness-105 active:brightness-95',
  secondary: 'bg-fill text-label hover:bg-separator/60 active:bg-separator/80',
  tinted: 'bg-accent-soft text-accent hover:brightness-95 active:brightness-90',
  danger: 'bg-danger text-white hover:brightness-105 active:brightness-95',
  ghost: 'bg-transparent text-accent hover:bg-accent-soft active:bg-accent-soft',
}

const sizes: Record<Size, string> = {
  md: 'min-h-11 px-5 text-[15px]',
  lg: 'min-h-[52px] px-6 text-[17px] font-semibold',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition',
        'disabled:cursor-not-allowed disabled:opacity-40',
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
