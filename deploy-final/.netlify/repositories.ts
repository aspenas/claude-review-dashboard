import { Handler } from '@netlify/functions'
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb'

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

  try {
    const scanCommand = new ScanCommand({
      TableName: 'claude-review-usage'
    })

    const result = await dynamoClient.send(scanCommand)

    // Aggregate by repository
    const repoStats = new Map<string, any>()

    result.Items?.forEach(item => {
      const repo = item.repository?.S || 'unknown'
      const cost = parseFloat(item.total_cost?.N || '0')
      const reviewType = item.review_type?.S || 'standard'
      const timestamp = item.timestamp?.S

      if (!repoStats.has(repo)) {
        repoStats.set(repo, {
          name: repo,
          total_reviews: 0,
          total_cost: 0,
          review_types: {},
          last_review: timestamp,
          first_review: timestamp
        })
      }

      const stats = repoStats.get(repo)
      stats.total_reviews++
      stats.total_cost += cost
      stats.review_types[reviewType] = (stats.review_types[reviewType] || 0) + 1

      // Update last review if newer
      if (timestamp && timestamp > stats.last_review) {
        stats.last_review = timestamp
      }
      // Update first review if older
      if (timestamp && timestamp < stats.first_review) {
        stats.first_review = timestamp
      }
    })

    // Calculate averages and format
    const repositories = Array.from(repoStats.values()).map(repo => ({
      ...repo,
      average_cost: repo.total_reviews > 0 ? repo.total_cost / repo.total_reviews : 0
    }))

    // Sort by total cost descending
    repositories.sort((a, b) => b.total_cost - a.total_cost)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(repositories)
    }
  } catch (error) {
    console.error('Error fetching repositories:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Failed to fetch repositories' })
    }
  }
}