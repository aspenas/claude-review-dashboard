import { Handler } from '@netlify/functions'

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

  // Get GitHub token from Authorization header
  const authHeader = event.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Missing authorization token' })
    }
  }
  
  const githubToken = authHeader.substring(7) // Remove "Bearer "
  
  try {
    // Verify token with GitHub API
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    if (!userResponse.ok) {
      throw new Error('Invalid GitHub token')
    }
    
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
    
    // Generate a session token
    const sessionToken = Buffer.from(JSON.stringify({
      user: userData.login,
      name: userData.name || userData.login,
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
        token: sessionToken,
        user: {
          login: userData.login,
          name: userData.name || userData.login,
          avatar_url: userData.avatar_url
        }
      })
    }
  } catch (error) {
    console.error('Auth error:', error)
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Authentication failed' })
    }
  }
}