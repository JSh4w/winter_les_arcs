#!/bin/bash

# Clear Messages Script
# Usage: ./clear-messages.sh [environment]
# environment: local (default) or production

ENVIRONMENT=${1:-local}

if [ "$ENVIRONMENT" = "production" ]; then
    API_URL="https://winter-les-arcs.onrender.com"
    echo "🚀 Clearing messages from PRODUCTION..."
else
    API_URL="http://localhost:3000"
    echo "💻 Clearing messages from LOCAL..."
fi

ADMIN_KEY="winter-party-admin-2025"

echo "🗑️  Sending clear request..."

response=$(curl -s -X DELETE "$API_URL/dashboard_delete" \
  -H "x-admin-key: $ADMIN_KEY" \
  -w "\n%{http_code}")

http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo "✅ Success! $body"
else
    echo "❌ Failed with status $http_code"
    echo "$body"
fi
