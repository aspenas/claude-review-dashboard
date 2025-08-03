import { useQuery } from '@tanstack/react-query'
import { useSpring, animated } from '@react-spring/web'
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import CostTrends from '@/components/charts/CostTrends'
import ReviewTypeBreakdown from '@/components/charts/ReviewTypeBreakdown'
import RepositoryBreakdown from '@/components/charts/RepositoryBreakdown'

export default function CostAnalysis() {
  const fadeIn = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: { tension: 200, friction: 25 }
  })

  const { data: costSummary, isLoading } = useQuery({
    queryKey: ['cost-summary'],
    queryFn: () => api.getCostSummary()
  })

  if (isLoading || !costSummary) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const monthlyBudget = 5000
  const budgetUsed = (costSummary.total_cost / monthlyBudget) * 100
  const projectedMonthly = costSummary.total_cost * (30 / costSummary.cost_by_day.length)
  const projectedOverBudget = projectedMonthly > monthlyBudget

  return (
    <animated.div style={fadeIn} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cost Analysis</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Detailed breakdown of Claude API usage costs
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={DollarSign}
          label="Total Cost (MTD)"
          value={formatCurrency(costSummary.total_cost)}
          trend={+15.3}
          color="primary"
        />
        <MetricCard
          icon={TrendingUp}
          label="Projected Monthly"
          value={formatCurrency(projectedMonthly)}
          trend={projectedOverBudget ? -5.2 : +5.2}
          color={projectedOverBudget ? 'red' : 'green'}
        />
        <MetricCard
          icon={AlertCircle}
          label="Budget Used"
          value={`${budgetUsed.toFixed(1)}%`}
          subValue={`of ${formatCurrency(monthlyBudget)}`}
          color={budgetUsed > 80 ? 'red' : 'primary'}
        />
        <MetricCard
          icon={DollarSign}
          label="Avg Cost/Review"
          value={formatCurrency(costSummary.average_cost_per_review)}
          trend={-8.1}
          color="primary"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <CostTrends data={costSummary.cost_by_day} />
        </div>
        <RepositoryBreakdown data={costSummary.cost_by_repository} />
        <ReviewTypeBreakdown data={costSummary.cost_by_type} />
      </div>
    </animated.div>
  )
}

interface MetricCardProps {
  icon: React.ElementType
  label: string
  value: string
  subValue?: string
  trend?: number
  color?: 'primary' | 'green' | 'red'
}

function MetricCard({ icon: Icon, label, value, subValue, trend, color = 'primary' }: MetricCardProps) {
  const cardSpring = useSpring({
    from: { opacity: 0, scale: 0.95 },
    to: { opacity: 1, scale: 1 },
    config: { tension: 200, friction: 20 }
  })

  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    green: 'text-green-500 bg-green-500/10',
    red: 'text-red-500 bg-red-500/10'
  }

  return (
    <animated.div style={cardSpring} className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="text-sm font-medium">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {subValue && <p className="text-sm text-gray-500 mt-1">{subValue}</p>}
    </animated.div>
  )
}