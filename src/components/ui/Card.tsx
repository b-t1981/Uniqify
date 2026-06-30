import type { ReactNode } from 'react'

interface CardProps {
  title: string
  description: string
  children?: ReactNode
}

export function Card({ title, description, children }: CardProps) {
  return (
    <section className="rounded-2xl border border-border bg-surface-raised p-4">
      <h2 className="font-medium">{title}</h2>
      <p className="mt-1 text-sm text-text-muted">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  )
}
