import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  large?: boolean
}

export function PageHeader({
  title,
  description,
  action,
  large = true,
}: PageHeaderProps) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h1
          className={[
            'font-bold tracking-tight text-label text-balance',
            large ? 'text-[34px] leading-[1.1]' : 'text-[22px]',
          ].join(' ')}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-md text-[17px] leading-snug text-label-secondary">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  )
}
