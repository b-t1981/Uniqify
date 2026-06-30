import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, ActionRow, StatPill } from '@/components/ui/Card'
import { ScanProgress } from '@/components/ui/ScanProgress'
import { LowQualityList } from '@/components/photos/LowQualityList'
import { DuplicateGroupList } from '@/components/photos/DuplicateGroupList'
import { Button } from '@/components/ui/Button'
import { useAppState, emptyScanResult } from '@/hooks/useAppState'
import { scanLowQuality, type QualityScanProgress } from '@/core/quality/scanLowQuality'
import {
  scanExactDuplicates,
  type ExactScanProgress,
} from '@/core/duplicates/scanExactDuplicates'
import {
  scanNearDuplicates,
  type NearScanProgress,
} from '@/core/duplicates/scanNearDuplicates'

type ActiveScan = 'exact' | 'near' | 'quality' | null

export function DuplicatesPage() {
  const { photos, scanResult, setScanResult } = useAppState()
  const [activeScan, setActiveScan] = useState<ActiveScan>(null)
  const [exactProgress, setExactProgress] = useState<ExactScanProgress | null>(null)
  const [nearProgress, setNearProgress] = useState<NearScanProgress | null>(null)
  const [qualityProgress, setQualityProgress] = useState<QualityScanProgress | null>(null)

  const scanning = activeScan !== null

  const exactGroups = scanResult?.exactDuplicates ?? []
  const nearGroups = scanResult?.nearDuplicates ?? []
  const lowQualityGroups = scanResult?.lowQuality ?? []

  const exact = exactGroups.length
  const near = nearGroups.length
  const lowQuality = lowQualityGroups.length
  const hasResults = exact > 0 || near > 0 || lowQuality > 0

  async function handleScanExact() {
    if (photos.length === 0 || scanning) return
    setActiveScan('exact')
    setExactProgress({ phase: 'hashing', processed: 0, total: photos.length, currentName: '' })
    try {
      const groups = await scanExactDuplicates(photos, setExactProgress)
      const base = scanResult ?? emptyScanResult()
      setScanResult({ ...base, photos, exactDuplicates: groups })
    } finally {
      setActiveScan(null)
      setExactProgress(null)
    }
  }

  async function handleScanNear() {
    if (photos.length < 2 || scanning) return
    setActiveScan('near')
    setNearProgress({ phase: 'hashing', processed: 0, total: photos.length, currentName: '' })
    try {
      const groups = await scanNearDuplicates(photos, setNearProgress)
      const base = scanResult ?? emptyScanResult()
      setScanResult({ ...base, photos, nearDuplicates: groups })
    } finally {
      setActiveScan(null)
      setNearProgress(null)
    }
  }

  async function handleScanLowQuality() {
    if (photos.length === 0 || scanning) return
    setActiveScan('quality')
    setQualityProgress({ processed: 0, total: photos.length, currentName: '' })
    try {
      const groups = await scanLowQuality(photos, setQualityProgress)
      const base = scanResult ?? emptyScanResult()
      setScanResult({ ...base, photos, lowQuality: groups })
    } finally {
      setActiveScan(null)
      setQualityProgress(null)
    }
  }

  const progress =
    activeScan === 'exact' && exactProgress
      ? {
          processed: exactProgress.processed,
          total: exactProgress.total,
          label:
            exactProgress.phase === 'grouping'
              ? 'Regroupement…'
              : exactProgress.currentName,
        }
      : activeScan === 'near' && nearProgress
        ? {
            processed: nearProgress.processed,
            total: nearProgress.total,
            label:
              nearProgress.phase === 'hashing'
                ? nearProgress.currentName
                : nearProgress.phase === 'comparing'
                  ? 'Comparaison…'
                  : 'Regroupement…',
          }
        : activeScan === 'quality' && qualityProgress
          ? {
              processed: qualityProgress.processed,
              total: qualityProgress.total,
              label: qualityProgress.currentName,
            }
          : null

  if (photos.length === 0) {
    return (
      <div>
        <PageHeader title="Analyser" description="Détectez ce qui encombre votre galerie." large={false} />
        <Card>
          <p className="text-[15px] text-label-secondary">
            Importez d&apos;abord vos photos pour lancer une analyse.
          </p>
          <Link to="/import" className="mt-4 block">
            <Button fullWidth>Importer des photos</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Analyser"
        description={`${photos.length} photo${photos.length > 1 ? 's' : ''} importée${photos.length > 1 ? 's' : ''}.`}
        large={false}
      />

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <StatPill label="Exactes" value={exact} />
          <StatPill label="Proches" value={near} />
          <StatPill label="Inutiles" value={lowQuality} />
        </div>

        <Card padding="none">
          <ActionRow
            title="Doublons exacts"
            subtitle="Copies identiques"
            onClick={handleScanExact}
            disabled={scanning && activeScan !== 'exact'}
            loading={activeScan === 'exact'}
            accent="blue"
          />
          <ActionRow
            title="Doublons proches"
            subtitle="Même scène, photo différente"
            onClick={handleScanNear}
            disabled={(scanning && activeScan !== 'near') || photos.length < 2}
            loading={activeScan === 'near'}
            accent="orange"
          />
          <ActionRow
            title="Photos inutiles"
            subtitle="Flou, sombre, mal cadré"
            onClick={handleScanLowQuality}
            disabled={scanning && activeScan !== 'quality'}
            loading={activeScan === 'quality'}
            accent="red"
            isLast
          />
        </Card>

        {progress ? <ScanProgress {...progress} /> : null}

        {exact > 0 ? (
          <section className="space-y-3">
            <SectionTitle title="Doublons exacts" count={exact} />
            <DuplicateGroupList groups={exactGroups} variant="exact" />
          </section>
        ) : null}

        {near > 0 ? (
          <section className="space-y-3">
            <SectionTitle title="Doublons proches" count={near} />
            <DuplicateGroupList groups={nearGroups} variant="near" />
          </section>
        ) : null}

        {lowQuality > 0 ? (
          <section className="space-y-3">
            <SectionTitle title="Photos inutiles" count={lowQuality} />
            <LowQualityList groups={lowQualityGroups} />
          </section>
        ) : null}

        {scanResult && !scanning && !hasResults ? (
          <Card>
            <p className="text-[15px] text-label-secondary">
              Aucun problème détecté pour le moment. Lancez une analyse ci-dessus.
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="text-[20px] font-semibold tracking-tight text-label">{title}</h2>
      <span className="rounded-full bg-fill px-2.5 py-1 text-[12px] font-semibold text-label-secondary">
        {count}
      </span>
    </div>
  )
}
