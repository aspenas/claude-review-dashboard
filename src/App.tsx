import { Routes, Route } from 'react-router-dom'
import { useSpring, animated } from '@react-spring/web'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Repositories from '@/pages/Repositories'
import CostAnalysis from '@/pages/CostAnalysis'
import Settings from '@/pages/Settings'

function App() {
  const fadeIn = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { duration: 500 }
  })

  return (
    <animated.div style={fadeIn} className="min-h-screen bg-background text-foreground">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="repositories" element={<Repositories />} />
          <Route path="cost-analysis" element={<CostAnalysis />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </animated.div>
  )
}

export default App