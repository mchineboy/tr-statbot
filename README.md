# StatBot

A statistics tracking bot for TreesRadio that monitors chat messages, presence, and song plays. It stores data in Firebase Firestore and provides statistics to users on demand.

## Architecture

- **Continuous Service**: StatBot runs as a continuously running service to listen for real-time events
- **Storage**: Uses Firebase Firestore for data persistence
- **Communication**: Connects to Firebase Realtime Database for event monitoring

## Project Structure

```text
statbot/
├── model/                  # Data model definitions
│   ├── index.ts            # Model exports
│   ├── chat-message.ts     # Chat message model
│   ├── patreon.ts          # Patreon model
│   ├── playing.ts          # Playing model
│   └── ...                 # Other model definitions
│
├── lib/                    # Core libraries
│   ├── firebase.ts         # Firebase Realtime Database connection
│   ├── firestore.ts        # Firestore connection
│   ├── firestore-stats.ts  # Firestore implementation
│   ├── patreon.ts          # Patreon integration
│   └── util/
│       ├── console-helper.ts # Console logging utilities
│       └── zod-helper.ts   # Zod validation helpers
│
├── statbot/                # StatBot implementation
│   ├── index.ts            # Main StatBot module
│   └── modules/
│       ├── index.ts        # Base Listener class
│       ├── chat.ts         # Chat listener
│       ├── playing.ts      # Playing listener
│       ├── presence.ts     # Presence listener
│       └── stats.ts        # Stats gathering
│
├── index.ts                # Entry point
├── env.ts                  # Environment configuration
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript configuration
├── Dockerfile              # Docker container definition
└── deploy-to-cloud-run.sh  # Deployment script
```

## Environment Variables

Create a `.env` file with the following variables:

```bash
NODE_ENV=development
FBASE_SERVICE={"type":"service_account",...} # Firebase service account JSON
PATREON_TOKEN=your_patreon_token
CAMPAIGN_ID=your_campaign_id
OF_PATREON_TOKEN=your_other_patreon_token
OF_CAMPAIGN_ID=your_other_campaign_id
```

## Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start in development mode:

   ```bash
   npm run dev
   ```

## Deployment Options

### Option 1: Docker Deployment Locally

1. Build the Docker image:

   ```bash
   npm run docker:build
   ```

2. Run the container:

   ```bash
   npm run docker:run
   ```

### Option 2: Google Cloud Run Deployment

1. Ensure you have the Google Cloud SDK installed and configured.

2. Edit the `deploy-to-cloud-run.sh` script and update the variables:
   - `PROJECT_ID`: Your Google Cloud project ID
   - `SERVICE_NAME`: Name for your Cloud Run service
   - `REGION`: GCP region to deploy to

3. Make the script executable:

   ```bash
   chmod +x deploy-to-cloud-run.sh
   ```

4. Run the deployment:

   ```bash
   ./deploy-to-cloud-run.sh
   ```

## Features

- Tracks chat messages, user presence, and song plays
- Provides statistics via chat commands
- Patreon integration for subscriber-only features
- Automatic data collection for opted-in users

## Command List

- `:ping` - Test if the bot is online
- `:optin` - Opt in to statistics collection
- `:optout` - Opt out of statistics collection
- `:status` - Check your opt-in status
- `:stats` - Get your personal statistics

## Technical Notes

- Built with Node.js 22 and TypeScript
- Uses Firebase Admin SDK for Firestore and Realtime Database access
- Implements a continuous service model with health checks
- Designed to run in Docker containers for portability

## Migration from PostgreSQL

This project was migrated from PostgreSQL to Firestore for improved integration with Firebase. The data storage approach was modified to utilize Firestore collections while maintaining the same statistics gathering functionality.
