import { Handler } from '@netlify/functions'

// This function proxies requests to your AWS API Gateway or Lambda functions
// It handles CORS and authentication

const API_ENDPOINT = process.env.API_ENDPOINT || 'https://api.candlefish.ai'

export const handler: Handler = async (event) => {
  const path = event.path.replace('/.netlify/functions/proxy', '')
  const url = `${API_ENDPOINT}${path}${event.rawQuery ? `?${event.rawQuery}` : ''}`

  try {
    const response = await fetch(url, {
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/json',
        ...event.headers
      },
      body: event.body
    })

    const data = await response.text()

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: data
    }
  } catch (error) {
    console.error('Proxy error:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}