import { Outlet, Link, useLocation } from 'react-router-dom'
import { useSpring, animated } from '@react-spring/web'
import { 
  LayoutDashboard, 
  GitBranch, 
  DollarSign, 
  Settings,
  Brain,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Repositories', href: '/repositories', icon: GitBranch },
  { name: 'Cost Analysis', href: '/cost-analysis', icon: DollarSign },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Layout() {
  const location = useLocation()
  
  const sidebarSpring = useSpring({
    from: { transform: 'translateX(-100%)' },
    to: { transform: 'translateX(0%)' },
    config: { tension: 200, friction: 20 }
  })

  const contentSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: { tension: 200, friction: 25 }
  })

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <animated.div 
        style={sidebarSpring}
        className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <Brain className="h-8 w-8 text-claude-500" />
            <div>
              <h1 className="text-xl font-semibold gradient-text">Claude Review</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Cost Dashboard</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-claude-100 dark:bg-claude-900/20 text-claude-700 dark:text-claude-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <animated.div
                      style={useSpring({
                        from: { scale: 0 },
                        to: { scale: 1 },
                        config: { tension: 300, friction: 20 }
                      })}
                      className="ml-auto h-2 w-2 rounded-full bg-claude-500"
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Stats Summary */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="glass rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Today's Cost</span>
                <span className="text-sm font-semibold text-claude-600">$12.45</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Month Total</span>
                <span className="text-sm font-semibold text-claude-600">$345.67</span>
              </div>
              <div className="flex items-center gap-2 text-cost-low">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">15% below budget</span>
              </div>
            </div>
          </div>
        </div>
      </animated.div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <animated.div style={contentSpring} className="h-full overflow-y-auto">
          <Outlet />
        </animated.div>
      </div>
    </div>
  )
}