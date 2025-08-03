import { Handler } from '@netlify/functions'
import { DynamoDBClient, ScanCommand, QueryCommand } from '@aws-sdk/client-dynamodb'

const dynamoClient = new DynamoDBClient({ 
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN
  }
})

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    }
  }

  // Check authentication
  const authHeader = event.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }

  const { start, end } = event.queryStringParameters || {}

  try {
    // For now, scan all data (later optimize with date range queries)
    const command = new ScanCommand({
      TableName: 'claude-review-usage'
    })

    const result = await dynamoClient.send(command)

    // Aggregate data
    let totalCost = 0
    let totalReviews = 0
    let totalInputTokens = 0
    let totalOutputTokens = 0
    const costByRepository: Record<string, number> = {}
    const costByType: Record<string, number> = {}
    const costByDay: Record<string, { cost: number; count: number }> = {}

    result.Items?.forEach(item => {
      const cost = parseFloat(item.total_cost?.N || '0')
      const repo = item.repository?.S || 'unknown'
      const type = item.review_type?.S || 'standard'
      const timestamp = item.timestamp?.S
      const date = timestamp?.split('T')[0] || ''
      const inputTokens = parseInt(item.input_tokens?.N || '0')
      const outputTokens = parseInt(item.output_tokens?.N || '0')

      // Filter by date range if provided
      if (start && date < start) return
      if (end && date > end) return

      totalCost += cost
      totalReviews++
      totalInputTokens += inputTokens
      totalOutputTokens += outputTokens

      costByRepository[repo] = (costByRepository[repo] || 0) + cost
      costByType[type] = (costByType[type] || 0) + cost

      if (date) {
        if (!costByDay[date]) {
          costByDay[date] = { cost: 0, count: 0 }
        }
        costByDay[date].cost += cost
        costByDay[date].count++
      }
    })

    // Convert daily data to array format
    const costByDayArray = Object.entries(costByDay)
      .map(([date, data]) => ({
        date,
        cost: data.cost,
        count: data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Fill in missing days with zeros for better charts
    if (costByDayArray.length > 0) {
      const startDate = new Date(costByDayArray[0].date)
      const endDate = new Date(costByDayArray[costByDayArray.length - 1].date)
      const filledDays: typeof costByDayArray = []
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]
        const existing = costByDay[dateStr]
        filledDays.push({
          date: dateStr,
          cost: existing?.cost || 0,
          count: existing?.count || 0
        })
      }
      
      costByDayArray.length = 0
      costByDayArray.push(...filledDays)
    }

    const summary = {
      total_cost: totalCost,
      total_reviews: totalReviews,
      average_cost_per_review: totalReviews > 0 ? totalCost / totalReviews : 0,
      total_input_tokens: totalInputTokens,
      total_output_tokens: totalOutputTokens,
      cost_by_repository: costByRepository,
      cost_by_type: costByType,
      cost_by_day: costByDayArray
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(summary)
    }
  } catch (error) {
    console.error('Error generating cost summary:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Failed to generate cost summary' })
    }
  }
}