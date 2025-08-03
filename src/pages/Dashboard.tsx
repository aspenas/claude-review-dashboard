import { useQuery } from '@tanstack/react-query'
import { useSpring, animated, useTrail } from '@react-spring/web'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  DollarSign,
  GitPullRequest,
  Clock,
  Zap
} from 'lucide-react'
import { api, mockData } from '@/lib/api'
import { formatCurrency, formatNumber, calculateTrend, cn } from '@/lib/utils'
import CostChart from '@/components/charts/CostChart'
import RecentReviews from '@/components/RecentReviews'
import RepositoryBreakdown from '@/components/charts/RepositoryBreakdown'

const stats = [
  { 
    name: 'Total Cost Today', 
    icon: DollarSign,
    getValue: (data: any) => formatCurrency(data?.cost_by_day?.slice(-1)[0]?.cost || 0),
    trend: (data: any) => {
      const days = data?.cost_by_day || []
      if (days.length < 2) return null
      const today = days[days.length - 1].cost
      const yesterday = days[days.length - 2].cost
      return calculateTrend(today, yesterday)
    }
  },
  { 
    name: 'Reviews Today', 
    icon: GitPullRequest,
    getValue: (data: any) => formatNumber(data?.cost_by_day?.slice(-1)[0]?.count || 0),
    trend: (data: any) => {
      const days = data?.cost_by_day || []
      if (days.length < 2) return null
      const today = days[days.length - 1].count
      const yesterday = days[days.length - 2].count
      return calculateTrend(today, yesterday)
    }
  },
  { 
    name: 'Avg Cost/Review', 
    icon: Activity,
    getValue: (data: any) => formatCurrency(data?.average_cost_per_review || 0),
    trend: () => null
  },
  { 
    name: 'Avg Response Time', 
    icon: Clock,
    getValue: () => '42.3s',
    trend: () => ({ value: 8, direction: 'down' as const })
  },
]

export default function Dashboard() {
  const { data: costSummary, isLoading } = useQuery({
    queryKey: ['costSummary'],
    queryFn: async () => {
      // Use mock data in development
      if (import.meta.env.DEV) return mockData.costSummary
      return api.getCostSummary()
    }
  })

  const headerSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(-20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: { tension: 200, friction: 25 }
  })

  const trail = useTrail(stats.length, {
    from: { opacity: 0, transform: 'scale(0.9)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: { tension: 200, friction: 25 }
  })

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <animated.div style={headerSpring}>
        <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Monitor your Claude AI review costs and usage across all repositories
        </p>
      </animated.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {trail.map((style, index) => {
          const stat = stats[index]
          const trend = stat.trend(costSummary)
          
          return (
            <animated.div
              key={stat.name}
              style={style}
              className="glass rounded-xl p-6 card-hover"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-claude-100 dark:bg-claude-900/20 rounded-lg">
                  <stat.icon className="h-6 w-6 text-claude-600" />
                </div>
                {trend && (
                  <div className={cn(
                    'flex items-center gap-1 text-sm',
                    trend.direction === 'up' ? 'text-cost-high' : 'text-cost-low'
                  )}>
                    {trend.direction === 'up' ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>{trend.value.toFixed(1)}%</span>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.name}</p>
                <p className="text-2xl font-bold mt-1">
                  {isLoading ? (
                    <span className="skeleton inline-block w-24 h-8 rounded" />
                  ) : (
                    stat.getValue(costSummary)
                  )}
                </p>
              </div>
            </animated.div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CostChart data={costSummary?.cost_by_day || []} />
        </div>
        <div>
          <RepositoryBreakdown data={costSummary?.cost_by_repository || {}} />
        </div>
      </div>

      {/* Recent Reviews */}
      <RecentReviews />

      {/* Quick Actions */}
      <animated.div
        style={useSpring({
          from: { opacity: 0 },
          to: { opacity: 1 },
          delay: 600
        })}
        className="glass rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-claude-500" />
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-4">
          <button className="px-4 py-2 bg-claude-500 text-white rounded-lg hover:bg-claude-600 transition-colors">
            Generate Cost Report
          </button>
          <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-claude-500 transition-colors">
            Export Data
          </button>
          <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-claude-500 transition-colors">
            Configure Alerts
          </button>
        </div>
      </animated.div>
    </div>
  )
}