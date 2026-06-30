import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { IconReview } from '@/components/ui/Icons'

export function ReviewPage() {
  return (
    <div>
      <PageHeader
        title="Revue"
        description="Validez ce que vous gardez ou supprimez."
        large={false}
      />

      <Card padding="none">
        <div className="px-5 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-fill-secondary text-label-tertiary">
            <IconReview className="h-8 w-8" />
          </div>
          <p className="mt-5 text-[20px] font-semibold text-label">Bientôt disponible</p>
          <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-label-tertiary">
            Le mode swipe pour trier rapidement vos photos arrive dans la prochaine version.
          </p>
          <Link to="/doublons" className="mt-6 block">
            <Button fullWidth variant="tinted">
              Retour à l&apos;analyse
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
