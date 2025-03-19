#!/bin/bash
# Script to deploy statbot to Google Cloud Run

# Set these variables
PROJECT_ID="treesradio-live"
SERVICE_NAME="statbot-service"
REGION="us-central1"

# Build and push the Docker image to Google Container Registry
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

source .env
# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 1 \
  --no-allow-unauthenticated \
  --env-vars-file .env.yaml

echo "Deployment complete!"
echo "The service will remain running continuously even without traffic."