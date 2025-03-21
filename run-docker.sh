#!/bin/bash

echo "Starting KubeCLI with Docker Compose..."
docker-compose up -d
echo "KubeCLI is now running at http://localhost:5000"
echo "To stop the server, run: docker-compose down"