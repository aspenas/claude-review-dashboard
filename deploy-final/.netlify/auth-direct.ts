import { Handler } from '@netlify/functions'
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

const secretsClient = new SecretsManagerClient({ 
  region: 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  } : undefined
})

// Allowed GitHub users
const ALLOWED_USERS = ['aspenas', 'aaron', 'tyler']

export const handler: Handler = async (event) => {
  // Handle CORS
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

  // For direct token auth
  const authHeader = event.headers.authorization
  
  if (authHeader && authHeader.startsWith('Bearer direct:')) {
    const username = authHeader.substring(14) // Remove "Bearer direct:"
    
    if (ALLOWED_USERS.includes(username)) {
      // Generate a session token
      const token = Buffer.from(JSON.stringify({
        user: username,
        name: username,
        avatar: `https://github.com/${username}.png`,
        expires: Date.now() + (24 * 60 * 60 * 1000)
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
            login: username,
            name: username,
            avatar_url: `https://github.com/${username}.png`
          }
        })
      }
    }
  }
  
  return {
    statusCode: 401,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ error: 'Unauthorized' })
  }
}
