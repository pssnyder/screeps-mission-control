#!/bin/bash

# Screeps Mission Control - Setup Script
# Run this after getting your API tokens

echo "🚀 Screeps Mission Control - Setup"
echo "===================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create .env file with tokens first."
    exit 1
fi

# Source .env to check for tokens
source .env

echo "✓ .env file found"
echo ""

# Check for required tokens
MISSING=0

if [ -z "$SCREEPS_TOKEN" ] || [ "$SCREEPS_TOKEN" = "" ]; then
    echo "❌ SCREEPS_TOKEN missing in .env"
    MISSING=1
else
    echo "✓ SCREEPS_TOKEN configured"
fi

if [ -z "$GITHUB_PAT" ] || [ "$GITHUB_PAT" = "" ]; then
    echo "❌ GITHUB_PAT missing in .env"
    echo "   Generate at: https://github.com/settings/tokens"
    echo "   Required scope: repo"
    MISSING=1
else
    echo "✓ GITHUB_PAT configured"
fi

if [ -z "$CLAUDE_API_KEY" ] || [ "$CLAUDE_API_KEY" = "" ]; then
    echo "❌ CLAUDE_API_KEY missing in .env"
    echo "   Generate at: https://console.anthropic.com/"
    MISSING=1
else
    echo "✓ CLAUDE_API_KEY configured"
fi

echo ""

if [ $MISSING -eq 1 ]; then
    echo "⚠️  Please add missing tokens to .env file"
    echo "See DEPLOYMENT.md for details"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "📦 Installing Cloud Functions dependencies..."
cd functions
npm install
cd ..

echo ""
echo "🔐 Logging into Firebase..."
firebase login

echo ""
echo "🎯 Setting Firebase project..."
firebase use rts-labs-f3981

echo ""
echo "🔒 Setting Cloud Function secrets..."
echo ""
echo "Setting SCREEPS_TOKEN..."
echo "$SCREEPS_TOKEN" | firebase functions:secrets:set SCREEPS_TOKEN

echo ""
echo "Setting GITHUB_PAT..."
echo "$GITHUB_PAT" | firebase functions:secrets:set GITHUB_PAT

echo ""
echo "Setting CLAUDE_API_KEY..."
echo "$CLAUDE_API_KEY" | firebase functions:secrets:set CLAUDE_API_KEY

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Get Firebase web config: firebase apps:sdkconfig web"
echo "2. Update public/js/analytics-dashboard.js with firebaseConfig"
echo "3. Update public/js/colony-management.js with firebaseConfig"
echo "4. Create admin user in Firebase Console"
echo "5. Run: firebase deploy"
echo ""
