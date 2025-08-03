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

  const { limit = '100' } = event.queryStringParameters || {}

  try {
    const command = new ScanCommand({
      TableName: 'claude-review-usage',
      Limit: parseInt(limit),
      ScanIndexForward: false
    })

    const result = await dynamoClient.send(command)

    const reviews = result.Items?.map(item => ({
      review_id: item.review_id?.S,
      timestamp: item.timestamp?.S,
      pr_number: parseInt(item.pr_number?.N || '0'),
      repository: item.repository?.S,
      organization: item.organization?.S,
      model: item.model?.S,
      input_tokens: parseInt(item.input_tokens?.N || '0'),
      output_tokens: parseInt(item.output_tokens?.N || '0'),
      total_cost: parseFloat(item.total_cost?.N || '0'),
      review_type: item.review_type?.S,
      duration_seconds: parseFloat(item.duration_seconds?.N || '0'),
      metadata: item.metadata?.S ? JSON.parse(item.metadata.S) : undefined
    })) || []

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(reviews)
    }
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Failed to fetch reviews' })
    }
  }
}