#!/bin/sh
set -x
mkdir -p /app/server/public
# Build the client application
echo "Building client application..."
npm run build

# Start the server in production mode
echo "Starting server..."
npm run start