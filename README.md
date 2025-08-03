# Claude Review Dashboard

Organization-wide cost monitoring and analytics dashboard for Claude AI code reviews across all candlefish.ai projects.

## Features

- **Real-time Cost Tracking**: Monitor Claude API usage costs in real-time
- **Repository Analytics**: Track review patterns across all repositories
- **Budget Management**: Set and monitor monthly budgets with alerts
- **Historical Data**: Import and analyze historical review data
- **GitHub Integration**: Secure OAuth authentication for authorized users
- **Beautiful UI**: Modern, responsive design with smooth animations

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Charts**: Chart.js + React-Spring animations
- **Backend**: Netlify Functions (serverless)
- **Database**: AWS DynamoDB
- **Authentication**: GitHub OAuth
- **Deployment**: Netlify with GitHub Actions

## Live Demo

🚀 **[View Dashboard](https://beamish-froyo-ed37ee.netlify.app)**

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│  React Frontend │────▶│ Netlify Functions│────▶│  AWS DynamoDB   │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                         │
         │                       │                         │
         ▼                       ▼                         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  GitHub OAuth   │     │  AWS Secrets     │     │ Claude API Data │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Cost Tracking

Claude Review costs are calculated as:
- **Input tokens**: $0.015 per 1K tokens
- **Output tokens**: $0.075 per 1K tokens

The dashboard tracks:
- Total monthly spend
- Cost per repository
- Cost per review type
- Daily cost trends
- Budget utilization

## Security

- GitHub OAuth restricted to authorized users (Aaron, Tyler, Patrick)
- All secrets stored in AWS Secrets Manager
- DynamoDB access via IAM roles
- HTTPS-only communication
- Environment variables prefixed with `MY_AWS_*` to avoid Netlify reserved names

## Local Development

```bash
# Clone the repository
git clone https://github.com/aspenas/claude-review-dashboard.git
cd claude-review-dashboard

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

## Environment Variables

Create a `.env.local` file with:

```env
VITE_API_ENDPOINT=/.netlify/functions
VITE_AWS_REGION=us-east-1

# For local Netlify Functions testing
MY_AWS_ACCESS_KEY_ID=your-access-key
MY_AWS_SECRET_ACCESS_KEY=your-secret-key
MY_AWS_REGION=us-east-1
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
ANTHROPIC_API_KEY=your-anthropic-api-key
```

## Deployment

The dashboard automatically deploys to Netlify on push to main branch via GitHub Actions.

### Manual Deployment

```bash
# Build the application
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist --functions=netlify/functions
```

## API Endpoints

All API endpoints are served via Netlify Functions at `/.netlify/functions/`:

- `GET /auth` - GitHub OAuth callback
- `GET /reviews` - Fetch recent reviews
- `GET /repositories` - Get repository statistics
- `GET /costs/summary` - Get cost summary
- `GET /settings` - Fetch organization settings
- `PATCH /settings` - Update settings
- `POST /costs/report` - Trigger cost report
- `GET /health` - Health check endpoint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

Claude will automatically review your PR!

## License

MIT License - see LICENSE file for details

## Support

For issues or questions, please open a GitHub issue or contact the candlefish.ai team.

---

Built with ❤️ by the candlefish.ai team