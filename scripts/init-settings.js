#!/usr/bin/env node

const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

// Configure AWS
const client = new DynamoDBClient({
  region: process.env.MY_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  }
});

const initialSettings = {
  organization: 'candlefish-ai',
  monthly_budget: 5000,
  per_repo_daily: 100,
  per_pr_maximum: 50,
  default_review_type: 'comprehensive',
  auto_incremental: true,
  skip_patterns: ['*.test.js', '*.spec.ts', '*.md'],
  alert_thresholds: {
    daily: 300,
    weekly: 1500,
    monthly: 4000
  },
  alert_threshold_percentage: 80,
  alert_enabled: true,
  alert_emails: ['patrick@candlefish.ai', 'tyler@candlefish.ai', 'aaron@candlefish.ai'],
  authorized_users: ['aspenas', 'tyler-candlefish', 'aaron-candlefish'],
  slack_webhook_url: '',
  notification_webhook: ''
};

async function initSettings() {
  console.log('🚀 Initializing organization settings...');
  
  try {
    const params = {
      TableName: 'claude-review-settings',
      Item: marshall(initialSettings)
    };
    
    await client.send(new PutItemCommand(params));
    
    console.log('✅ Settings initialized successfully!');
    console.log('\n📋 Settings Summary:');
    console.log(`   Organization: ${initialSettings.organization}`);
    console.log(`   Monthly Budget: $${initialSettings.monthly_budget}`);
    console.log(`   Alert Threshold: ${initialSettings.alert_threshold_percentage}%`);
    console.log(`   Authorized Users: ${initialSettings.authorized_users.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error initializing settings:', error.message);
    process.exit(1);
  }
}

// Run initialization
initSettings();