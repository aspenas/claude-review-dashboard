import { Amplify } from 'aws-amplify'
import { Review, Repository, CostSummary, OrganizationSettings } from '@/types'

// Configure Amplify (will be initialized with environment variables)
Amplify.configure({
  API: {
    REST: {
      ClaudeReviewAPI: {
        endpoint: import.meta.env.VITE_API_ENDPOINT || 'https://api.candlefish.ai',
        region: import.meta.env.VITE_AWS_REGION || 'us-east-1'
      }
    }
  }
})

// API client class
class ClaudeReviewAPI {
  private baseURL: string

  constructor() {
    this.baseURL = import.meta.env.VITE_API_ENDPOINT || 'https://api.candlefish.ai'
  }

  // Fetch recent reviews
  async getRecentReviews(limit = 100): Promise<Review[]> {
    const response = await fetch(`${this.baseURL}/reviews?limit=${limit}`)
    if (!response.ok) throw new Error('Failed to fetch reviews')
    return response.json()
  }

  // Fetch repository statistics
  async getRepositories(): Promise<Repository[]> {
    const response = await fetch(`${this.baseURL}/repositories`)
    if (!response.ok) throw new Error('Failed to fetch repositories')
    return response.json()
  }

  // Fetch cost summary
  async getCostSummary(startDate?: string, endDate?: string): Promise<CostSummary> {
    const params = new URLSearchParams()
    if (startDate) params.append('start', startDate)
    if (endDate) params.append('end', endDate)
    
    const response = await fetch(`${this.baseURL}/costs/summary?${params}`)
    if (!response.ok) throw new Error('Failed to fetch cost summary')
    return response.json()
  }

  // Fetch organization settings
  async getSettings(): Promise<OrganizationSettings> {
    const response = await fetch(`${this.baseURL}/settings`)
    if (!response.ok) throw new Error('Failed to fetch settings')
    return response.json()
  }

  // Update organization settings
  async updateSettings(settings: Partial<OrganizationSettings>): Promise<OrganizationSettings> {
    const response = await fetch(`${this.baseURL}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
    if (!response.ok) throw new Error('Failed to update settings')
    return response.json()
  }

  // Trigger manual cost report
  async triggerCostReport(): Promise<{ message: string }> {
    const response = await fetch(`${this.baseURL}/costs/report`, {
      method: 'POST'
    })
    if (!response.ok) throw new Error('Failed to trigger cost report')
    return response.json()
  }
}

// Export singleton instance
export const api = new ClaudeReviewAPI()

// Mock data for development
export const mockData = {
  reviews: [
    {
      review_id: 'rev_001',
      timestamp: new Date().toISOString(),
      pr_number: 123,
      repository: 'platform-api',
      organization: 'candlefish-ai',
      model: 'claude-opus-4-20250514',
      input_tokens: 150000,
      output_tokens: 25000,
      total_cost: 4.125,
      review_type: 'standard',
      duration_seconds: 45.2
    },
    {
      review_id: 'rev_002',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      pr_number: 124,
      repository: 'frontend-app',
      organization: 'candlefish-ai',
      model: 'claude-opus-4-20250514',
      input_tokens: 80000,
      output_tokens: 15000,
      total_cost: 2.325,
      review_type: 'incremental',
      duration_seconds: 28.7
    }
  ] as Review[],
  
  repositories: [
    {
      name: 'platform-api',
      total_reviews: 45,
      total_cost: 156.75,
      average_cost: 3.48,
      last_review: new Date().toISOString(),
      review_types: { standard: 30, incremental: 10, security: 5 }
    },
    {
      name: 'frontend-app',
      total_reviews: 38,
      total_cost: 98.50,
      average_cost: 2.59,
      last_review: new Date(Date.now() - 3600000).toISOString(),
      review_types: { standard: 20, incremental: 15, quick: 3 }
    }
  ] as Repository[],
  
  costSummary: {
    total_cost: 425.75,
    total_reviews: 127,
    average_cost_per_review: 3.35,
    total_input_tokens: 12500000,
    total_output_tokens: 2100000,
    cost_by_repository: {
      'platform-api': 156.75,
      'frontend-app': 98.50,
      'mobile-app': 75.25,
      'infrastructure': 95.25
    },
    cost_by_type: {
      standard: 250.00,
      incremental: 100.50,
      security: 50.25,
      quick: 25.00
    },
    cost_by_day: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      cost: Math.random() * 20 + 5,
      count: Math.floor(Math.random() * 10) + 1
    })).reverse()
  } as CostSummary
}