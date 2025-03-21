FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Make the entrypoint script executable
RUN chmod +x docker-entrypoint.sh

# Expose the port the server runs on
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production

# Use the entrypoint script to build and start the application
CMD ["./docker-entrypoint.sh"]