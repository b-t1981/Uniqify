import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAppState } from '@/hooks/useAppState'
import { getPhotoAdapter } from '@/platforms'

export function HomePage() {
  const { photos } = useAppState()
  const adapter = getPhotoAdapter()

  return (
    <div>
      <PageHeader
        title="Bienvenue"
        description="Nettoyez votre galerie : doublons exacts, photos proches et clichés inutiles."
      />

      <div className="space-y-4">
        <Card
          title="Vos photos restent locales"
          description="Tout le traitement se fait sur votre appareil. Rien n'est envoyé sur un serveur."
        />

        <Card
          title="Commencer"
          description={
            adapter.canPickFolder
              ? 'Importez un dossier (desktop) ou sélectionnez des photos (mobile).'
              : 'Sur iPhone, sélectionnez vos photos via le sélecteur iOS natif.'
          }
        >
          <div className="flex flex-wrap gap-3">
            <Link to="/import">
              <Button>Importer des photos</Button>
            </Link>
            <Link to="/doublons">
              <Button variant="secondary">Voir les doublons</Button>
            </Link>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Photos importées" value={String(photos.length)} />
          <Stat label="Plateforme" value={adapter.platformLabel} />
          <Stat
            label="Dossier"
            value={adapter.canPickFolder ? 'Oui' : 'Non'}
          />
          <Stat
            label="Suppr. galerie"
            value={adapter.canDeleteFromGallery ? 'Oui' : 'Phase 2'}
          />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-3">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}
