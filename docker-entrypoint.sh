#!/bin/sh

# Run build in production mode
npm run build

# Create directory structure that vite.ts expects
mkdir -p /app/server/public
cp -r /app/dist/client/* /app/server/public/

# Start the server
npm run start