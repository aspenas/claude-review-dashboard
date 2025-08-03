import { Handler } from '@netlify/functions'
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'

const dynamoClient = new DynamoDBClient({ 
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN
  }
})

const SETTINGS_TABLE = 'claude-review-settings'

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS'
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

  if (event.httpMethod === 'GET') {
    return getSettings()
  } else if (event.httpMethod === 'PATCH') {
    return updateSettings(event.body)
  }

  return {
    statusCode: 405,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ error: 'Method not allowed' })
  }
}

async function getSettings() {
  try {
    // First check if settings table exists
    const command = new GetItemCommand({
      TableName: SETTINGS_TABLE,
      Key: {
        'setting_id': { S: 'global' }
      }
    })

    try {
      const result = await dynamoClient.send(command)
      
      if (result.Item) {
        const settings = {
          monthly_budget: parseFloat(result.Item.monthly_budget?.N || '5000'),
          per_repo_daily: parseFloat(result.Item.per_repo_daily?.N || '100'),
          per_pr_maximum: parseFloat(result.Item.per_pr_maximum?.N || '20'),
          default_review_type: result.Item.default_review_type?.S || 'standard',
          auto_incremental: result.Item.auto_incremental?.BOOL !== false,
          skip_patterns: result.Item.skip_patterns?.SS || ['*.lock', '*.generated.*', 'dist/*', 'build/*'],
          notification_webhook: result.Item.notification_webhook?.S,
          alert_thresholds: {
            daily: parseFloat(result.Item.alert_daily?.N || '200'),
            weekly: parseFloat(result.Item.alert_weekly?.N || '1000'),
            monthly: parseFloat(result.Item.alert_monthly?.N || '2000')
          }
        }
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify(settings)
        }
      }
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        // Settings table doesn't exist, return defaults
        console.log('Settings table does not exist, returning defaults')
      } else {
        throw error
      }
    }

    // Return default settings
    const defaultSettings = {
      monthly_budget: 5000,
      per_repo_daily: 100,
      per_pr_maximum: 20,
      default_review_type: 'standard',
      auto_incremental: true,
      skip_patterns: ['*.lock', '*.generated.*', 'dist/*', 'build/*'],
      alert_thresholds: {
        daily: 200,
        weekly: 1000,
        monthly: 2000
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(defaultSettings)
    }
  } catch (error) {
    console.error('Error fetching settings:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Failed to fetch settings' })
    }
  }
}

async function updateSettings(body: string | null) {
  if (!body) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Request body required' })
    }
  }

  try {
    const updates = JSON.parse(body)

    const command = new PutItemCommand({
      TableName: SETTINGS_TABLE,
      Item: {
        'setting_id': { S: 'global' },
        'monthly_budget': { N: (updates.monthly_budget || 5000).toString() },
        'per_repo_daily': { N: (updates.per_repo_daily || 100).toString() },
        'per_pr_maximum': { N: (updates.per_pr_maximum || 20).toString() },
        'default_review_type': { S: updates.default_review_type || 'standard' },
        'auto_incremental': { BOOL: updates.auto_incremental !== false },
        'skip_patterns': { SS: updates.skip_patterns || ['*.lock', '*.generated.*', 'dist/*', 'build/*'] },
        'notification_webhook': { S: updates.notification_webhook || '' },
        'alert_daily': { N: (updates.alert_thresholds?.daily || 200).toString() },
        'alert_weekly': { N: (updates.alert_thresholds?.weekly || 1000).toString() },
        'alert_monthly': { N: (updates.alert_thresholds?.monthly || 2000).toString() },
        'updated_at': { S: new Date().toISOString() }
      }
    })

    await dynamoClient.send(command)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ message: 'Settings updated successfully' })
    }
  } catch (error) {
    console.error('Error updating settings:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Failed to update settings' })
    }
  }
}