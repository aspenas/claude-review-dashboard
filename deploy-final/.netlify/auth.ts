import { Handler } from '@netlify/functions'
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

const secretsClient = new SecretsManagerClient({ 
  region: 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN
  } : undefined
})

// Allowed GitHub users
const ALLOWED_USERS = ['aspenas', 'aaron', 'tyler'] // Replace with actual GitHub usernames

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    }
  }

  const { code, state } = event.queryStringParameters || {}

  if (!code) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Missing authorization code' })
    }
  }

  try {
    // Get OAuth credentials from environment or AWS Secrets Manager
    let client_id = process.env.GITHUB_CLIENT_ID || ''
    let client_secret = process.env.GITHUB_CLIENT_SECRET || ''
    
    // If not in environment, try AWS Secrets Manager
    if (!client_id || !client_secret) {
      try {
        const clientIdSecret = await secretsClient.send(new GetSecretValueCommand({
          SecretId: 'candlefish-ai/github/oauth-client-id'
        }))
        const clientSecretSecret = await secretsClient.send(new GetSecretValueCommand({
          SecretId: 'candlefish-ai/github/oauth-client-secret'
        }))
        
        client_id = clientIdSecret.SecretString || ''
        client_secret = clientSecretSecret.SecretString || ''
      } catch (secretError) {
        console.error('Failed to get OAuth credentials from AWS Secrets Manager:', secretError)
        throw new Error('OAuth credentials not configured')
      }
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id,
        client_secret,
        code
      })
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error)
    }

    // Get user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    const userData = await userResponse.json()

    // Check if user is allowed
    if (!ALLOWED_USERS.includes(userData.login)) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Access denied',
          message: `User ${userData.login} is not authorized to access this dashboard`
        })
      }
    }

    // Generate a simple JWT token (in production, use a proper JWT library)
    const token = Buffer.from(JSON.stringify({
      user: userData.login,
      name: userData.name,
      avatar: userData.avatar_url,
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    })).toString('base64')

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        token,
        user: {
          login: userData.login,
          name: userData.name,
          avatar_url: userData.avatar_url
        }
      })
    }
  } catch (error) {
    console.error('Auth error:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Authentication failed' })
    }
  }
}