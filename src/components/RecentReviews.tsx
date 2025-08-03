import { useQuery } from '@tanstack/react-query'
import { useSpring, animated } from '@react-spring/web'
import { GitBranch, Clock, DollarSign } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Review } from '@/types'

export default function RecentReviews() {
  const containerSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: { tension: 200, friction: 20 }
  })

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['recent-reviews'],
    queryFn: () => api.getRecentReviews(10)
  })

  if (isLoading) {
    return (
      <animated.div style={containerSpring} className="glass rounded-xl p-6">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </animated.div>
    )
  }

  return (
    <animated.div style={containerSpring} className="glass rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Reviews</h3>
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent reviews</p>
        ) : (
          reviews.map((review) => (
            <ReviewItem key={review.review_id} review={review} />
          ))
        )}
      </div>
    </animated.div>
  )
}

function ReviewItem({ review }: { review: Review }) {
  const timeAgo = getTimeAgo(new Date(review.timestamp))
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <GitBranch className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{review.repository}</span>
            <span className="text-sm text-gray-500">#{review.pr_number}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="h-3 w-3" />
            <span>{timeAgo}</span>
            <span className="text-gray-400">•</span>
            <span className="capitalize">{review.review_type}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-gray-400" />
        <span className="font-semibold">{formatCurrency(review.total_cost)}</span>
      </div>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  
  return date.toLocaleDateString()
}