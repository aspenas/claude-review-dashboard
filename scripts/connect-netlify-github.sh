#!/bin/bash

# Connect Netlify site to GitHub repository
echo "Connecting Netlify site to GitHub repository..."

# Install Netlify CLI if not already installed
if ! command -v netlify &> /dev/null; then
    echo "Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Link the site
netlify link --id beamish-froyo-ed37ee

# Configure build settings
netlify sites:update beamish-froyo-ed37ee \
  --build-cmd "npm run build" \
  --dir "dist" \
  --functions-dir "netlify/functions" \
  --repo "https://github.com/aspenas/claude-review-dashboard"

# Set up continuous deployment
netlify init --manual

echo "✅ Netlify site connected to GitHub repository!"
echo "🚀 Continuous deployment is now enabled"
echo "📝 Every push to main branch will trigger a new deployment"