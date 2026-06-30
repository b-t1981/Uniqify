import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { IconPhotos, IconShield } from '@/components/ui/Icons'
import { useAppState } from '@/hooks/useAppState'

export function HomePage() {
  const { photos } = useAppState()
  const hasPhotos = photos.length > 0

  return (
    <div>
      <PageHeader
        title="Uniqify"
        description="Trouvez les doublons et les photos inutiles. Tout reste sur votre appareil."
      />

      <div className="space-y-4">
        <Card padding="none" className="overflow-hidden">
          <div className="bg-gradient-to-br from-accent-soft via-surface to-surface px-5 py-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-white shadow-elevated">
              <IconPhotos className="h-8 w-8 text-accent" />
            </div>
            <p className="mt-5 text-[15px] leading-relaxed text-label-secondary">
              {hasPhotos
                ? `${photos.length} photo${photos.length > 1 ? 's' : ''} prête${photos.length > 1 ? 's' : ''} à analyser.`
                : 'Importez vos photos pour commencer le nettoyage de votre galerie.'}
            </p>
            <div className="mt-6 space-y-3">
              <Link to="/import" className="block">
                <Button fullWidth size="lg">
                  {hasPhotos ? 'Ajouter des photos' : 'Importer des photos'}
                </Button>
              </Link>
              {hasPhotos ? (
                <Link to="/doublons" className="block">
                  <Button fullWidth size="lg" variant="tinted">
                    Lancer l&apos;analyse
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <IconShield className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[15px] font-semibold text-label">100 % privé</p>
              <p className="mt-1 text-[14px] leading-snug text-label-tertiary">
                Aucune photo n&apos;est envoyée sur internet. L&apos;analyse se fait localement.
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-2">
          <MiniStep step="1" label="Importer" />
          <MiniStep step="2" label="Analyser" />
          <MiniStep step="3" label="Nettoyer" />
        </div>
      </div>
    </div>
  )
}

function MiniStep({ step, label }: { step: string; label: string }) {
  return (
    <div className="rounded-2xl bg-surface px-3 py-3 text-center shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-label-tertiary">
        Étape {step}
      </p>
      <p className="mt-1 text-[14px] font-medium text-label">{label}</p>
    </div>
  )
}
