import { Suspense, lazy, useEffect, type ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useStore } from '../core/storage/store'
import { ProfileScreen } from './screens/ProfileScreen'
import { MapScreen } from './screens/MapScreen'
import { IslandScreen } from './screens/IslandScreen'
import { PlayScreen } from './screens/PlayScreen'
import { StickersScreen } from './screens/StickersScreen'

// The recording studio exists only in dev builds (docs/DECISIONS.md D10).
const Studio = import.meta.env.DEV ? lazy(() => import('../tools/studio/Studio')) : null

export function App() {
  const load = useStore(s => s.load)
  const loaded = useStore(s => s.loaded)
  useEffect(() => { void load() }, [load])
  if (!loaded) return null

  return (
    <HashRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<WithProfile><MapScreen /></WithProfile>} />
          <Route path="/profiles" element={<ProfileScreen />} />
          <Route path="/island/:islandId" element={<WithProfile><IslandScreen /></WithProfile>} />
          <Route path="/play/:islandId/:skillId/:gameId" element={<WithProfile><PlayScreen /></WithProfile>} />
          <Route path="/stickers" element={<WithProfile><StickersScreen /></WithProfile>} />
          {Studio && <Route path="/studio" element={<Suspense><Studio /></Suspense>} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  )
}

function WithProfile({ children }: { children: ReactNode }) {
  const current = useStore(s => s.current)
  return current ? children : <Navigate to="/profiles" replace />
}
