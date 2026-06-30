import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'

export function ReviewPage() {
  return (
    <div>
      <PageHeader
        title="Revue"
        description="Mode swipe pour garder ou supprimer — disponible à la v0.7."
      />

      <Card
        title="Corbeille virtuelle"
        description="Vous validerez chaque suppression avant qu'elle ne soit appliquée. Sur desktop, les fichiers seront supprimés du disque. Sur iPhone, une app native (phase 2) permettra la suppression dans la galerie."
      />
    </div>
  )
}
