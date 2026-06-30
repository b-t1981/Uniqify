import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { PhotoFile, ScanResult } from '@/core/types/photo'

interface AppState {
  photos: PhotoFile[]
  scanResult: ScanResult | null
  setPhotos: (photos: PhotoFile[]) => void
  addPhotos: (photos: PhotoFile[]) => void
  setScanResult: (result: ScanResult | null) => void
  clearAll: () => void
}

const AppStateContext = createContext<AppState | null>(null)

const emptyScanResult = (): ScanResult => ({
  photos: [],
  exactDuplicates: [],
  nearDuplicates: [],
  lowQuality: [],
})

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<PhotoFile[]>([])
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)

  const value = useMemo<AppState>(
    () => ({
      photos,
      scanResult,
      setPhotos,
      setScanResult,
      addPhotos: (incoming) =>
        setPhotos((current) => [...current, ...incoming]),
      clearAll: () => {
        setPhotos([])
        setScanResult(null)
      },
    }),
    [photos, scanResult],
  )

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) {
    throw new Error('useAppState doit être utilisé dans AppStateProvider')
  }
  return ctx
}

export { emptyScanResult }
