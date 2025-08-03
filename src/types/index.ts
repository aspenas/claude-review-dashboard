export interface Review {
  review_id: string
  timestamp: string
  pr_number: number
  repository: string
  organization: string
  model: string
  input_tokens: number
  output_tokens: number
  total_cost: number
  review_type: string
  duration_seconds: number
  metadata?: Record<string, any>
}

export interface Repository {
  name: string
  total_reviews: number
  total_cost: number
  average_cost: number
  last_review: string
  review_types: Record<string, number>
}

export interface CostSummary {
  total_cost: number
  total_reviews: number
  average_cost_per_review: number
  total_input_tokens: number
  total_output_tokens: number
  cost_by_repository: Record<string, number>
  cost_by_type: Record<string, number>
  cost_by_day: Array<{
    date: string
    cost: number
    count: number
  }>
}

export interface OrganizationSettings {
  monthly_budget: number
  per_repo_daily: number
  per_pr_maximum: number
  default_review_type: string
  auto_incremental: boolean
  skip_patterns: string[]
  notification_webhook?: string
  alert_thresholds: {
    daily: number
    weekly: number
    monthly: number
  }
}