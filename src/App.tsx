import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { HomePage } from '@/pages/HomePage'
import { ImportPage } from '@/pages/ImportPage'
import { DuplicatesPage } from '@/pages/DuplicatesPage'
import { ReviewPage } from '@/pages/ReviewPage'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/doublons" element={<DuplicatesPage />} />
        <Route path="/revue" element={<ReviewPage />} />
      </Routes>
    </AppShell>
  )
}
