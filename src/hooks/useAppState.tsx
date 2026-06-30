import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import type { PhotoFile, ScanResult } from '@/core/types/photo'
import {
  deletePhotosFromDisk,
  type DiskDeleteResult,
} from '@/core/photos/deleteFromDisk'
import { mergePhotosDeduped } from '@/core/photos/mergePhotos'
import { pruneScanResult } from '@/core/photos/pruneScanResult'
import { clearAppSession, loadAppSession, saveAppSession } from '@/core/storage/catalogStore'
import { deferToIdle } from '@/core/utils/async'

interface AppState {
  photos: PhotoFile[]
  scanResult: ScanResult | null
  analyzedPhotoIds: string[]
  hydrated: boolean
  setPhotos: (photos: PhotoFile[]) => void
  addPhotos: (photos: PhotoFile[]) => void
  setScanResult: Dispatch<SetStateAction<ScanResult | null>>
  markPhotosAnalyzed: (photoIds: string[]) => void
  removePhotos: (photoIds: string[]) => Promise<DiskDeleteResult>
  clearAll: () => void
}

const AppStateContext = createContext<AppState | null>(null)

const emptyScanResult = (): ScanResult => ({
  photos: [],
  exactDuplicates: [],
  nearDuplicates: [],
  lowQuality: [],
})

const emptyDeleteResult = (): DiskDeleteResult => ({
  deleted: [],
  skipped: [],
  failed: [],
})

const SAVE_DEBOUNCE_MS = 600

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<PhotoFile[]>([])
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [analyzedPhotoIds, setAnalyzedPhotoIds] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)
  const saveTimerRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    loadAppSession().then((session) => {
      if (cancelled) return
      setPhotos(session.photos)
      setScanResult(session.scanResult)
      setAnalyzedPhotoIds(session.analyzedPhotoIds)
      setHydrated(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = window.setTimeout(() => {
      void saveAppSession(photos, scanResult, analyzedPhotoIds)
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [photos, scanResult, analyzedPhotoIds, hydrated])

  const markPhotosAnalyzed = useCallback((photoIds: string[]) => {
    if (photoIds.length === 0) return
    setAnalyzedPhotoIds((current) => {
      const next = new Set(current)
      for (const id of photoIds) next.add(id)
      return [...next]
    })
  }, [])

  const addPhotos = useCallback((incoming: PhotoFile[]) => {
    setPhotos((current) => mergePhotosDeduped(current, incoming))
    setScanResult(null)
  }, [])

  const removePhotos = useCallback(async (photoIds: string[]) => {
    if (photoIds.length === 0) return emptyDeleteResult()

    const idSet = new Set(photoIds)
    let targets: PhotoFile[] = []

    setPhotos((current) => {
      targets = current.filter((photo) => idSet.has(photo.id))
      return current
    })

    const diskResult = await deletePhotosFromDisk(targets)
    const removedFromApp = new Set([...diskResult.deleted, ...diskResult.skipped])

    await deferToIdle()

    setPhotos((current) => current.filter((photo) => !removedFromApp.has(photo.id)))
    setAnalyzedPhotoIds((current) => current.filter((id) => !removedFromApp.has(id)))
    setScanResult((current) => {
      if (!current) return null
      return pruneScanResult(current, [...removedFromApp])
    })

    return diskResult
  }, [])

  const clearAll = useCallback(() => {
    setPhotos([])
    setScanResult(null)
    setAnalyzedPhotoIds([])
    void clearAppSession()
  }, [])

  const value: AppState = {
    photos,
    scanResult,
    analyzedPhotoIds,
    hydrated,
    setPhotos,
    addPhotos,
    setScanResult,
    markPhotosAnalyzed,
    removePhotos,
    clearAll,
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) {
    throw new Error('useAppState doit être utilisé dans AppStateProvider')
  }
  return ctx
}

export { emptyScanResult }
