import { useQuery } from '@tanstack/react-query'
import { useSpring, animated } from '@react-spring/web'
import { GitBranch, Clock, TrendingUp } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Repository } from '@/types'

export default function Repositories() {
  const fadeIn = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: { tension: 200, friction: 25 }
  })

  const { data: repositories = [], isLoading } = useQuery({
    queryKey: ['repositories'],
    queryFn: api.getRepositories
  })

  const sortedRepos = [...repositories].sort((a, b) => b.total_cost - a.total_cost)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <animated.div style={fadeIn} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Repositories</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Claude review activity across all repositories
        </p>
      </div>

      <div className="grid gap-4">
        {sortedRepos.map((repo) => (
          <RepositoryCard key={repo.name} repository={repo} />
        ))}
      </div>
    </animated.div>
  )
}

function RepositoryCard({ repository }: { repository: Repository }) {
  const cardSpring = useSpring({
    from: { opacity: 0, scale: 0.95 },
    to: { opacity: 1, scale: 1 },
    config: { tension: 200, friction: 20 }
  })

  const lastReviewDate = new Date(repository.last_review)
  const daysSinceReview = Math.floor(
    (Date.now() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <animated.div style={cardSpring} className="glass rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <GitBranch className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{repository.name}</h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              <span>
                Last review: {daysSinceReview === 0 ? 'Today' : `${daysSinceReview} days ago`}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{formatCurrency(repository.total_cost)}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total cost</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</p>
          <p className="text-lg font-semibold">{repository.total_reviews}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg Cost</p>
          <p className="text-lg font-semibold">{formatCurrency(repository.average_cost)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Trend</p>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-lg font-semibold text-green-500">+12%</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {Object.entries(repository.review_types).map(([type, count]) => (
          <span
            key={type}
            className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800"
          >
            {type}: {count}
          </span>
        ))}
      </div>
    </animated.div>
  )
}