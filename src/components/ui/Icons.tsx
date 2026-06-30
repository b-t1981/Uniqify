import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export function IconHome(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
    </svg>
  )
}

export function IconImport(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <circle cx="9" cy="10" r="1.6" fill="currentColor" stroke="none" />
      <path d="m4 16 4.5-4.5a1 1 0 0 1 1.4 0L14 16" strokeLinejoin="round" />
      <path d="M14 13.5 16 11.5" strokeLinecap="round" />
    </svg>
  )
}

export function IconScan(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4-4" strokeLinecap="round" />
      <path d="M8 11h6M11 8v6" strokeLinecap="round" />
    </svg>
  )
}

export function IconReview(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M7 7h11M7 12h8M7 17h5" strokeLinecap="round" />
      <rect x="4" y="4" width="16" height="16" rx="3" />
    </svg>
  )
}

export function IconChevron(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconShield(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 3 5 6v6c0 4.2 3 7.8 7 9 4-1.2 7-4.8 7-9V6l-7-3Z" strokeLinejoin="round" />
      <path d="m9.5 12 1.8 1.8L15 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconPhotos(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="4" />
      <circle cx="9" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
      <path d="m3 15 5-4.5a1.2 1.2 0 0 1 1.6 0L14 15" strokeLinejoin="round" />
      <path d="M13.5 12.5 17 9" strokeLinecap="round" />
    </svg>
  )
}
