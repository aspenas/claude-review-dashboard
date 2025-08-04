#!/usr/bin/env node

const AWS = require('@aws-sdk/client-dynamodb');
const { DynamoDBClient, ScanCommand, PutItemCommand, BatchWriteItemCommand } = AWS;
const { marshall } = require('@aws-sdk/util-dynamodb');

// Configure AWS
const client = new DynamoDBClient({
  region: process.env.MY_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  }
});

const TABLE_NAME = 'claude-review-usage';

// Sample historical data for candlefish-ai repositories
const historicalData = [
  // Platform API reviews
  { repository: 'platform-api', date: '2025-01-15', cost: 156.75, reviews: 12, model: 'claude-opus-4-20250514' },
  { repository: 'platform-api', date: '2025-01-16', cost: 98.50, reviews: 8, model: 'claude-opus-4-20250514' },
  { repository: 'platform-api', date: '2025-01-17', cost: 125.25, reviews: 10, model: 'claude-opus-4-20250514' },
  
  // Frontend app reviews
  { repository: 'frontend-app', date: '2025-01-15', cost: 87.30, reviews: 7, model: 'claude-opus-4-20250514' },
  { repository: 'frontend-app', date: '2025-01-16', cost: 112.45, reviews: 9, model: 'claude-opus-4-20250514' },
  { repository: 'frontend-app', date: '2025-01-17', cost: 95.80, reviews: 8, model: 'claude-opus-4-20250514' },
  
  // Mobile app reviews
  { repository: 'mobile-app', date: '2025-01-15', cost: 65.20, reviews: 5, model: 'claude-opus-4-20250514' },
  { repository: 'mobile-app', date: '2025-01-16', cost: 78.90, reviews: 6, model: 'claude-opus-4-20250514' },
  { repository: 'mobile-app', date: '2025-01-17', cost: 82.35, reviews: 7, model: 'claude-opus-4-20250514' },
  
  // Infrastructure reviews
  { repository: 'infrastructure', date: '2025-01-15', cost: 143.60, reviews: 11, model: 'claude-opus-4-20250514' },
  { repository: 'infrastructure', date: '2025-01-16', cost: 167.25, reviews: 13, model: 'claude-opus-4-20250514' },
  { repository: 'infrastructure', date: '2025-01-17', cost: 134.80, reviews: 10, model: 'claude-opus-4-20250514' },
];

async function createReviewRecord(data, index) {
  const timestamp = new Date(`${data.date}T12:00:00Z`).toISOString();
  const reviewId = `rev_${data.repository}_${Date.parse(timestamp)}_${index}`;
  
  // Calculate token usage based on cost
  // Cost = (input_tokens * 0.015 + output_tokens * 0.075) / 1000
  // Assume 80% input, 20% output ratio
  const totalTokens = Math.floor((data.cost * 1000) / 0.027); // Weighted average rate
  const inputTokens = Math.floor(totalTokens * 0.8);
  const outputTokens = Math.floor(totalTokens * 0.2);
  
  return {
    review_id: reviewId,
    timestamp: timestamp,
    organization: 'candlefish-ai',
    repository: data.repository,
    pr_number: Math.floor(Math.random() * 500) + 100, // Random PR number
    model: data.model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_cost: data.cost / data.reviews, // Cost per review
    review_type: ['standard', 'incremental', 'security'][Math.floor(Math.random() * 3)],
    duration_seconds: Math.random() * 60 + 20, // 20-80 seconds
    ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days TTL
  };
}

async function importData() {
  console.log('🚀 Starting historical data import...');
  
  try {
    // First, check if table exists and has data
    const scanResult = await client.send(new ScanCommand({
      TableName: TABLE_NAME,
      Limit: 1
    }));
    
    if (scanResult.Items && scanResult.Items.length > 0) {
      console.log('⚠️  Table already contains data. Skipping import to avoid duplicates.');
      return;
    }
    
    // Convert historical data to review records
    const reviews = [];
    let reviewIndex = 0;
    for (const data of historicalData) {
      for (let i = 0; i < data.reviews; i++) {
        reviews.push(await createReviewRecord(data, reviewIndex++));
      }
    }
    
    console.log(`📊 Generated ${reviews.length} review records`);
    
    // Batch write to DynamoDB (25 items at a time)
    const chunks = [];
    for (let i = 0; i < reviews.length; i += 25) {
      chunks.push(reviews.slice(i, i + 25));
    }
    
    for (const [index, chunk] of chunks.entries()) {
      const params = {
        RequestItems: {
          [TABLE_NAME]: chunk.map(item => ({
            PutRequest: {
              Item: marshall(item)
            }
          }))
        }
      };
      
      await client.send(new BatchWriteItemCommand(params));
      console.log(`✅ Imported batch ${index + 1}/${chunks.length}`);
    }
    
    console.log('🎉 Historical data import completed successfully!');
    
    // Summary statistics
    const totalCost = historicalData.reduce((sum, d) => sum + d.cost, 0);
    const totalReviews = historicalData.reduce((sum, d) => sum + d.reviews, 0);
    
    console.log('\n📈 Import Summary:');
    console.log(`   Total Reviews: ${totalReviews}`);
    console.log(`   Total Cost: $${totalCost.toFixed(2)}`);
    console.log(`   Average Cost per Review: $${(totalCost / totalReviews).toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Error importing data:', error.message);
    process.exit(1);
  }
}

// Run import
importData();