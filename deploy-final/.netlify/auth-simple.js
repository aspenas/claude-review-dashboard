// Simple authentication function that works with Netlify
exports.handler = async (event) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Get the authorization header
  const authHeader = event.headers.authorization || event.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Missing authorization token' })
    };
  }
  
  const githubToken = authHeader.substring(7);
  
  try {
    // Verify token with GitHub API
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Invalid GitHub token');
    }
    
    const userData = await response.json();
    
    // Check if user is allowed
    const ALLOWED_USERS = ['aspenas', 'aaron', 'tyler'];
    if (!ALLOWED_USERS.includes(userData.login)) {
      return {
        statusCode: 403,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Access denied',
          message: `User ${userData.login} is not authorized`
        })
      };
    }
    
    // Generate session token
    const sessionToken = Buffer.from(JSON.stringify({
      user: userData.login,
      name: userData.name || userData.login,
      avatar: userData.avatar_url,
      expires: Date.now() + (24 * 60 * 60 * 1000)
    })).toString('base64');
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: sessionToken,
        user: {
          login: userData.login,
          name: userData.name || userData.login,
          avatar_url: userData.avatar_url
        }
      })
    };
  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 401,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Authentication failed' })
    };
  }
};