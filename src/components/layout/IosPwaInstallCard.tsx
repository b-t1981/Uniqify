import { Card } from '@/components/ui/Card'
import { shouldShowIosPwaInstall } from '@/platforms/web/isIosPwa'

export function IosPwaInstallCard() {
  if (!shouldShowIosPwaInstall()) return null

  return (
    <Card title="Installer sur iPhone" padding="sm">
      <p className="text-[14px] leading-snug text-label-secondary">
        Depuis <strong className="font-medium text-label">Safari</strong>, cette version Vercel
        s&apos;installe comme une app sur votre écran d&apos;accueil :
      </p>
      <ol className="mt-3 space-y-2 text-[14px] leading-snug text-label-secondary">
        <li>
          <span className="font-medium text-label">1.</span> Touchez{' '}
          <span className="inline-flex items-center rounded bg-fill px-1.5 py-0.5 text-[13px]">
            Partager
          </span>{' '}
          (carré avec flèche)
        </li>
        <li>
          <span className="font-medium text-label">2.</span> Choisissez{' '}
          <span className="font-medium text-label">Sur l&apos;écran d&apos;accueil</span>
        </li>
        <li>
          <span className="font-medium text-label">3.</span> Validez — l&apos;icône Uniqify apparaît
          comme une app
        </li>
      </ol>
      <p className="mt-3 rounded-xl bg-fill-secondary px-3 py-2 text-[12px] leading-snug text-label-tertiary">
        Version web : import limité via Safari. Pour indexer toute la galerie et supprimer dans
        Photos, il faut l&apos;app native compilée avec Xcode (TestFlight / App Store).
      </p>
    </Card>
  )
}
