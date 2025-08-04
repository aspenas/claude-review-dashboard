const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const client = new DynamoDBClient({
  region: process.env.MY_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  }
});

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const params = {
      TableName: 'claude-review-usage'
    };

    const result = await client.send(new ScanCommand(params));
    const reviews = result.Items.map(item => unmarshall(item));
    
    // Aggregate by repository
    const repoStats = {};
    
    reviews.forEach(review => {
      if (!repoStats[review.repository]) {
        repoStats[review.repository] = {
          name: review.repository,
          total_reviews: 0,
          total_cost: 0,
          last_review: review.timestamp,
          review_types: {}
        };
      }
      
      const repo = repoStats[review.repository];
      repo.total_reviews++;
      repo.total_cost += review.total_cost;
      
      if (new Date(review.timestamp) > new Date(repo.last_review)) {
        repo.last_review = review.timestamp;
      }
      
      repo.review_types[review.review_type] = (repo.review_types[review.review_type] || 0) + 1;
    });
    
    // Calculate averages
    const repositories = Object.values(repoStats).map(repo => ({
      ...repo,
      average_cost: repo.total_cost / repo.total_reviews
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(repositories)
    };
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch repositories' })
    };
  }
};